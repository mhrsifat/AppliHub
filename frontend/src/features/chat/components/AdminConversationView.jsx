// src/features/chat/components/AdminConversationView.jsx
import React, { useEffect } from 'react';
import { useStaffChat } from '../hooks/useChat';
import pusherService from '../services/pusherService';
import ChatContainer from './ChatContainer';
import MessageInput from './MessageInput';

const AdminConversationView = ({
  conversation,
  messages,
  isLoading,
  isSubmitting,
  error,
  onSendMessage,
  onDeleteMessage,
  onAssignToMe,
  onJoinConversation,
  onUpdateStatus,
  onClearError,
  connectionStatus,
  onFocusMode
}) => {
  const { handleIncomingMessage, handleTypingEvent } = useStaffChat();

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversation?.uuid) return;

    const unsubscribe = pusherService.subscribeToConversation(
      conversation.uuid,
      handleIncomingMessage,
      handleTypingEvent
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversation?.uuid, handleIncomingMessage, handleTypingEvent]);

  const handleStartTyping = () => {
    // Staff typing indicator can be implemented here
    console.log('Staff typing...');
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Conversation Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {conversation.subject || 'Conversation'}
            </h2>
            
            {/* Status Badge */}
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              conversation.status === 'closed' 
                ? 'bg-gray-100 text-gray-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {conversation.status === 'closed' ? 'Closed' : 'Open'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Focus Mode Button */}
            {onFocusMode && (
              <button
                onClick={onFocusMode}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Enter focus mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}

            {/* Assignment Status */}
            {!conversation.assigned_to ? (
              <button
                onClick={onAssignToMe}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Assign to Me
              </button>
            ) : (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Assigned to You
              </span>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onJoinConversation}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Join
              </button>
              
              {conversation.status === 'closed' ? (
                <button
                  onClick={() => onUpdateStatus('open')}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Reopen
                </button>
              ) : (
                <button
                  onClick={() => onUpdateStatus('closed')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Customer:</span>
            <span className="ml-2 text-gray-900">{conversation.created_by_name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Contact:</span>
            <span className="ml-2 text-gray-900">{conversation.created_by_contact}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Started:</span>
            <span className="ml-2 text-gray-900">
              {new Date(conversation.created_at).toLocaleDateString()} at{' '}
              {new Date(conversation.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Last Activity:</span>
            <span className="ml-2 text-gray-900">
              {new Date(conversation.last_message_at).toLocaleDateString()} at{' '}
              {new Date(conversation.last_message_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between text-red-700 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              <button 
                onClick={onClearError}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <ChatContainer 
          onDeleteMessage={onDeleteMessage}
          isStaff={true}
        />
        
        <MessageInput
          conversationUuid={conversation.uuid}
          onSendMessage={onSendMessage}
          onTypingStart={handleStartTyping}
          disabled={connectionStatus !== 'connected'}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AdminConversationView;