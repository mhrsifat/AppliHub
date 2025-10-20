// filepath: src/features/chat/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { widgetService } from '../services/widgetService';
import { adminService } from '../services/adminService';

// Safe localStorage helpers
const getStoredData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    try { localStorage.removeItem(key); } catch (e) {}
    return defaultValue;
  }
};
const setStoredData = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};
const removeStoredData = (key) => {
  try { localStorage.removeItem(key); } catch (e) {}
};

// Normalize a message shape from various API shapes
const normalizeMessage = (m = {}) => ({
  id: m.id,
  conversation_id: m.conversation_id ?? m.conversationUuid ?? m.conversation ?? null,
  sender_name: m.sender_name ?? m.senderName ?? m.name ?? '',
  sender_contact: m.sender_contact ?? m.senderContact ?? m.contact ?? '',
  is_staff: m.is_staff ?? m.isStaff ?? false,
  body: m.body ?? m.message ?? m.text ?? '',
  attachments: m.attachments ?? [],
  created_at: m.created_at ?? m.createdAt ?? m.timestamp ?? null,
});

// Thunks
export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async ({ name, contact, message }, { rejectWithValue }) => {
    try {
      const res = await widgetService.startConversation({ name, contact, message });
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to start conversation');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'chat/fetchConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await widgetService.fetchConversation(conversationUuid);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to fetch conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationUuid, message, file }, { rejectWithValue }) => {
    try {
      const res = await widgetService.sendMessage({ conversationUuid, message, file });
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to send message');
    }
  }
);

// Admin thunks (kept simple — rely on adminService implementation)
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await adminService.getConversations(params);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchConversationDetails = createAsyncThunk(
  'chat/fetchConversationDetails',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await adminService.getConversationById(conversationUuid);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to fetch details');
    }
  }
);

export const sendAdminReply = createAsyncThunk(
  'chat/sendAdminReply',
  async ({ conversationUuid, message, file }, { rejectWithValue }) => {
    try {
      const res = await adminService.sendReply({ conversationUuid, message, file });
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to send admin reply');
    }
  }
);

export const addAdminNote = createAsyncThunk(
  'chat/addAdminNote',
  async ({ conversationUuid, note }, { rejectWithValue }) => {
    try {
      const res = await adminService.addNote(conversationUuid, note);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to add note');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await adminService.deleteConversation(conversationUuid);
      return { ...res, deletedId: conversationUuid };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to delete conversation');
    }
  }
);

export const closeConversation = createAsyncThunk(
  'chat/closeConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await adminService.closeConversation(conversationUuid);
      return { ...res, closedId: conversationUuid };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to close conversation');
    }
  }
);

