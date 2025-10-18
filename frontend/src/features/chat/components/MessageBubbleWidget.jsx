// src/features/chat/components/MessageBubbleWidget.jsx
import React from 'react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';

const MessageBubbleWidget = ({ message, onDelete, isStaff = false }) => {
  const { userInfo } = useSelector(state => state.chat);
  
  const isOwnMessage = message.sender_user_id === userInfo?.id || 
                      (message.sender_name === userInfo?.name && !message.is_staff);

  const handleAttachmentClick = (attachment) => {
    if (attachment.mime.startsWith('image/')) {
      // Open image in new tab for better view
      window.open(attachment.url, '_blank');
    } else {
      // Download other file types
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.filename;
      link.target = '_blank';
      link.click();
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
        isOwnMessage 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-200 text-gray-800 rounded-bl-none'
      }`}>
        {/* Sender info for others' messages */}
        {!isOwnMessage && (
          <div className="text-xs font-semibold mb-1 opacity-75">
            {message.is_staff ? '👨‍💼 Support' : message.sender_name}
          </div>
        )}
        
        {/* Message body */}
        {message.body && (
          <div className="whitespace-pre-wrap break-words mb-1">{message.body}</div>
        )}
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-1 mb-1">
            {message.attachments.map(attachment => (
              <div key={attachment.id} className="flex flex-col">
                {attachment.mime.startsWith('image/') ? (
                  <div className="cursor-pointer" onClick={() => handleAttachmentClick(attachment)}>
                    <img 
                      src={attachment.url} 
                      alt={attachment.filename}
                      className="max-w-full max-h-32 rounded hover:opacity-90 transition-opacity"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleAttachmentClick(attachment)}
                    className="flex items-center space-x-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors text-left"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate flex-1">{attachment.filename}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} text-right`}>
          {format(new Date(message.created_at), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default MessageBubbleWidget;