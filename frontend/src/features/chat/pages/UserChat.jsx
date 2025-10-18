// src/features/chat/pages/UserChat.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserChat } from '../hooks/useChat';
import pusherService from '../services/pusherService';
import ChatContainer from '../components/ChatContainer';
import MessageInput from '../components/MessageInput';
import StartConversation from '../components/StartConversation';

const UserChat = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const {
    userInfo,
    currentConversation,
    messages,
    isLoading,
    error,
    createConversation,
    loadMessages,
    sendMessage,
    sendTypingIndicator,
    handleIncomingMessage,
    handleTypingEvent,
    clearError,
    resetChat
  } = useUserChat();

  const [isPusherConnected, setIsPusherConnected] = useState(false);

  // Initialize Pusher and subscribe to conversation
  useEffect(() => {
    if (uuid) {
      loadMessages(uuid);
      
      // Subscribe to Pusher events
      const unsubscribe = pusherService.subscribeToConversation(
        uuid,
        handleIncomingMessage,
        handleTypingEvent
      );

      setIsPusherConnected(pusherService.isConnected);

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [uuid, loadMessages, handleIncomingMessage, handleTypingEvent]);

  // Handle connection status changes
  useEffect(() => {
    const checkConnection = () => {
      setIsPusherConnected(pusherService.isConnected);
    };

    // Check connection every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateConversation = async (conversationData) => {
    try {
      const conversation = await createConversation(conversationData);
      navigate(`/chat/${conversation.uuid}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSendMessage = async (messageData) => {
    if (!uuid) return;
    
    try {
      await sendMessage(uuid, messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartTyping = () => {
    if (uuid) {
      sendTypingIndicator(uuid);
    }
  };

  // If no conversation UUID and no user info, show start conversation form
  if (!uuid && !userInfo) {
    return <StartConversation onCreateConversation={handleCreateConversation} isLoading={isLoading} />;
  }

  // If we have a UUID but haven't loaded messages yet
  if (uuid && messages.length === 0 && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  resetChat();
                  navigate('/chat');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to start"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  {currentConversation?.subject || 'Chat Support'}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>We're here to help you</span>
                  {!isPusherConnected && (
                    <span className="flex items-center text-orange-500">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                      Connecting...
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {userInfo && (
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                Hello, {userInfo.name}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-red-700 text-sm">{error}</div>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full bg-white shadow-lg rounded-lg my-4 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ChatContainer />
          
          {uuid && (
            <MessageInput
              conversationUuid={uuid}
              onSendMessage={handleSendMessage}
              onTypingStart={handleStartTyping}
              disabled={isLoading || !isPusherConnected}
            />
          )}
        </div>
      </div>

      {/* Connection status */}
      {!isPusherConnected && (
        <div className="max-w-6xl mx-auto w-full mb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <div className="text-orange-700 text-sm">
              <span className="font-semibold">Connection issue:</span> Real-time updates paused. Messages will send when connection is restored.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserChat;