// filepath: src/features/chat/components/ChatMessage.jsx
import React from 'react';

const ChatMessage = ({ message, currentUser }) => {
  // For admin dashboard we pass currentUser="admin"
  const isAdmin = message.sender === 'admin' || message.isAdmin;
  // Admin messages should align to the right in admin UI (admin = you)
  const containerJustify = isAdmin ? 'justify-end' : 'justify-start';
  const bubbleColor = isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800';

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleString()
    : '';

  return (
    <div className={`flex ${containerJustify} mb-2`}>
      <div className={`max-w-xs px-3 py-2 rounded-lg ${bubbleColor}`}>
        {message.text || message.message}
        {message.fileUrl && (
          <div className="mt-2">
            {/\.(jpeg|jpg|gif|png)$/i.test(message.fileUrl) ? (
              <img src={message.fileUrl} alt="attachment" className="max-w-xs rounded-md" loading="lazy" />
            ) : (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-700"
              >
                {message.fileName || 'Download File'}
              </a>
            )}
          </div>
        )}
        {formattedTime && (
          <div className="text-xs text-gray-100 mt-1 text-right">
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;