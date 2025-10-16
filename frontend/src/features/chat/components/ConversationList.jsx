// filepath: src/features/chat/components/ConversationList.jsx
import React, { useState, useEffect } from 'react';
import { Search, Loader2, MessageSquare } from 'lucide-react';
import ConversationItem from './ConversationItem';
import chatService from '../services/chatService';

const ConversationList = ({ activeConversationId, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await chatService.listConversations(pageNum, 20);
      if (pageNum === 1) {
        setConversations(response.data || []);
      } else {
        setConversations(prev => [...prev, ...(response.data || [])]);
      }
      setHasMore(response.meta?.current_page < response.meta?.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.created_by_name?.toLowerCase().includes(query) ||
      conv.subject?.toLowerCase().includes(query) ||
      conv.created_by_contact?.toLowerCase().includes(query) ||
      conv.last_message_preview?.toLowerCase().includes(query)
    );
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Conversations
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Conversations will appear here when users contact you'
              }
            </p>
          </div>
        ) : (
          <>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.uuid}
                conversation={conversation}
                isActive={conversation.uuid === activeConversationId}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
            
            {/* Load more */}
            {hasMore && !searchQuery && (
              <div className="p-4 text-center">
                <button
                  onClick={() => loadConversations(page + 1)}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationList;