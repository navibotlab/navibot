import { UserCircle, Search, ChevronDown, ArrowUpDown, Filter, MessageSquarePlus, MessageSquare, Send, Rocket, Tag } from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Conversation } from '../hooks/useConversations';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  isLoading,
  searchTerm,
  onSearchChange,
  onSelectConversation
}: ConversationListProps) {
  // Formatar número de telefone
  const formatPhone = (phone: string) => {
    return phone;
  };

  // Removendo logs sensíveis que expõem dados no console
  const hasLabels = conversations.some(conv => conv.labels && conv.labels.length > 0);

  // Filtrar conversas pelo termo de busca
  const filteredConversations = conversations.filter(conv =>
    (conv.leadName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    conv.leadPhone.includes(searchTerm)
  );

  return (
    <div className="w-80 border-r border-gray-800 flex flex-col">
      <div className="h-[72px] border-b border-gray-800 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-white">Todos</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquarePlus className="h-7 w-7 text-gray-400 ml-2" />
          </div>
        </div>
      </div>
      <div className="h-[36px] border-b border-gray-800 flex items-center px-4 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#1A1D24] border-gray-700 h-7 min-h-0"
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-400 hover:text-[#1A1D24]"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
              <p>Ordenar conversas por</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-400 hover:text-[#1A1D24]"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
              <p>Filtrar conversas por</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner className="h-6 w-6" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center p-4 text-gray-400">
            Nenhuma conversa encontrada
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-[#1A1D24] ${
                selectedConversation?.id === conv.id ? 'bg-[#1A1D24]' : ''
              }`}
              onClick={() => onSelectConversation(conv)}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  {conv.leadPhoto ? (
                    <img 
                      src={conv.leadPhoto} 
                      alt={conv.leadName || 'Lead'} 
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-avatar.png';
                      }}
                    />
                  ) : (
                    <UserCircle className="h-10 w-10 text-gray-400" />
                  )}
                  
                  {/* Ícone do canal */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border border-gray-700 shadow-md">
                          {conv.channel === 'disparaja' ? (
                            <Rocket className="h-3 w-3 text-blue-400" />
                          ) : (
                            <BsWhatsapp className="h-3 w-3 text-green-400" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800 text-xs">
                        <p>{conv.channel === 'disparaja' ? 'Canal: DisparaJá' : 'Canal: WhatsApp Cloud'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-white truncate">
                        {conv.leadName || formatPhone(conv.leadPhone)}
                      </p>
                      {conv.agentName && (
                        <p className="text-xs text-gray-400">
                          Agente: {conv.agentName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {conv.lastMessageTime ? format(new Date(conv.lastMessageTime), 'HH:mm') : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate mb-2">{conv.lastMessage || ''}</p>
                  
                  {/* Exibir etiquetas */}
                  {(() => {
                    // Removendo log que expõe dados sensíveis
                    
                    // Verificar se há etiquetas para exibir
                    if (conv.labels && conv.labels.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conv.labels.slice(0, 3).map(label => (
                            <Badge 
                              key={label.id}
                              className="px-1.5 py-0.5 text-[10px] font-normal"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                          {conv.labels.length > 3 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    className="px-1 py-0.5 text-[10px] font-normal bg-gray-700"
                                  >
                                    +{conv.labels.length - 3}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800 text-xs">
                                  <div className="flex flex-col gap-1">
                                    {conv.labels.slice(3).map(label => (
                                      <div key={label.id} className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                                        <span>{label.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 