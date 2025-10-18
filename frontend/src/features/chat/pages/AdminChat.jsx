// src/features/chat/pages/AdminChat.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useStaffChat } from '../hooks/useChat';
import AdminConversationsList from '../components/AdminConversationsList';
import AdminConversationView from '../components/AdminConversationView';
import AdminChatHeader from '../components/AdminChatHeader';
import AdminChatSidebar from '../components/AdminChatSidebar';

const AdminChat = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', // all, open, closed, assigned, unassigned
    search: '',
    dateRange: 'today' // today, yesterday, week, month, all
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    loadConversations,
    loadConversationDetails,
    sendMessage,
    deleteMessage,
    assignConversation,
    joinConversation,
    updateConversationStatus,
    clearError
  } = useStaffChat();

  // Load conversations on mount and when filters change
  useEffect(() => {
    loadConversationsWithFilters();
  }, [filters]);

  // Auto-refresh conversations
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadConversationsWithFilters();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  const loadConversationsWithFilters = useCallback(async () => {
    const params = {};
    
    if (filters.status !== 'all') {
      params.status = filters.status;
    }
    
    if (filters.search) {
      params.search = filters.search;
    }
    
    if (filters.dateRange !== 'all') {
      params.date_range = filters.dateRange;
    }

    await loadConversations(params);
  }, [filters, loadConversations]);

  const handleSelectConversation = async (conversationUuid) => {
    setSelectedConversation(conversationUuid);
    await loadConversationDetails(conversationUuid);
  };

  const handleAssignToMe = async () => {
    if (!selectedConversation) return;
    
    try {
      await assignConversation(selectedConversation);
      await loadConversationsWithFilters(); // Refresh list
    } catch (error) {
      console.error('Failed to assign conversation:', error);
    }
  };

  const handleJoinConversation = async () => {
    if (!selectedConversation) return;
    
    try {
      await joinConversation(selectedConversation);
      await loadConversationDetails(selectedConversation); // Reload details
    } catch (error) {
      console.error('Failed to join conversation:', error);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedConversation) return;
    
    try {
      await updateConversationStatus(selectedConversation, status);
      await loadConversationsWithFilters(); // Refresh list
      await loadConversationDetails(selectedConversation); // Reload details
    } catch (error) {
      console.error('Failed to update conversation status:', error);
    }
  };

  const handleSendMessage = async (messageData) => {
    if (!selectedConversation) return;
    
    try {
      await sendMessage(selectedConversation, messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleRefresh = () => {
    loadConversationsWithFilters();
    if (selectedConversation) {
      loadConversationDetails(selectedConversation);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (filters.status === 'assigned' && !conversation.assigned_to) return false;
    if (filters.status === 'unassigned' && conversation.assigned_to) return false;
    if (filters.status === 'open' && conversation.status === 'closed') return false;
    if (filters.status === 'closed' && conversation.status !== 'closed') return false;
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        conversation.created_by_name?.toLowerCase().includes(searchTerm) ||
        conversation.created_by_contact?.toLowerCase().includes(searchTerm) ||
        conversation.subject?.toLowerCase().includes(searchTerm) ||
        conversation.last_message_preview?.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <AdminChatHeader
        onRefresh={handleRefresh}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        conversationCount={filteredConversations.length}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AdminChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Conversations List */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-80' : 'w-96'
        } flex flex-col`}>
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <AdminConversationsList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoading}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <AdminConversationView
              conversation={currentConversation}
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSendMessage={handleSendMessage}
              onDeleteMessage={deleteMessage}
              onAssignToMe={handleAssignToMe}
              onJoinConversation={handleJoinConversation}
              onUpdateStatus={handleUpdateStatus}
              onClearError={clearError}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center text-gray-500 p-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Conversation Selected</h3>
                <p className="text-gray-500 max-w-sm">
                  Choose a conversation from the list to start chatting with customers and providing support.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;