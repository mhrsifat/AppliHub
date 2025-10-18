// src/features/chat/components/AdminConversationsList.jsx
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';

const AdminConversationsList = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation,
  isLoading = false 
}) => {
  const getStatusColor = (conversation) => {
    if (conversation.status === 'closed') return 'bg-gray-100 text-gray-800';
    if (!conversation.assigned_to) return 'bg-yellow-100 text-yellow-800';
    if (conversation.unread_count > 0) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (conversation) => {
    if (conversation.status === 'closed') return 'Closed';
    if (!conversation.assigned_to) return 'Unassigned';
    if (conversation.unread_count > 0) return 'Unread';
    return 'Active';
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-200 animate-pulse">
            <div className="flex justify-between items-start mb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center text-gray-500 p-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Conversations</h3>
          <p className="text-gray-500 text-sm">
            There are no conversations matching your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conversation => (
        <div
          key={conversation.uuid}
          onClick={() => onSelectConversation(conversation.uuid)}
          className={`p-4 border-b border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
            selectedConversation === conversation.uuid 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-white'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-800 truncate flex-1 mr-2">
              {conversation.subject || 'No Subject'}
            </h4>
            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
              {formatDistanceToNow(new Date(conversation.last_message_at), { 
                addSuffix: true 
              })}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <span className="font-medium">👤 {conversation.created_by_name}</span>
            <span>•</span>
            <span className="truncate">{conversation.created_by_contact}</span>
          </div>
          
          <p className="text-sm text-gray-500 truncate mb-3">
            {conversation.last_message_preview || 'No messages yet'}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation)}`}>
                {getStatusText(conversation)}
              </span>
              
              {conversation.assigned_to && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  👤 Assigned
                </span>
              )}
            </div>
            
            {conversation.unread_count > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs font-bold rounded-full min-w-6 h-6 flex items-center justify-center">
                {conversation.unread_count}
              </span>
            )}
          </div>

          {/* Tags or Categories */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {conversation.tags.slice(0, 2).map(tag => (
                <span key={tag} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
              {conversation.tags.length > 2 && (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                  +{conversation.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminConversationsList;