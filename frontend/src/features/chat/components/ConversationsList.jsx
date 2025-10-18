// src/features/chat/components/ConversationsList.jsx
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';

const ConversationsList = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center">
        <div className="text-center text-gray-500 p-4">
          <div className="text-lg mb-2">No conversations</div>
          <div className="text-sm">Waiting for new conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map(conversation => (
        <div
          key={conversation.uuid}
          onClick={() => onSelectConversation(conversation.uuid)}
          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedConversation === conversation.uuid 
              ? 'bg-blue-50 border-blue-200' 
              : 'border-gray-200'
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
          
          <p className="text-sm text-gray-600 mb-1 truncate">
            👤 {conversation.created_by_name} • {conversation.created_by_contact}
          </p>
          
          <p className="text-sm text-gray-500 truncate">
            {conversation.last_message_preview || 'No messages yet'}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            {conversation.assigned_to ? (
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                ✅ Assigned
              </span>
            ) : (
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                ⏳ Unassigned
              </span>
            )}
            
            {conversation.unread_count > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-6 text-center">
                {conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationsList;