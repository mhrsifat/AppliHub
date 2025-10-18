// src/features/chat/hooks/useChat.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { chatServices, staffChatServices } from '../services/chatServices';
import pusherService from '../services/pusherService';
import {
  setUserInfo,
  setCurrentConversation,
  setConversations,
  setMessages,
  addMessage,
  setLoading,
  setSubmitting,
  setError,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  clearChatState,
  clearError,
  setWidgetState,
  incrementUnreadCount,
  resetUnreadCount,
  setConnectionStatus,
  updateLastActivity
} from '../slices/chatSlice';

// Debounce hook for performance
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for user chat functionality
export const useUserChat = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chatState = useSelector(state => state.chat);
  const typingTimeoutRef = useRef(null);
  const connectionRef = useRef(null);

  // Initialize Pusher connection
  useEffect(() => {
    pusherService.initialize();
    
    // Listen for connection changes
    connectionRef.current = pusherService.onConnectionChange((status) => {
      dispatch(setConnectionStatus(status));
      
      if (status === 'connected' && chatState.currentConversation?.uuid) {
        // Re-subscribe to current conversation when reconnected
        const unsubscribe = pusherService.subscribeToConversation(
          chatState.currentConversation.uuid,
          handleIncomingMessage,
          handleTypingEvent
        );
        
        return unsubscribe;
      }
    });

    return () => {
      if (connectionRef.current) {
        connectionRef.current();
      }
    };
  }, []);

  const createConversation = async (conversationData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await chatServices.createConversation(conversationData);
      
      // Store user info in localStorage and state
      const userInfo = {
        name: conversationData.name,
        contact: conversationData.contact,
        id: response.data.id
      };
      dispatch(setUserInfo(userInfo));
      dispatch(setCurrentConversation(response.data));
      
      dispatch(setLoading(false));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create conversation. Please try again.';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      throw new Error(errorMessage);
    }
  };

  const loadMessages = async (conversationUuid, page = 1) => {
    if (!conversationUuid) return;
    
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await chatServices.getMessages(conversationUuid, page);
      
      if (page === 1) {
        dispatch(setMessages(response.data));
      } else {
        // For infinite scroll, prepend messages
        // dispatch(prependMessages(response.data));
      }
      
      dispatch(setLoading(false));
      return response.data;
    } catch (error) {
      const errorMessage = 'Failed to load messages. Please check your connection.';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      throw new Error(errorMessage);
    }
  };

  const sendMessage = async (conversationUuid, messageData) => {
    try {
      dispatch(setSubmitting(true));
      dispatch(clearError());
      
      const response = await chatServices.sendMessage(
        conversationUuid, 
        { ...messageData, ...chatState.userInfo }
      );
      
      dispatch(addMessage(response.data));
      dispatch(setSubmitting(false));
      return response.data;
    } catch (error) {
      const errorMessage = 'Failed to send message. Please try again.';
      dispatch(setError(errorMessage));
      dispatch(setSubmitting(false));
      throw new Error(errorMessage);
    }
  };

  const sendTypingIndicator = useCallback((conversationUuid) => {
    if (!conversationUuid || !chatState.userInfo?.name) return;

    // Debounced typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatServices.sendTyping(conversationUuid, { name: chatState.userInfo.name })
        .catch(error => console.error('Failed to send typing indicator:', error));

      dispatch(addTypingUser({ 
        userName: chatState.userInfo.name, 
        isStaff: false 
      }));

      // Remove typing user after 3 seconds
      setTimeout(() => {
        dispatch(removeTypingUser({ 
          userName: chatState.userInfo.name, 
          isStaff: false 
        }));
      }, 3000);
    }, 500);
  }, [dispatch, chatState.userInfo]);

  const handleIncomingMessage = useCallback((message) => {
    if (message && message.id) {
      dispatch(addMessage(message));
      dispatch(updateLastActivity());
      
      // Increment unread count if widget is minimized or closed
      if (chatState.widgetState.isMinimized || !chatState.widgetState.isOpen) {
        dispatch(incrementUnreadCount());
      }
    }
  }, [dispatch, chatState.widgetState]);

  const handleTypingEvent = useCallback((typingData) => {
    if (!typingData) return;
    
    const { userName, isStaff } = typingData;
    
    // Don't show typing indicator for current user
    if (userName === chatState.userInfo?.name && !isStaff) return;
    
    dispatch(addTypingUser({ userName, isStaff }));

    // Remove typing indicator after 3 seconds
    setTimeout(() => {
      dispatch(removeTypingUser({ userName, isStaff }));
    }, 3000);
  }, [dispatch, chatState.userInfo]);

  const setWidgetOpen = useCallback((isOpen) => {
    dispatch(setWidgetState({ isOpen }));
    if (isOpen) {
      dispatch(resetUnreadCount());
    }
  }, [dispatch]);

  const setWidgetMinimized = useCallback((isMinimized) => {
    dispatch(setWidgetState({ isMinimized }));
    if (!isMinimized) {
      dispatch(resetUnreadCount());
    }
  }, [dispatch]);

  const clearChatError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetChat = useCallback(() => {
    dispatch(clearChatState());
    dispatch(resetUnreadCount());
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...chatState,
    createConversation,
    loadMessages,
    sendMessage,
    sendTypingIndicator,
    handleIncomingMessage,
    handleTypingEvent,
    setWidgetOpen,
    setWidgetMinimized,
    clearError: clearChatError,
    resetChat
  };
};

