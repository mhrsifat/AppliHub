// src/features/chat/components/ChatContainer.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatContainer = ({ 
  onDeleteMessage,
  isStaff = false
}) => {
  const { messages, isLoading, error, connectionStatus } = useSelector(state => state.chat);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior,
      block: 'end'
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const isNearBottom = scrollPositionRef.current > -100; // Threshold for "near bottom"
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages.length, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Connection Error</h3>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      {connectionStatus !== 'connected' && (
        <div className={`px-4 py-2 text-xs font-medium text-center ${
          connectionStatus === 'connecting' ? 'bg-yellow-50 text-yellow-700' :
          connectionStatus === 'error' ? 'bg-red-50 text-red-700' :
          'bg-gray-50 text-gray-600'
        }`}>
          {connectionStatus === 'connecting' && '🔄 Connecting...'}
          {connectionStatus === 'error' && '❌ Connection failed - Retrying...'}
          {connectionStatus === 'disconnected' && '⚡ Disconnected'}
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-gray-50 to-white"
      >
        {messages.length === 0 && !isLoading ? (
          <div className="text-center text-gray-500 mt-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No messages yet</h3>
            <p className="text-sm text-gray-500">Start the conversation by sending a message!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                onDelete={onDeleteMessage}
                isStaff={isStaff}
              />
            ))}
          </>
        )}
        
        <TypingIndicator />
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
};

export default React.memo(ChatContainer);