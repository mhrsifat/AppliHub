import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchConversations,
  fetchAdminConversationWithMessages,
  sendAdminReply,
  addAdminNote,
  deleteConversation,
  closeConversation,
  markAsRead,
  assignConversation,
  joinConversation,
  updateAdminFilters,
  updateAdminPagination,
  clearError,
} from '../slices/chatSlice';
import { useChat } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';
import { Search, MessageCircle, User, Clock, Trash2, XCircle, RefreshCw, Mail, Eye, Menu, X, ArrowLeft } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useChat(selectedConversation?.uuid);

  useEffect(() => {
    dispatch(fetchConversations({
      search: filters.search,
      status: filters.status !== 'all' ? filters.status : undefined,
      page: pagination.page,
      limit: pagination.limit
    }));
  }, [dispatch, filters.search, filters.status, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(updateAdminFilters({ search: searchTerm }));
        dispatch(updateAdminPagination({ page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, filters.search]);

  const handleSelectConversation = useCallback((conversation) => {
    dispatch(fetchAdminConversationWithMessages(conversation.uuid));
    dispatch(markAsRead(conversation.uuid));
    setIsSidebarOpen(false);
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

  const handleAssign = useCallback(() => {
    if (!selectedConversation) return;
    dispatch(assignConversation(selectedConversation.uuid));
  }, [dispatch, selectedConversation]);

  const handleJoin = useCallback(() => {
    if (!selectedConversation) return;
    dispatch(joinConversation(selectedConversation.uuid));
  }, [dispatch, selectedConversation]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchConversations({
      search: filters.search,
      status: filters.status !== 'all' ? filters.status : undefined,
      page: pagination.page,
      limit: pagination.limit
    }));
  }, [dispatch, filters.search, filters.status, pagination.page, pagination.limit]);

  const handleStatusFilterChange = useCallback((newStatus) => {
    setStatusFilter(newStatus);
    dispatch(updateAdminFilters({ status: newStatus }));
    dispatch(updateAdminPagination({ page: 1 }));
  }, [dispatch]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessagePreview = (conversation) => {
    return conversation.last_message_preview || 'No messages yet';
  };

  const getRegularMessages = useCallback(() => {
    if (!selectedConversation?.messages) return [];
    return selectedConversation.messages.filter(msg => !msg.is_internal);
  }, [selectedConversation]);

  const getInternalNotes = useCallback(() => {
    if (!selectedConversation?.messages) return [];
    return selectedConversation.messages.filter(msg => msg.is_internal);
  }, [selectedConversation]);

  const clearErrorHandler = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Conversation List */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-full sm:w-96 lg:w-80 xl:w-96
        border-r border-gray-200 bg-white shadow-xl lg:shadow-none
        flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <MessageCircle size={20} className="text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-white">Conversations</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={status === 'loading'}
                className="p-2 text-white hover:bg-blue-800 rounded-lg disabled:opacity-50 transition-colors"
                title="Refresh conversations"
              >
                <RefreshCw size={18} className={status === 'loading' ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-white hover:bg-blue-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-white shadow-sm text-sm"
            />
          </div>

          {/* Status Filters */}
          <div className="flex space-x-2">
            {['all', 'open', 'closed'].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilterChange(s)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'bg-blue-500 text-white hover:bg-blue-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {status === 'loading' && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-12 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium mb-1">No conversations</p>
              <p className="text-sm text-gray-400">Your conversations will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <div
                  key={conversation.uuid}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                    selectedConversation?.uuid === conversation.uuid
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {conversation.created_by_name || 'Anonymous'}
                          </span>
                          {conversation.unread_count > 0 && (
                            <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {conversation.created_by_contact}
                        </div>
                      </div>
                    </div>
                    {conversation.status === 'closed' && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium flex-shrink-0 ml-2">
                        Closed
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 line-clamp-2 mb-2 ml-13">
                    {getLastMessagePreview(conversation)}
                  </div>

                  <div className="flex items-center text-xs text-gray-400 ml-13">
                    <Clock size={12} className="mr-1" />
                    <span>{formatTime(conversation.last_message_at || conversation.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Conversation Details */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Menu size={20} />
                    </button>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                      <User size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        {selectedConversation.created_by_name || 'Anonymous'}
                      </h2>
                      <p className="text-sm text-gray-600 truncate">{selectedConversation.created_by_contact}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedConversation.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      selectedConversation.status === 'open' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></span>
                    {selectedConversation.status}
                  </span>
                  {selectedConversation.subject && (
                    <span className="text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                      {selectedConversation.subject}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleJoin}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    <Mail size={16} />
                    <span className="hidden sm:inline">Join</span>
                  </button>
                  <button
                    onClick={handleAssign}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    <User size={16} />
                    <span className="hidden sm:inline">Assign to Me</span>
                  </button>
                  {selectedConversation.status === 'open' && (
                    <button
                      onClick={handleClose}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                      <XCircle size={16} />
                      <span className="hidden sm:inline">Close</span>
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-4xl mx-auto">
                {getRegularMessages().length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle size={40} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium mb-1">No messages yet</p>
                    <p className="text-sm text-gray-400">Start the conversation</p>
                  </div>
                ) : (
                  getRegularMessages().map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isStaff={msg.is_staff}
                    />
                  ))
                )}
                {isTyping && <TypingIndicator />}
              </div>
            </div>

            {/* Admin Reply Input */}
            <div className="bg-white border-t border-gray-200 p-4 sm:p-6 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <ChatInput onSend={handleAdminSend} placeholder="Type your reply..." />
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-200 p-4 sm:p-6">
              <div className="max-w-4xl mx-auto">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                    <Eye size={18} className="text-amber-600" />
                  </div>
                  Internal Notes
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <textarea
                    className="flex-1 border border-amber-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white shadow-sm text-sm"
                    rows="3"
                    placeholder="Add an internal note visible only to staff..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-sm sm:self-start"
                  >
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {getInternalNotes().length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No internal notes yet</p>
                    </div>
                  ) : (
                    getInternalNotes().map((note) => (
                      <div
                        key={note.id}
                        className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <span className="text-sm font-semibold text-amber-900 flex items-center">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                            {note.sender_name}
                          </span>
                          <span className="text-xs text-amber-600 font-medium">
                            {formatTime(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{note.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg"
              >
                Open Conversations
              </button>
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MessageCircle size={48} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Conversation Selected</h3>
              <p className="text-gray-500">Select a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto bg-white border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-xl shadow-2xl max-w-md z-50 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-1">Error</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <button
              onClick={clearErrorHandler}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatDashboard;