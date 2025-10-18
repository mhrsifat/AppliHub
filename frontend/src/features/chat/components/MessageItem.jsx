// filepath: src/features/chat/components/MessageItem.jsx
import React from 'react';
import { FileText, Download, Loader2, CheckCheck, Check } from 'lucide-react';

const MessageItem = ({ message, isOwn = false, onDelete }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderAttachment = (attachment) => {
    const isImage = attachment.mime?.startsWith('image/');
    const isVideo = attachment.mime?.startsWith('video/');
    const isPDF = attachment.mime === 'application/pdf';

    if (isImage) {
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
        >
          <img
            src={attachment.url}
            alt={attachment.filename}
            className="max-w-xs max-h-64 rounded-lg"
            loading="lazy"
          />
        </a>
      );
    }

    if (isVideo) {
      return (
        <video
          src={attachment.url}
          controls
          className="max-w-xs max-h-64 rounded-lg"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
      >
        <FileText className="w-5 h-5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.filename}</p>
          <p className="text-xs opacity-75">
            {(attachment.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <Download className="w-4 h-4" />
      </a>
    );
  };

  return (
    <div className={`flex gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {message.sender_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for received messages) */}
        {!isOwn && message.sender_name && (
          <span className="text-xs text-gray-600 font-medium px-1">
            {message.sender_name}
            {message.is_staff && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                Staff
              </span>
            )}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm'
              : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
          }`}
        >
          {/* Body text */}
          {message.body && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-col gap-2 ${message.body ? 'mt-2' : ''}`}>
              {message.attachments.map((attachment) => (
                <div key={attachment.id}>{renderAttachment(attachment)}</div>
              ))}
            </div>
          )}
        </div>

        {/* Message metadata */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          
          {isOwn && (
            <>
              {message.sending ? (
                <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
              ) : message.id ? (
                <CheckCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <Check className="w-3 h-3 text-gray-400" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;