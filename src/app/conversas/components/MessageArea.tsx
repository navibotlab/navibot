import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Send, ArrowDown, Image, Paperclip, Smile, Zap, Signature, Mic, StickyNote, AlertCircle, Cloud, CloudOff, Loader, CalendarClock } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { formatPhone } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSendStatus, ThreadStatus } from '../hooks/useMessages';
import { Conversation as ConversationType } from '../hooks/useConversations';
import { format, isToday, isYesterday, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes personalizados para substituir o framer-motion
const FadeIn = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const SlideUp = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const SlideDown = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Componente para gerenciar grupo de animações
const AnimatedPresence = ({ 
  children, 
  mode = "sync" 
}: { 
  children: React.ReactNode;
  mode?: "sync" | "wait";
}) => {
  return <>{children}</>;
};

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
  type: 'text' | 'image' | 'audio';
  mediaUrl?: string | null;
  isManual?: boolean;
}

interface MessageAreaProps {
  selectedConversation: ConversationType | null;
  messages: Message[];
  isLoadingMessages: boolean;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  sendStatus?: MessageSendStatus;
  sendError?: string | null;
  threadStatus?: ThreadStatus;
  threadError?: string | null;
}

// Componente para exibir a data na linha do tempo
const DateDivider = ({ date }: { date: string }) => {
  const formattedDate = () => {
    const dateObj = parseISO(date);
    
    if (isToday(dateObj)) {
      return 'Hoje';
    } else if (isYesterday(dateObj)) {
      return 'Ontem';
    } else if (differenceInDays(new Date(), dateObj) < 7) {
      // Se for dentro da mesma semana, mostra o nome do dia
      return format(dateObj, 'EEEE', { locale: ptBR });
    } else {
      // Formato completo para datas mais antigas
      return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="flex justify-center my-4">
      <div className="bg-[#e2eaf9] text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
        {formattedDate()}
      </div>
    </div>
  );
};

// Componente para exibir atividades do sistema
const ActivityMessage = ({ content, timestamp }: { content: string; timestamp: string }) => {
  return (
    <div className="flex justify-center my-2">
      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full flex items-center">
        <span>{content}</span>
        <span className="ml-2 text-gray-400">{format(parseISO(timestamp), 'HH:mm')}</span>
      </div>
    </div>
  );
};

export function MessageArea({
  selectedConversation,
  messages,
  isLoadingMessages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  sendStatus = 'idle',
  sendError = null,
  threadStatus = 'idle',
  threadError = null
}: MessageAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messageContainerRef.current) {
      const { scrollHeight, clientHeight } = messageContainerRef.current;
      messageContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior
      });
    }
  };

  const checkIfNearBottom = () => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      const scrolledPosition = scrollTop + clientHeight;
      const isNear = scrollHeight - scrolledPosition < 100; // 100px threshold
      setIsNearBottom(isNear);
      setShowScrollButton(!isNear);
    }
  };

  // Monitora o scroll para mostrar/esconder o botão
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkIfNearBottom);
      return () => container.removeEventListener('scroll', checkIfNearBottom);
    }
  }, []);

  // Rola para o final quando as mensagens são atualizadas (apenas se estiver próximo do final)
  useEffect(() => {
    if (messages.length > 0 && isNearBottom) {
      scrollToBottom('instant');
    }
  }, [messages, isNearBottom]);

  // Rola para o final quando a conversa é alterada
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom('instant');
      setShowScrollButton(false);
    }
  }, [selectedConversation?.id]);

  // Função para ordenar as mensagens antes da renderização
  const getSortedMessages = () => {
    // Fazer uma cópia profunda das mensagens para evitar mutações acidentais
    const messagesCopy = JSON.parse(JSON.stringify(messages));

    // Ordenação simples por timestamp
    // Usamos timestamps em milissegundos para garantir comparação precisa
    return messagesCopy.sort((a: Message, b: Message) => {
      // Converter para timestamp Unix (milissegundos)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      // Ordenação por timestamp
      return dateA - dateB;
    });
  };

  // Na função getSortedMessages, adicione a lógica para agrupar mensagens por data
  const groupMessagesByDate = (messages: Message[]) => {
    if (!messages.length) return [];
    
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    const result: (Message | { type: 'date-divider'; date: string } | { type: 'activity'; content: string; timestamp: string })[] = [];
    
    let currentDate: Date | null = null;
    
    // Adicionar atividade de início de conversa se houver mensagens
    if (sortedMessages.length > 0) {
      const firstMessageDate = new Date(sortedMessages[0].createdAt);
      result.push({
        type: 'date-divider',
        date: sortedMessages[0].createdAt
      });
      result.push({
        type: 'activity',
        content: 'Conversa iniciada',
        timestamp: sortedMessages[0].createdAt
      });
    }
    
    sortedMessages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt);
      messageDate.setHours(0, 0, 0, 0);
      
      // Se for um novo dia, adicionar divisor de data
      if (!currentDate || !isSameDay(messageDate, currentDate)) {
        // Não adicionar outro divisor de data para a primeira mensagem, pois já adicionamos acima
        if (index > 0) {
          result.push({
            type: 'date-divider',
            date: message.createdAt
          });
        }
        currentDate = messageDate;
      }
      
      // Adicionar a mensagem
      result.push(message);
      
      // Adicionar atividade após mensagens do usuário para simular mudanças de contexto
      if (message.sender === 'user' && index < sortedMessages.length - 1 && sortedMessages[index + 1].sender !== 'user') {
        result.push({
          type: 'activity',
          content: 'Mensagem enviada',
          timestamp: message.createdAt
        });
      }
    });
    
    return result;
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col">
        <FadeIn className="flex items-center justify-center h-full text-gray-400">
          Selecione uma conversa para começar
        </FadeIn>
      </div>
    );
  }

  return (
    <FadeIn 
      className="flex-1 flex flex-col h-full"
      delay={0}
    >
      <SlideDown 
        className="p-4 border-b border-gray-800 h-[72px] flex items-center"
        delay={300}
      >
        <div className="flex items-center space-x-3">
          <UserCircle className="h-10 w-10 text-gray-400" />
          <div>
            <p className="font-medium text-white">
              {selectedConversation.leadName || 'Sem nome'}
            </p>
            <p className="text-sm text-gray-400">
              {formatPhone(selectedConversation.leadPhone)}
            </p>
          </div>
        </div>
      </SlideDown>
      
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent h-[calc(100vh-200px)] relative flex flex-col"
      >
        <AnimatedPresence mode="wait">
          {isLoadingMessages ? (
            <FadeIn delay={0}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-2 animate-pulse">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </FadeIn>
          ) : messages.length === 0 ? (
            <FadeIn
              className="flex items-center justify-center h-full text-gray-400"
            >
              Nenhuma mensagem encontrada
            </FadeIn>
          ) : (
            <FadeIn
              className="flex flex-col space-y-4"
              delay={200}
            >
              {/* Garantir que as mensagens estejam ordenadas cronologicamente antes de renderizar */}
              {groupMessagesByDate(messages).map((item, index) => {
                if ('type' in item && item.type === 'date-divider') {
                  return (
                    <DateDivider key={`date-${item.date}-${index}`} date={item.date} />
                  );
                } else if ('type' in item && item.type === 'activity') {
                  return (
                    <ActivityMessage 
                      key={`activity-${index}`} 
                      content={item.content} 
                      timestamp={item.timestamp} 
                    />
                  );
                } else {
                  // Item é uma mensagem normal
                  const message = item as Message;
                  return (
                    <SlideUp
                      key={message.id}
                      delay={index * 50}
                    >
                      <MessageItem
                        content={message.content}
                        sender={message.sender}
                        createdAt={message.createdAt}
                        type={message.type}
                        mediaUrl={message.mediaUrl}
                        userName={selectedConversation.leadName || 'Cliente'}
                        isManual={message.isManual}
                        agentName={selectedConversation.agentName || 'Assistente'}
                      />
                    </SlideUp>
                  );
                }
              })}
              <div ref={messagesEndRef} />

              <Button
                onClick={() => scrollToBottom()}
                className={cn(
                  "fixed bottom-24 right-8 rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg",
                  showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                )}
                size="icon"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </FadeIn>
          )}
        </AnimatedPresence>
      </div>

      <SlideUp 
        className="p-4 border-t border-gray-800"
        delay={300}
      >
        <div className="flex flex-col space-y-4">
          {/* Status de envio */}
          <AnimatedPresence>
            {sendStatus === 'error' && sendError && (
              <FadeIn
                className="bg-red-900/30 text-red-300 p-2 rounded-md flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{sendError}</span>
              </FadeIn>
            )}
            
            {/* Status da thread */}
            {threadStatus === 'error' && threadError && (
              <FadeIn
                className="bg-red-900/30 text-red-300 p-2 rounded-md flex items-center gap-2"
              >
                <CloudOff className="h-4 w-4" />
                <span className="text-sm">{threadError}</span>
              </FadeIn>
            )}

            {threadStatus === 'pending' && (
              <FadeIn
                className="flex items-center text-amber-500 text-xs"
              >
                <Loader className="inline-block h-3 w-3 mr-1 animate-spin" />
                Conectando ao assistente...
              </FadeIn>
            )}

            {threadStatus === 'success' && (
              <FadeIn
                className="flex items-center text-green-500 text-xs"
              >
                <Cloud className="inline-block h-3 w-3 mr-1" />
                Conectado ao assistente
              </FadeIn>
            )}
          </AnimatedPresence>
          
          {/* Novo layout do input de mensagens */}
          <div className="flex flex-col gap-1">
            {/* Input com botões de ação */}
            <div className="bg-[#f2f6fc] rounded-lg border border-gray-200 overflow-hidden">
              <Textarea
                value={newMessage}
                onChange={(e) => onNewMessageChange(e.target.value)}
                placeholder="Mensagem"
                className="border-none bg-transparent text-gray-700 placeholder:text-gray-400 min-h-[80px] py-4 px-4 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
              />
              
              {/* Barra de ferramentas */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Smile className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Emojis</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Paperclip className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Anexar arquivo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Image className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Enviar imagem</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Mic className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Enviar áudio</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Signature className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Ativar Assinatura</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <StickyNote className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Adicionar Nota</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Zap className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Respostas Rápidas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <CalendarClock className="h-5 w-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Agendar Mensagem</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <Button 
                    onClick={onSendMessage} 
                    className={`bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 flex items-center gap-2 ${
                      !newMessage.trim() || sendStatus === 'sending' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!newMessage.trim() || sendStatus === 'sending'}
                  >
                    {sendStatus === 'sending' ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Enviar
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SlideUp>
    </FadeIn>
  );
} 