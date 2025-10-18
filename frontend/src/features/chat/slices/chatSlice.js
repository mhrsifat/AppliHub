// src/features/chat/slices/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Helper to get user info from localStorage
const getUserInfoFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('chatUserInfo');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading chat user info from storage:', error);
    return null;
  }
};

// Helper to get widget state from localStorage
const getWidgetStateFromStorage = () => {
  if (typeof window === 'undefined') return { isOpen: false, isMinimized: true };
  try {
    const stored = localStorage.getItem('chatWidgetState');
    return stored ? JSON.parse(stored) : { isOpen: false, isMinimized: true };
  } catch (error) {
    console.error('Error reading widget state from storage:', error);
    return { isOpen: false, isMinimized: true };
  }
};

const initialState = {
  userInfo: getUserInfoFromStorage(),
  currentConversation: null,
  conversations: [],
  messages: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  typingUsers: [],
  activeConversations: [],
  widgetState: getWidgetStateFromStorage(),
  unreadCount: 0,
  connectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected', 'error'
  lastActivity: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatUserInfo', JSON.stringify(action.payload));
      }
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      state.lastActivity = new Date().toISOString();
    },
    prependMessages: (state, action) => {
      state.messages.unshift(...action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.lastActivity = new Date().toISOString();
    },
    addTypingUser: (state, action) => {
      const { userName, isStaff } = action.payload;
      const existingIndex = state.typingUsers.findIndex(
        user => user.userName === userName && user.isStaff === isStaff
      );
      
      if (existingIndex >= 0) {
        state.typingUsers[existingIndex].timestamp = Date.now();
      } else {
        state.typingUsers.push({ 
          userName, 
          isStaff, 
          timestamp: Date.now() 
        });
      }
    },
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(user => 
        !(user.userName === action.payload.userName && user.isStaff === action.payload.isStaff)
      );
    },
    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },
    clearChatState: (state) => {
      state.currentConversation = null;
      state.messages = [];
      state.typingUsers = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setWidgetState: (state, action) => {
      state.widgetState = { ...state.widgetState, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatWidgetState', JSON.stringify(state.widgetState));
      }
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },
    markMessagesAsRead: (state, action) => {
      // Implementation for marking messages as read
      state.messages.forEach(message => {
        if (!message.readAt && message.sender_user_id !== state.userInfo?.id) {
          message.readAt = new Date().toISOString();
        }
      });
    }
  }
});

export const {
  setUserInfo,
  setCurrentConversation,
  setConversations,
  setMessages,
  addMessage,
  prependMessages,
  setLoading,
  setSubmitting,
  setError,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  clearChatState,
  clearError,
  setWidgetState,
  setUnreadCount,
  incrementUnreadCount,
  resetUnreadCount,
  setConnectionStatus,
  updateLastActivity,
  markMessagesAsRead
} = chatSlice.actions;

export default chatSlice.reducer;