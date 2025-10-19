// filepath: src/features/chat/pages/AdminChatDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchConversations,
  fetchConversationDetails,
  sendAdminReply,
  addAdminNote,
  deleteConversation,
  closeConversation,
  updateAdminFilters,
  updateAdminPagination,
  clearError,
} from '../slices/chatSlice';
import { useChat } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';
import { Search, Filter, MessageCircle, User, Clock, Trash2, XCircle, RefreshCw } from 'lucide-react';

const AdminChatDashboard = () => {
  const dispatch = useDispatch();
  const {
    conversations,
    selectedConversation,
    status,
    error,
    filters,
    pagination
  } = useSelector((state) => state.chat.admin);
  
  const isTyping = useSelector((state) => state.chat.isTyping);
  const [noteText, setNoteText] = useState('');
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [statusFilter, setStatusFilter] = useState(filters.status);

  // Use real-time updates for selected conversation
  useChat(selectedConversation?.uuid);

  // Load conversations on mount and when filters change
  useEffect(() => {
    dispatch(fetchConversations({
      search: filters.search,
      status: filters.status !== 'all' ? filters.status : undefined,
      page: pagination.page,
      limit: pagination.limit
    }));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(updateAdminFilters({ search: searchTerm }));
        dispatch(updateAdminPagination({ page: 1 })); // Reset to first page
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, filters.search]);

  const handleSelectConversation = useCallback((conversation) => {
    dispatch(fetchConversationDetails(conversation.uuid));
  }, [dispatch]);

  const handleAdminSend = useCallback(({ message, file }) => {
  if (!selectedConversation) return;
  dispatch(sendAdminReply({ 
    conversationUuid: selectedConversation.uuid, 
    message, 
    file 
  }));
}, [dispatch, selectedConversation]);


  const handleAddNote = useCallback(() => {
  if (!selectedConversation || !noteText.trim()) return;
  dispatch(addAdminNote({ 
    conversationUuid: selectedConversation.uuid, 
    note: noteText 
  }));
  setNoteText('');
}, [dispatch, selectedConversation, noteText]);


  const handleDelete = useCallback(() => {
    if (!selectedConversation) return;
    
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      dispatch(deleteConversation(selectedConversation.uuid));
    }
  }, [dispatch, selectedConversation]);

  const handleClose = useCallback(() => {
  if (!selectedConversation) return;
  
  if (window.confirm('Are you sure you want to close this conversation?')) {
    dispatch(closeConversation(selectedConversation.uuid));
  }
}, [dispatch, selectedConversation]);


  const handleRefresh = useCallback(() => {
    dispatch(fetchConversations({
      search: filters.search,
      status: filters.status !== 'all' ? filters.status : undefined,
      page: pagination.page,
      limit: pagination.limit
    }));
  }, [dispatch, filters, pagination]);

  const handleStatusFilterChange = useCallback((newStatus) => {
    setStatusFilter(newStatus);
    dispatch(updateAdminFilters({ status: newStatus }));
    dispatch(updateAdminPagination({ page: 1 }));
  }, [dispatch]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const text = lastMessage.text || lastMessage.message || '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  };

  const clearErrorHandler = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Conversations</h1>
            <button
              onClick={handleRefresh}
              disabled={status === 'loading'}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Refresh conversations"
            >
              <RefreshCw size={18} className={status === 'loading' ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filters */}
          <div className="flex space-x-2 mb-3">
            {['all', 'open', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`flex-1 px-3 py-1 text-sm rounded-full capitalize ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {status === 'loading' && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border-r-2 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {conversation.name || 'Anonymous'}
                      </span>
                    </div>
                    {conversation.status === 'closed' && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">
                    {conversation.contact}
                  </div>
                  
                  <div className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {getLastMessagePreview(conversation)}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{formatTime(conversation.updatedAt || conversation.createdAt)}</span>
                    </div>
                    {conversation.messages && (
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {conversation.messages.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Conversation Details */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Conversation with {selectedConversation.name || 'Anonymous'}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedConversation.contact}</p>
                  {selectedConversation.status && (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      selectedConversation.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedConversation.status}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {selectedConversation.status === 'open' && (
                    <button
                      onClick={handleClose}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                      <span>Close</span>
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="max-w-4xl mx-auto">
                {(selectedConversation.messages || []).map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    currentUser={selectedConversation.name}
                  />
                ))}
                {isTyping && <TypingIndicator />}
              </div>
            </div>

            {/* Admin Reply Input */}
            <div className="bg-white border-t p-4">
              <div className="max-w-4xl mx-auto">
                <ChatInput onSend={handleAdminSend} />
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white border-t p-4">
              <div className="max-w-4xl mx-auto">
                <h3 className="font-semibold text-gray-900 mb-3">Internal Notes</h3>
                <div className="flex space-x-2 mb-3">
                  <textarea
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add an internal note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors self-start"
                  >
                    Add Note
                  </button>
                </div>
                
                {/* Notes List */}
                <div className="space-y-2">
                  {(selectedConversation.notes || []).map((note) => (
                    <div 
                      key={note.id} 
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-yellow-800">Admin Note</span>
                        <span className="text-xs text-yellow-600">
                          {formatTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">{note.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
              <p>Select a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm z-50">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={clearErrorHandler}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatDashboard;