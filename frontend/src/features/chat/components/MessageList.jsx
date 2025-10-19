// filepath: src/features/chat/components/MessageList.jsx
import React, { useEffect, useRef } from 'react';
import { User, UserCircle } from 'lucide-react';

const MessageList = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        // Handle different message field names
        const messageText = message.body || message.message || message.text || '';
        const senderName = message.sender_name || message.senderName || message.name || 'Unknown';
        const isStaff = message.is_staff || message.isStaff || false;
        const timestamp = message.created_at || message.createdAt || message.timestamp;
        const attachments = message.attachments || [];
        
        // Check if message is from current user
        const isCurrentUser = senderName === currentUser;
        const isAdmin = isStaff;

        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[80%] ${
                isCurrentUser ? 'flex-row-reverse' : 'flex-row'
              } items-end space-x-2`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isAdmin
                    ? 'bg-purple-500 text-white'
                    : isCurrentUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {isAdmin ? (
                  <UserCircle size={20} />
                ) : (
                  <User size={16} />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex flex-col ${
                  isCurrentUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender Name */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {isAdmin ? '👨‍💼 ' : ''}{senderName}
                  </span>
                  {timestamp && (
                    <span className="text-xs text-gray-400">
                      {new Date(timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {/* Message Content */}
                {messageText && (
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100'
                        : isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {messageText}
                    </p>
                  </div>
                )}

                {/* Attachments */}
                {attachments && attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url || attachment.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <span>📎</span>
                        <span>{attachment.name || attachment.filename || 'Attachment'}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;