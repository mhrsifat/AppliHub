// filepath: src/features/chat/components/ConversationItem.jsx
import React from 'react';
import { User, Clock } from 'lucide-react';

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-l-4 ${
        isActive 
          ? 'bg-blue-50 border-blue-600' 
          : 'bg-white border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0">
        {conversation.created_by_name?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        {/* Name and time */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className={`font-medium truncate ${
            isActive ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {conversation.created_by_name || 'Anonymous'}
          </h3>
          {conversation.last_message_at && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTime(conversation.last_message_at)}
            </span>
          )}
        </div>

        {/* Subject */}
        {conversation.subject && (
          <p className="text-sm font-medium text-gray-700 truncate mb-1">
            {conversation.subject}
          </p>
        )}

        {/* Last message preview */}
        {conversation.last_message_preview && (
          <p className="text-sm text-gray-600 truncate">
            {conversation.last_message_preview}
          </p>
        )}

        {/* Contact info */}
        {conversation.created_by_contact && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {conversation.created_by_contact}
          </p>
        )}
      </div>

      {/* Unread indicator (if applicable) */}
      {conversation.unread_count > 0 && (
        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
        </div>
      )}
    </button>
  );
};

export default ConversationItem;