// Hook for staff chat functionality
export const useStaffChat = () => {
  const dispatch = useDispatch();
  const chatState = useSelector(state => state.chat);

  const loadConversations = async (params = {}) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await staffChatServices.getConversations(params);
      dispatch(setConversations(response.data));
      
      dispatch(setLoading(false));
    } catch (error) {
      const errorMessage = 'Failed to load conversations';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      throw new Error(errorMessage);
    }
  };

  const joinConversation = async (conversationUuid) => {
    try {
      dispatch(clearError());
      await staffChatServices.joinConversation(conversationUuid);
    } catch (error) {
      const errorMessage = 'Failed to join conversation';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    }
  };

  const assignConversation = async (conversationUuid) => {
    try {
      dispatch(clearError());
      const response = await staffChatServices.assignConversation(conversationUuid);
      return response.data;
    } catch (error) {
      const errorMessage = 'Failed to assign conversation';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    }
  };

  const loadConversationDetails = async (conversationUuid) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await staffChatServices.getConversation(conversationUuid);
      dispatch(setCurrentConversation(response.data));
      
      if (response.data.messages) {
        dispatch(setMessages(response.data.messages));
      }
      
      dispatch(setLoading(false));
    } catch (error) {
      const errorMessage = 'Failed to load conversation details';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      throw new Error(errorMessage);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      dispatch(clearError());
      await staffChatServices.deleteMessage(messageId);
      
      dispatch(setMessages(chatState.messages.filter(msg => msg.id !== messageId)));
    } catch (error) {
      const errorMessage = 'Failed to delete message';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    }
  };

  const sendMessage = async (conversationUuid, messageData) => {
    try {
      dispatch(setSubmitting(true));
      dispatch(clearError());
      
      const response = await chatServices.sendMessage(
        conversationUuid, 
        messageData,
        'staff-token'
      );
      
      dispatch(addMessage(response.data));
      dispatch(setSubmitting(false));
      return response.data;
    } catch (error) {
      const errorMessage = 'Failed to send message';
      dispatch(setError(errorMessage));
      dispatch(setSubmitting(false));
      throw new Error(errorMessage);
    }
  };

  const clearChatError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    ...chatState,
    loadConversations,
    joinConversation,
    assignConversation,
    loadConversationDetails,
    deleteMessage,
    sendMessage,
    clearError: clearChatError
  };
};

// Hook specifically for widget with additional features
export const useChatWidget = () => {
  const chat = useUserChat();

  const startNewConversation = useCallback(() => {
    chat.resetChat();
  }, [chat]);

  const hasActiveConversation = useCallback(() => {
    return !!chat.currentConversation?.uuid;
  }, [chat.currentConversation]);

  const toggleWidget = useCallback(() => {
    if (chat.widgetState.isOpen && chat.widgetState.isMinimized) {
      chat.setWidgetMinimized(false);
      chat.resetUnreadCount();
    } else if (chat.widgetState.isOpen) {
      chat.setWidgetOpen(false);
    } else {
      chat.setWidgetOpen(true);
      chat.setWidgetMinimized(false);
      chat.resetUnreadCount();
    }
  }, [chat]);

  const minimizeWidget = useCallback(() => {
    chat.setWidgetMinimized(true);
  }, [chat]);

  return {
    ...chat,
    startNewConversation,
    hasActiveConversation,
    toggleWidget,
    minimizeWidget
  };
};