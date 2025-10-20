import React from 'react';

const ChatMessage = ({ message, isStaff = false }) => {
  // Determine alignment and styling based on whether sender is staff
  const isFromStaff = message.is_staff || isStaff;
  const containerJustify = isFromStaff ? 'justify-end' : 'justify-start';
  const bubbleColor = isFromStaff 
    ? 'bg-blue-500 text-white' 
    : 'bg-gray-200 text-gray-800';

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  // Handle attachments
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center space-x-2">
            {attachment.mime && attachment.mime.startsWith('image/') ? (
              <img 
                src={`/storage/${attachment.path}`} 
                alt={attachment.filename}
                className="max-w-xs rounded-md border"
                loading="lazy"
              />
            ) : (
              <a
                href={`/storage/${attachment.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm underline ${
                  isFromStaff ? 'text-blue-200' : 'text-blue-600'
                }`}
              >
                📎 {attachment.filename}
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex ${containerJustify} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleColor}`}>
        {/* Sender name for non-staff messages */}
        {!isFromStaff && message.sender_name && (
          <div className={`text-xs font-medium mb-1 ${
            isFromStaff ? 'text-blue-100' : 'text-gray-600'
          }`}>
            {message.sender_name}
          </div>
        )}
        
        {/* Message body */}
        <div className="break-words">{message.body}</div>
        
        {/* Attachments */}
        {renderAttachments()}
        
        {/* Timestamp */}
        {formattedTime && (
          <div className={`text-xs mt-1 ${
            isFromStaff ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;