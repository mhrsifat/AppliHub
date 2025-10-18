// src/features/chat/hooks/useChatWidget.js
import { useCallback } from 'react';
import { useUserChat } from './useChat';

// Custom hook specifically for widget with additional features
export const useChatWidget = () => {
  const chat = useUserChat();

  // Reset conversation and start new one
  const startNewConversation = useCallback(() => {
    // Clear current conversation but keep user info
    // This will trigger the start conversation form again
    chat.setCurrentConversation(null);
    chat.setMessages([]);
    chat.clearTypingUsers();
  }, [chat]);

  // Check if user has active conversation
  const hasActiveConversation = useCallback(() => {
    return !!chat.currentConversation?.uuid;
  }, [chat.currentConversation]);

  return {
    ...chat,
    startNewConversation,
    hasActiveConversation
  };
};