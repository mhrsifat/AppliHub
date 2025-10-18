// src/components/chat/ChatWidget.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useChatWidget } from '../../features/chat/hooks/useChat';
import pusherService from '../../features/chat/services/pusherService';
import StartConversation from '../../features/chat/components/StartConversation';
import ChatContainer from '../../features/chat/components/ChatContainer';
import MessageInput from '../../features/chat/components/MessageInput';

const ChatWidget = () => {
  const {
    userInfo,
    currentConversation,
    messages,
    isLoading,
    isSubmitting,
    error,
    widgetState,
    unreadCount,
    connectionStatus,
    createConversation,
    sendMessage,
    sendTypingIndicator,
    handleIncomingMessage,
    handleTypingEvent,
    clearError,
    toggleWidget,
    minimizeWidget
  } = useChatWidget();

  const [isMounted, setIsMounted] = useState(false);
  const widgetRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Initialize on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Pusher subscription
  useEffect(() => {
    if (currentConversation?.uuid) {
      // Unsubscribe from previous conversation
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Subscribe to new conversation
      unsubscribeRef.current = pusherService.subscribeToConversation(
        currentConversation.uuid,
        handleIncomingMessage,
        handleTypingEvent
      );
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentConversation?.uuid, handleIncomingMessage, handleTypingEvent]);

  // Handle clicks outside the widget
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        if (widgetState.isOpen && !widgetState.isMinimized) {
          minimizeWidget();
        }
      }
    };

    if (widgetState.isOpen && !widgetState.isMinimized) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [widgetState.isOpen, widgetState.isMinimized, minimizeWidget]);

  const handleCreateConversation = async (conversationData) => {
    try {
      await createConversation(conversationData);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSendMessage = async (messageData) => {
    if (!currentConversation?.uuid) return;
    
    try {
      await sendMessage(currentConversation.uuid, messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartTyping = () => {
    if (currentConversation?.uuid) {
      sendTypingIndicator(currentConversation.uuid);
    }
  };

  const handleClose = () => {
    minimizeWidget();
  };

  // Don't render until mounted (for SSR compatibility)
  if (!isMounted) {
    return null;
  }

  // If widget is completely closed, show only the floating button
  if (!widgetState.isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
        <button
          onClick={toggleWidget}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 relative group"
        >
          {/* Main icon */}
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            
            {/* Pulsing animation */}
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
          </div>
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Chat with us
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </button>
      </div>
    );
  }

  // If widget is minimized, show a small header
  if (widgetState.isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up" ref={widgetRef}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 overflow-hidden">
          {/* Minimized header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <div className="font-semibold">Live Chat</div>
                  <div className="text-blue-100 text-xs">We're online</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleWidget}
                  className="p-1.5 hover:bg-blue-400 rounded-xl transition-all duration-200 hover:scale-110"
                  title="Expand chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-blue-400 rounded-xl transition-all duration-200 hover:scale-110"
                  title="Close chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* New message indicator */}
          {unreadCount > 0 && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-blue-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {unreadCount} new message{unreadCount > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={toggleWidget}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                >
                  View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full expanded widget
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up" ref={widgetRef}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div className="font-semibold text-lg">
                {currentConversation ? 'Support Chat' : 'Start Chat'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={minimizeWidget}
                className="p-1.5 hover:bg-blue-400 rounded-xl transition-all duration-200 hover:scale-110"
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-blue-400 rounded-xl transition-all duration-200 hover:scale-110"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Connection status */}
          <div className="flex items-center justify-between text-blue-100 text-sm">
            <span>
              {currentConversation ? 'Active conversation' : 'Ready to help'}
            </span>
            <div className={`flex items-center space-x-1 ${
              connectionStatus === 'connected' ? 'text-green-300' :
              connectionStatus === 'connecting' ? 'text-yellow-300' :
              'text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-ping' :
                'bg-red-400'
              }`}></div>
              <span className="text-xs">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200">
            <div className="flex items-center justify-between text-red-700 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              <button 
                onClick={clearError}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!currentConversation ? (
            // Start conversation view
            <div className="flex-1 overflow-auto">
              <StartConversation 
                onCreateConversation={handleCreateConversation}
                isLoading={isLoading}
              />
            </div>
          ) : (
            // Active conversation view
            <>
              <div className="p-3 border-b bg-gray-50">
                <div className="text-center text-gray-600 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <span>💬 Chat with support team</span>
                    {userInfo && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {userInfo.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ChatContainer />
              </div>
              
              <MessageInput
                conversationUuid={currentConversation.uuid}
                onSendMessage={handleSendMessage}
                onTypingStart={handleStartTyping}
                disabled={connectionStatus !== 'connected'}
                isSubmitting={isSubmitting}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatWidget);