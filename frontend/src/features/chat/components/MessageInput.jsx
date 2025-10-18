// src/features/chat/components/MessageInput.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

const MessageInput = ({ 
  conversationUuid, 
  onSendMessage, 
  onTypingStart,
  disabled = false,
  isSubmitting = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || disabled || isSubmitting) return;

    try {
      await onSendMessage({
        body: message.trim(),
        attachments
      });

      setMessage('');
      setAttachments([]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 
        'video/mp4', 
        'video/quicktime', 
        'video/x-msvideo'
      ];
      
      if (!validTypes.includes(file.type)) {
        alert(`File type "${file.type}" is not supported. Supported types: images, PDF, Word documents, text files, and videos.`);
        return false;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    if (!isTyping && onTypingStart && conversationUuid) {
      setIsTyping(true);
      onTypingStart();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`border-t bg-white p-4 transition-all duration-200 ${
        isDragging ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10">
          <div className="text-center text-blue-600">
            <div className="text-2xl mb-2">📁</div>
            <div className="font-semibold">Drop files to upload</div>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center bg-gray-50 rounded-xl px-3 py-2 text-sm border border-gray-200 group hover:bg-gray-100 transition-colors">
              <span className="truncate max-w-xs mr-2">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
        {/* File attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSubmitting}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Attach files"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.mp4,.mov,.avi"
          className="hidden"
          disabled={disabled || isSubmitting}
        />

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Connecting..." : isSubmitting ? "Sending..." : "Type your message... (Enter to send, Shift+Enter for new line)"}
            disabled={disabled || isSubmitting}
            rows={1}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none bg-gray-50 transition-all duration-200"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || disabled || isSubmitting}
          className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>

      {/* File type hints */}
      <div className="text-xs text-gray-400 mt-2 text-center">
        Supports: Images, PDF, Word, Text, Videos (max 50MB)
      </div>
    </div>
  );
};

export default React.memo(MessageInput);