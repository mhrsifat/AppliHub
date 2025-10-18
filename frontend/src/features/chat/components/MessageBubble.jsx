// src/features/chat/components/MessageBubble.jsx
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';

const MessageBubble = ({ message, onDelete, isStaff = false }) => {
  const { userInfo } = useSelector(state => state.chat);
  
  const isOwnMessage = message.sender_user_id === userInfo?.id || 
                      (message.sender_name === userInfo?.name && !message.is_staff);

  const handleAttachmentClick = (attachment) => {
    if (attachment.mime.startsWith('image/')) {
      window.open(attachment.url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('text')) return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl transition-all duration-200 ${
        isOwnMessage 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg' 
          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
      }`}>
        
        {/* Sender info */}
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              message.is_staff ? 'bg-green-400' : 'bg-blue-400'
            }`}></div>
            <span className="text-xs font-semibold opacity-90">
              {message.is_staff ? '👨‍💼 Support Agent' : message.sender_name}
            </span>
          </div>
        )}
        
        {/* Message body */}
        {message.body && (
          <div className="whitespace-pre-wrap break-words mb-3 leading-relaxed">
            {message.body}
          </div>
        )}
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-3 mb-3">
            {message.attachments.map(attachment => (
              <div key={attachment.id} className="flex flex-col">
                {attachment.mime.startsWith('image/') ? (
                  <div 
                    className="cursor-pointer transform hover:scale-[1.02] transition-transform duration-200"
                    onClick={() => handleAttachmentClick(attachment)}
                  >
                    <img 
                      src={attachment.url} 
                      alt={attachment.filename}
                      className="max-w-full max-h-48 rounded-lg hover:shadow-md transition-shadow"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleAttachmentClick(attachment)}
                    className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
                      isOwnMessage 
                        ? 'bg-blue-400 hover:bg-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="text-2xl flex-shrink-0">
                      {getFileIcon(attachment.mime)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {attachment.filename}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatFileSize(attachment.size)} • {attachment.mime.split('/')[1]?.toUpperCase()}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      isOwnMessage ? 'bg-blue-500 text-blue-100' : 'bg-gray-200 text-gray-600'
                    }`}>
                      Download
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Timestamp and status */}
        <div className={`flex items-center justify-between text-xs ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          <span>
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOwnMessage && message.readAt && (
            <span className="ml-2 flex items-center space-x-1">
              <span>Read</span>
              <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
            </span>
          )}
        </div>
      </div>
      
      {/* Delete button for staff */}
      {isStaff && onDelete && (
        <button
          onClick={() => onDelete(message.id)}
          className="ml-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-sm self-start mt-2 transition-opacity duration-200"
          title="Delete message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default React.memo(MessageBubble);