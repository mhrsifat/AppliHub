// filepath: src/features/chat/components/MessageList.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ 
  messages = [], 
  loading = false,
  typingUsers = [],
  hasMore = false,
  onLoadMore,
  currentUserContact
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages, shouldAutoScroll]);

  // Check if user is near bottom to enable auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);

    // Load more when scrolled to top
    if (scrollTop === 0 && hasMore && !loading) {
      onLoadMore?.();
    }
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
          <p className="text-sm text-gray-500">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center py-2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageItem
          key={message.id || message.tempId}
          message={message}
          isOwn={message.sender_contact === currentUserContact || message.is_staff}
        />
      ))}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;