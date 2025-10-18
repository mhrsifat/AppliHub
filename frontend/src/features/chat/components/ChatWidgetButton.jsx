// filepath: src/features/chat/components/ChatWidgetButton.jsx
import React from 'react';
import { MessageCircle, X } from 'lucide-react';

const ChatWidgetButton = ({ isOpen, onClick, unreadCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center z-50 group"
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {/* Icon */}
      <div className="relative">
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {/* Unread badge */}
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pulse effect when closed */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75" />
      )}

      {/* Tooltip */}
      <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {isOpen ? 'Close chat' : 'Chat with us'}
      </span>
    </button>
  );
};

export default ChatWidgetButton;