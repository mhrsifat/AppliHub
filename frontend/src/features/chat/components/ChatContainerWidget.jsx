// src/features/chat/components/ChatContainerWidget.jsx
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import MessageBubbleWidget from './MessageBubbleWidget';
import TypingIndicator from './TypingIndicator';

const ChatContainerWidget = ({ 
  onDeleteMessage,
  isStaff = false
}) => {
  const { messages, isLoading, error } = useSelector(state => state.chat);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    // Initial scroll to bottom
    scrollToBottom('auto');
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-red-500 text-center text-sm">
          <div className="font-semibold mb-1">Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 chat-widget-scrollbar"
      >
        {messages.length === 0 && !isLoading ? (
          <div className="text-center text-gray-500 text-sm mt-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(message => (
            <MessageBubbleWidget 
              key={message.id} 
              message={message} 
              onDelete={onDeleteMessage}
              isStaff={isStaff}
            />
          ))
        )}
        
        <TypingIndicator />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContainerWidget;