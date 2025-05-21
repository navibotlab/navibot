import { useState, useEffect } from 'react';

export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadPhoto: string | null; // URL da foto do lead
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  workspaceId: string;
  agentId: string | null;
  agentName: string | null;
  agentImageUrl: string | null;
  channel?: string; // Canal usado pela conversa: "whatsapp-cloud" ou "disparaja"
  labels?: { id: string; name: string; color: string; description?: string }[]; // Etiquetas associadas ao lead
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Buscar conversas
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/crm/conversations');
      if (!response.ok) throw new Error('Erro ao buscar conversas');
      const data = await response.json();
      
      // Removendo os logs que expõem dados sensíveis
      console.log(`Conversas carregadas: ${data.length} itens`);
      
      setConversations(data);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar conversas pelo termo de busca
  const filteredConversations = conversations.filter(conv =>
    (conv.leadName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    conv.leadPhone.includes(searchTerm)
  );

  // Efeito para buscar conversas inicialmente e a cada 30 segundos
  useEffect(() => {
    fetchConversations();
    
    // Atualizar lista de conversas a cada 30 segundos
    const interval = setInterval(fetchConversations, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    conversations: filteredConversations,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedConversation,
    setSelectedConversation,
    refreshConversations: fetchConversations
  };
} 