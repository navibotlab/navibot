'use client';

import { useState, useRef, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, RotateCcw, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// Componente de animação "Digitando..."
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2 bg-[#1A1D24] rounded-lg">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
  </div>
);

// Este é o componente da página do servidor
export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  // Usar React.use para desembrulhar os parâmetros
  const { id: agentId } = use(params);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data);
        // Adicionar mensagem inicial do agente se existir
        if (data.initialMessage) {
          setMessages([{ 
            role: 'assistant', 
            content: data.initialMessage,
            timestamp: new Date().toLocaleString('pt-BR')
          }]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
    }
  };

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const formattedInput = input.trim();

    const newMessage: Message = { 
      role: 'user', 
      content: formattedInput,
      timestamp: new Date().toLocaleString('pt-BR')
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          message: formattedInput,
          messageType: 'text'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toLocaleString('pt-BR')
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error('Resposta inválida do servidor');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, não consegui responder. Tente novamente em alguns segundos.',
        timestamp: new Date().toLocaleString('pt-BR')
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    // Limpar mensagens e reiniciar com a mensagem inicial
    setMessages([]);
    await fetchAgent();
  };

  return (
    <div className="flex flex-col h-screen bg-[#0F1115]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-800 bg-[#0F1115] h-16">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin')}
            className="text-gray-400 hover:text-[#0F1115] hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1A1D24] flex items-center justify-center">
              {agent?.imageUrl && !imageError ? (
                <Image
                  src={agent.imageUrl.startsWith('/') ? agent.imageUrl : `/images/avatar/avatar.png`}
                  alt={agent.name || "Agente"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    setImageError(true);
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/avatar/avatar.png';
                    target.onerror = null;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold">{agent?.name?.[0] || 'A'}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{agent?.name || "Agente sem nome"}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            className="text-gray-400 hover:text-[#0F1115] hover:bg-white transition-colors"
            title="Limpar conversa"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/editar-agente/${agentId}`)}
            className="text-gray-400 hover:text-[#0F1115] hover:bg-white transition-colors"
            title="Configurações do agente"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#1A1D24] flex items-center justify-center mr-2">
                {agent?.imageUrl && !imageError ? (
                  <Image
                    src={agent.imageUrl.startsWith('/') ? agent.imageUrl : `/images/avatar/avatar.png`}
                    alt={agent.name || "Agente"}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      setImageError(true);
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/avatar/avatar.png';
                      target.onerror = null;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{agent?.name?.[0] || 'A'}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col max-w-[80%]">
              <div
                className={`rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1A1D24] text-gray-100'
                }`}
              >
                {message.content}
              </div>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-400">{message.timestamp}</span>
                  <button className="text-xs text-gray-400 hover:text-white">
                    Revisar resposta
                  </button>
                  <button className="text-xs text-gray-400 hover:text-white">
                    Inspecionar resposta
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#1A1D24] flex items-center justify-center mr-2">
              {agent?.imageUrl && !imageError ? (
                <Image
                  src={agent.imageUrl.startsWith('/') ? agent.imageUrl : `/images/avatar/avatar.png`}
                  alt={agent.name || "Agente"}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    setImageError(true);
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/avatar/avatar.png';
                    target.onerror = null;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{agent?.name?.[0] || 'A'}</span>
                </div>
              )}
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="sticky bottom-0 p-4 border-t border-gray-800 bg-[#0F1115]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-[#1A1D24] border-gray-800 text-white"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
} 