// filepath: src/features/chat/store/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  activeConversation: null,
  widgetOpen: false,
  widgetMinimized: false,
  unreadCount: 0,
  userInfo: null, // { name, contact, isStaff }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action) => {
      const exists = state.conversations.find(c => c.uuid === action.payload.uuid);
      if (!exists) {
        state.conversations.unshift(action.payload);
      }
    },
    updateConversation: (state, action) => {
      const index = state.conversations.findIndex(c => c.uuid === action.payload.uuid);
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...action.payload };
      }
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    toggleWidget: (state) => {
      state.widgetOpen = !state.widgetOpen;
      if (state.widgetOpen) {
        state.widgetMinimized = false;
      }
    },
    openWidget: (state) => {
      state.widgetOpen = true;
      state.widgetMinimized = false;
    },
    closeWidget: (state) => {
      state.widgetOpen = false;
    },
    minimizeWidget: (state) => {
      state.widgetMinimized = !state.widgetMinimized;
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
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    clearUserInfo: (state) => {
      state.userInfo = null;
    }
  }
});

export const {
  setConversations,
  addConversation,
  updateConversation,
  setActiveConversation,
  toggleWidget,
  openWidget,
  closeWidget,
  minimizeWidget,
  setUnreadCount,
  incrementUnreadCount,
  resetUnreadCount,
  setUserInfo,
  clearUserInfo
} = chatSlice.actions;

export default chatSlice.reducer;

// Selectors
export const selectConversations = (state) => state.chat.conversations;
export const selectActiveConversation = (state) => state.chat.activeConversation;
export const selectWidgetOpen = (state) => state.chat.widgetOpen;
export const selectWidgetMinimized = (state) => state.chat.widgetMinimized;
export const selectUnreadCount = (state) => state.chat.unreadCount;
export const selectUserInfo = (state) => state.chat.userInfo;