// initialState
const initialState = {
  // widget
  conversationUuid: getStoredData('chat_conversationUuid', null),
  user: getStoredData('chat_user', { name: '', contact: '' }),
  messages: [],
  isTyping: false,
  isLoading: false, // used for start/fetch initial flows
  isSending: false, // used for message send flows (so input remains visible)
  error: null,

  // admin
  admin: {
    conversations: [],
    selectedConversation: null,
    status: 'idle',
    error: null,
    filters: { status: 'all', search: '' },
    pagination: { page: 1, limit: 20, total: 0 },
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    receiveMessage(state, action) {
      const incoming = normalizeMessage(action.payload);
      // If widget's current conversation matches incoming, push
      if (state.conversationUuid && String(incoming.conversation_id) === String(state.conversationUuid)) {
        if (!state.messages.some(m => m.id === incoming.id)) {
          state.messages.push(incoming);
        }
      }
      // Mirror to admin selected conversation if applicable
      if (state.admin.selectedConversation) {
        const selId = state.admin.selectedConversation.id ?? state.admin.selectedConversation.uuid;
        if (String(selId) === String(incoming.conversation_id)) {
          state.admin.selectedConversation.messages = state.admin.selectedConversation.messages || [];
          if (!state.admin.selectedConversation.messages.some(m => m.id === incoming.id)) {
            state.admin.selectedConversation.messages.push(incoming);
          }
        }
      }
      state.isTyping = false;
    },

    setTyping(state, action) {
      state.isTyping = !!action.payload;
    },

    selectConversation(state, action) {
      state.admin.selectedConversation = action.payload;
    },

    clearError(state) {
      state.error = null;
      state.admin.error = null;
    },

    resetChat(state) {
      state.conversationUuid = null;
      state.user = { name: '', contact: '' };
      state.messages = [];
      state.isTyping = false;
      state.isLoading = false;
      state.isSending = false;
      state.error = null;
      removeStoredData('chat_conversationUuid');
      removeStoredData('chat_user');
    },

    updateAdminFilters(state, action) {
      state.admin.filters = { ...state.admin.filters, ...action.payload };
    },

    updateAdminPagination(state, action) {
      state.admin.pagination = { ...state.admin.pagination, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    // startConversation
    builder.addCase(startConversation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(startConversation.fulfilled, (state, action) => {
      state.isLoading = false;
      const data = action.payload?.data ?? action.payload ?? {};
      const convId = data.uuid ?? data.id ?? null;
      const userName = data.created_by_name ?? data.name ?? '';
      const userContact = data.created_by_contact ?? data.contact ?? '';
      state.conversationUuid = convId;
      state.user = { name: userName, contact: userContact };
      const msgs = Array.isArray(data.messages) ? data.messages.map(normalizeMessage) : [];
      state.messages = msgs;
      setStoredData('chat_conversationUuid', convId);
      setStoredData('chat_user', state.user);
    });
    builder.addCase(startConversation.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? action.error?.message ?? 'Failed to start conversation';
    });

    // fetchConversation
    builder.addCase(fetchConversation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchConversation.fulfilled, (state, action) => {
      state.isLoading = false;
      const data = action.payload?.data ?? action.payload ?? {};
      const convId = data.uuid ?? data.id ?? state.conversationUuid;
      const userName = data.created_by_name ?? state.user?.name ?? '';
      const userContact = data.created_by_contact ?? state.user?.contact ?? '';
      state.conversationUuid = convId;
      state.user = { name: userName, contact: userContact };
      const msgs = Array.isArray(data.messages) ? data.messages.map(normalizeMessage) : [];
      state.messages = msgs;
      if (convId) setStoredData('chat_conversationUuid', convId);
      setStoredData('chat_user', state.user);
    });
    builder.addCase(fetchConversation.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? action.error?.message ?? 'Failed to fetch conversation';
      const p = action.payload ?? '';
      if (typeof p === 'string' && (p.toLowerCase().includes('not found') || p.toLowerCase().includes('invalid'))) {
        state.conversationUuid = null;
        state.messages = [];
        removeStoredData('chat_conversationUuid');
        removeStoredData('chat_user');
      }
    });

    // sendMessage: use isSending so input stays visible
    builder.addCase(sendMessage.pending, (state) => {
      state.isSending = true;
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.isSending = false;
      const resp = action.payload?.data ?? action.payload ?? {};
      const msg = resp.message ?? resp;
      const normalized = normalizeMessage(msg);
      if (!state.messages.some(m => m.id === normalized.id)) {
        state.messages.push(normalized);
      }
      // mirror to admin selected conversation if applicable
      if (state.admin.selectedConversation) {
        const selId = state.admin.selectedConversation.id ?? state.admin.selectedConversation.uuid;
        if (String(selId) === String(normalized.conversation_id)) {
          state.admin.selectedConversation.messages = state.admin.selectedConversation.messages || [];
          if (!state.admin.selectedConversation.messages.some(m => m.id === normalized.id)) {
            state.admin.selectedConversation.messages.push(normalized);
          }
        }
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.isSending = false;
      state.error = action.payload ?? action.error?.message ?? 'Failed to send message';
    });

    // admin flows (selected handling)
    builder.addCase(fetchConversations.pending, (state) => { state.admin.status = 'loading'; state.admin.error = null; });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      if (Array.isArray(action.payload)) state.admin.conversations = action.payload;
      else if (action.payload?.data && Array.isArray(action.payload.data)) state.admin.conversations = action.payload.data;
      else state.admin.conversations = [];
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload ?? action.error?.message ?? 'Failed to fetch conversations';
    });

    builder.addCase(fetchConversationDetails.fulfilled, (state, action) => {
      state.admin.selectedConversation = action.payload?.data ?? action.payload ?? null;
    });

    builder.addCase(sendAdminReply.fulfilled, (state, action) => {
      const data = action.payload?.data ?? action.payload ?? {};
      const message = data.message ?? data;
      if (state.admin.selectedConversation) {
        state.admin.selectedConversation.messages = state.admin.selectedConversation.messages || [];
        if (!state.admin.selectedConversation.messages.some(m => m.id === message.id)) {
          state.admin.selectedConversation.messages.push(message);
        }
      }
      if (String(state.conversationUuid) === String(message.conversation_id)) {
        if (!state.messages.some(m => m.id === message.id)) state.messages.push(message);
      }
    });

    builder.addCase(addAdminNote.fulfilled, (state, action) => {
      const note = action.payload?.data ?? action.payload ?? null;
      if (note && state.admin.selectedConversation) {
        state.admin.selectedConversation.notes = state.admin.selectedConversation.notes || [];
        state.admin.selectedConversation.notes.push(note);
      }
    });

    builder.addCase(deleteConversation.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const deletedId = action.payload?.deletedId ?? action.meta.arg;
      state.admin.conversations = state.admin.conversations.filter(c => String(c.id) !== String(deletedId) && String(c.uuid) !== String(deletedId));
      if (state.admin.selectedConversation && (String(state.admin.selectedConversation.id) === String(deletedId) || String(state.admin.selectedConversation.uuid) === String(deletedId))) {
        state.admin.selectedConversation = null;
      }
      if (String(state.conversationUuid) === String(deletedId)) {
        state.conversationUuid = null;
        state.messages = [];
        removeStoredData('chat_conversationUuid');
        removeStoredData('chat_user');
      }
    });

    builder.addCase(closeConversation.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const closedId = action.payload?.closedId ?? action.meta.arg;
      state.admin.conversations = state.admin.conversations.filter(c => String(c.id) !== String(closedId) && String(c.uuid) !== String(closedId));
      if (state.admin.selectedConversation && (String(state.admin.selectedConversation.id) === String(closedId) || String(state.admin.selectedConversation.uuid) === String(closedId))) {
        state.admin.selectedConversation = null;
      }
      if (String(state.conversationUuid) === String(closedId)) {
        state.conversationUuid = null;
        state.messages = [];
        removeStoredData('chat_conversationUuid');
        removeStoredData('chat_user');
      }
    });
  }
});

export const {
  receiveMessage,
  setTyping,
  selectConversation,
  clearError,
  resetChat,
  updateAdminFilters,
  updateAdminPagination
} = chatSlice.actions;

export default chatSlice.reducer;