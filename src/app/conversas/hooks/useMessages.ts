import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
  type: 'text' | 'image' | 'audio';
  mediaUrl?: string | null;
  isManual?: boolean;
}

// Armazenar conexões SSE ativas globalmente para evitar duplicação
const activeEventSources = new Map<string, EventSource>();

// Status do envio de mensagem
export type MessageSendStatus = 'idle' | 'sending' | 'sent' | 'error';

// Status de adição da mensagem ao thread do OpenAI
export type ThreadStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Ajusta o fuso horário para compensar a conversão automática para UTC
 * Subtrai 3 horas para o fuso horário Brasil (UTC-3)
 */
function adjustTimezoneBR(): Date {
  const date = new Date();
  date.setHours(date.getHours() - 3);
  return date;
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendStatus, setSendStatus] = useState<MessageSendStatus>('idle');
  const [sendError, setSendError] = useState<string | null>(null);
  const [threadStatus, setThreadStatus] = useState<ThreadStatus>('idle');
  const [threadError, setThreadError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Set para rastrear IDs de mensagens que já foram processadas
  const processedMessagesRef = useRef<Set<string>>(new Set());
  
  // Função para rolar para a última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Buscar mensagens - declarado primeiro para evitar erro de referência
  const fetchMessages = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/crm/conversations/${id}/messages`);
      if (!response.ok) throw new Error('Erro ao buscar mensagens');
      const data = await response.json();
      
      // Processar as mensagens recebidas e adicionar à nossa lista de IDs conhecidos
      data.forEach((msg: Message) => {
        processedMessagesRef.current.add(msg.id);
      });
      
      // Ordenar mensagens por timestamp (sem ajustes de fuso horário)
      // Como agora todos os timestamps no banco estão com o mesmo padrão de fuso horário
      const sortedMessages = [...data].sort((a: Message, b: Message) => {
        // Converter para timestamp Unix (milissegundos)
        const timeA = new Date(a.createdAt).valueOf();
        const timeB = new Date(b.createdAt).valueOf();
        
        // Comparação direta de timestamps
        return timeA - timeB;
      });
      
      // Definir as mensagens já ordenadas
      setMessages(sortedMessages);
      
      // Rolar para o fim após um pequeno delay para garantir renderização
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
    } catch (error) {
      // Silenciando erro
    } finally {
      setIsLoading(false);
    }
  }, [scrollToBottom]);

  // Função para adicionar uma mensagem de forma segura (sem duplicação)
  const addMessage = useCallback((newMsg: Message) => {
    // Verificar se já temos esta mensagem
    if (processedMessagesRef.current.has(newMsg.id)) {
      return;
    }
    
    // Marcar como processada e adicionar à nossa lista de IDs conhecidos
    processedMessagesRef.current.add(newMsg.id);
    
    // Em vez de tentar atualizar incrementalmente, vamos recarregar todas as mensagens
    // da conversa atual para garantir ordenação consistente
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  // Enviar mensagem
  const sendMessage = useCallback(async () => {
    if (!conversationId || !newMessage.trim()) return;

    // Resetar estados
    setSendStatus('sending');
    setSendError(null);
    setThreadStatus('pending');
    setThreadError(null);

    // Usar o timestamp ajustado para o fuso horário do Brasil
    const now = adjustTimezoneBR();
    const localTimestamp = now.toString();

    const message = {
      content: newMessage,
      sender: 'human' as const,
      isManual: true,
      createdAt: localTimestamp // Usando timestamp ajustado para o fuso horário Brasil
    };

    try {
      const response = await fetch(`/api/crm/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      const responseData = await response.json();

      if (response.ok) {
        setNewMessage('');
        setSendStatus('sent');
        
        // Verificar se a resposta contém informações sobre o envio para o WhatsApp
        if (responseData.whatsappStatus === 'error') {
          setSendError(responseData.whatsappError || 'Erro ao enviar mensagem para o WhatsApp');
          setSendStatus('error');
        }
        
        // Verificar status de adição da mensagem ao thread do OpenAI
        if (responseData.threadStatus) {
          setThreadStatus(responseData.threadStatus);
          if (responseData.threadStatus === 'error') {
            // Verificar se é um erro de run ativo
            if (responseData.threadMessage && responseData.threadMessage.includes("while a run")) {
              setThreadError('O assistente está processando uma resposta. Aguarde um momento e tente novamente.');
            } else {
              setThreadError(responseData.threadMessage || 'Erro ao adicionar mensagem ao contexto do assistente');
            }
          }
        }
      } else {
        setSendStatus('error');
        setSendError(responseData.error || 'Erro ao enviar mensagem');
        setThreadStatus('error');
        setThreadError('Falha na comunicação com o servidor');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setSendStatus('error');
      setSendError('Erro ao enviar mensagem. Tente novamente.');
      setThreadStatus('error');
      setThreadError('Falha na comunicação com o servidor');
    } finally {
      // Resetar o status após um tempo
      setTimeout(() => {
        if (setSendStatus) setSendStatus('idle');
        if (setThreadStatus) setThreadStatus('idle');
      }, 3000);
    }
  }, [conversationId, newMessage]);

  // Inicializar SSE
  const initializeSSE = useCallback((id: string) => {
    // Fechar conexão atual se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Verificar se já existe uma conexão ativa para esta conversa
    if (activeEventSources.has(id)) {
      const existingSource = activeEventSources.get(id)!;
      eventSourceRef.current = existingSource;
      return;
    }

    try {
      const eventSource = new EventSource(`/api/crm/conversations/${id}/sse`);
      
      eventSource.onmessage = (event) => {
        try {
          const newMessage = JSON.parse(event.data);
          
          if (newMessage.error) {
            // Removendo log de erro para não expor dados sensíveis
            return;
          }
          
          // Usar a função que recarrega todas as mensagens para manter a ordenação
          addMessage(newMessage);
        } catch (error) {
          // Silenciando erro
        }
      };

      eventSource.onerror = (error) => {
        // Silenciando erro da conexão SSE
        
        // Remover do mapa de conexões ativas
        activeEventSources.delete(id);
        
        // Tentar reconectar após um tempo
        setTimeout(() => {
          // Removendo log para evitar exposição de dados
          if (eventSourceRef.current === eventSource) {
            initializeSSE(id);
          }
        }, 5000);
      };

      // Armazenar referências
      eventSourceRef.current = eventSource;
      activeEventSources.set(id, eventSource);
    } catch (error) {
      // Silenciando erro
      activeEventSources.delete(id);
    }
  }, [addMessage]);

  // Efeito para rolar para o final quando as mensagens são atualizadas
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Efeito para inicializar SSE quando a conversa muda
  useEffect(() => {
    if (conversationId) {
      // Limpar o conjunto de mensagens quando mudamos de conversa
      processedMessagesRef.current.clear();
      
      fetchMessages(conversationId);
      initializeSSE(conversationId);

      // Resetar os estados de envio ao mudar de conversa
      setSendStatus('idle');
      setSendError(null);
      setThreadStatus('idle');
      setThreadError(null);
    }

    // Limpar quando o componente é desmontado ou a conversa muda
    return () => {
      if (eventSourceRef.current && conversationId) {
        // Não fechar a conexão, apenas remover a referência local
        // para permitir reutilização por outros componentes
        eventSourceRef.current = null;
      }
    };
  }, [conversationId, fetchMessages, initializeSSE]);

  // Limpar todas as conexões quando o componente é desmontado completamente
  useEffect(() => {
    return () => {
      // Esta limpeza só deve ocorrer quando o componente é completamente desmontado
      if (conversationId && eventSourceRef.current) {
        const source = eventSourceRef.current;
        // Verificar se não há outros componentes usando esta conexão
        setTimeout(() => {
          if (activeEventSources.get(conversationId) === source) {
            source.close();
            activeEventSources.delete(conversationId);
            // Removendo log para evitar expor o ID da conversa
          }
        }, 500);
      }
    };
  }, [conversationId]);

  return {
    messages,
    isLoading,
    newMessage,
    setNewMessage,
    sendMessage,
    messagesEndRef,
    sendStatus,
    sendError,
    threadStatus,
    threadError
  };
} 