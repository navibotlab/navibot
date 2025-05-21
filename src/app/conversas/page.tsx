'use client';

import { useConversations, Conversation } from './hooks/useConversations';
import { useMessages } from './hooks/useMessages';
import { useLead } from './hooks/useLead';
import { ConversationList } from './components/ConversationList';
import { MessageArea } from './components/MessageArea';
import { LeadInfoPanel } from './components/LeadInfoPanel';

export default function ChatAoVivoPage() {
  const {
    conversations,
    isLoading: isLoadingConversations,
    searchTerm,
    setSearchTerm,
    selectedConversation,
    setSelectedConversation
  } = useConversations();

  const {
    messages,
    isLoading: isLoadingMessages,
    newMessage,
    setNewMessage,
    sendMessage,
    messagesEndRef,
    sendStatus,
    sendError,
    threadStatus,
    threadError
  } = useMessages(selectedConversation?.id || null);

  const {
    leadInfo,
    isLoading: isLoadingLead,
    isExpanded: isLeadPanelExpanded,
    setIsExpanded: setIsLeadPanelExpanded,
    refreshLeadInfo
  } = useLead(selectedConversation?.leadId || null);

  // Selecionar conversa
  const handleSelectConversation = (conversation: Conversation | null) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="flex h-full">
      {/* Lista de Conversas */}
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        isLoading={isLoadingConversations}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSelectConversation={handleSelectConversation}
      />

      {/* Área da Conversa */}
      <MessageArea
        selectedConversation={selectedConversation}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        onSendMessage={sendMessage}
        sendStatus={sendStatus}
        sendError={sendError}
        threadStatus={threadStatus}
        threadError={threadError}
      />

      {/* Painel de Informações do Lead */}
      <LeadInfoPanel
        selectedConversationId={selectedConversation?.id || null}
        leadInfo={leadInfo}
        isLoadingLead={isLoadingLead}
        isExpanded={isLeadPanelExpanded}
        onToggleExpand={() => setIsLeadPanelExpanded(!isLeadPanelExpanded)}
        onLeadUpdate={refreshLeadInfo}
      />
    </div>
  );
} 