// filepath: src/features/chat/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { widgetService } from '../services/widgetService';
import { adminService } from '../services/adminService';

const getStoredData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Failed to parse localStorage.${key}:`, err);
    try { localStorage.removeItem(key); } catch (e) {}
    return defaultValue;
  }
};

const setStoredData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Failed to set localStorage.${key}:`, err);
    return false;
  }
};

const removeStoredData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`Failed to remove localStorage.${key}:`, err);
    return false;
  }
};

// -------- Thunks --------
export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async ({ name, contact, message, subject }, { rejectWithValue }) => {
    try {
      const res = await widgetService.startConversation({ name, contact, message, subject });
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
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
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchConversationMessages = createAsyncThunk(
  'chat/fetchConversationMessages',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await widgetService.fetchConversationMessages(conversationUuid);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationUuid, body, attachments }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { name, contact } = state.chat.user;
      
      const res = await widgetService.sendMessage({ 
        conversationUuid, 
        name, 
        contact, 
        body, 
        attachments 
      });
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Admin thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await adminService.getConversations(params);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
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
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ADD THIS: New thunk to fetch conversation with messages for admin
export const fetchAdminConversationWithMessages = createAsyncThunk(
  'chat/fetchAdminConversationWithMessages',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      // Fetch both conversation details and messages
      const [conversationRes, messagesRes] = await Promise.all([
        adminService.getConversationById(conversationUuid),
        widgetService.fetchConversationMessages(conversationUuid)
      ]);
      
      return {
        conversation: conversationRes,
        messages: messagesRes
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
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
      return rejectWithValue(err.response?.data || err.message);
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
      return rejectWithValue(err.response?.data || err.message);
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
      return rejectWithValue(err.response?.data || err.message);
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
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await adminService.markAsRead(conversationUuid);
      return { ...res, readId: conversationUuid };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const assignConversation = createAsyncThunk(
  'chat/assignConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await adminService.assignConversation(conversationUuid);
      return { ...res, assignedId: conversationUuid };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const joinConversation = createAsyncThunk(
  'chat/joinConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const res = await adminService.joinConversation(conversationUuid);
      return { ...res, joinedId: conversationUuid };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -------- initial state --------
const initialState = {
  // widget
  conversationUuid: getStoredData('chat_conversationUuid', null),
  user: getStoredData('chat_user', { name: '', contact: '' }),
  messages: [],
  isTyping: false,
  isLoading: false,
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

// -------- helpers --------
const normalizeMessage = (m) => {
  if (!m) return null;
  
  return {
    id: m.id ?? m.uuid ?? null,
    conversation_id: m.conversation_id ?? m.conversationUuid ?? m.conversation_uuid ?? null,
    sender_name: m.sender_name ?? m.senderName ?? m.created_by_name ?? m.name ?? 'Unknown',
    sender_contact: m.sender_contact ?? m.senderContact ?? m.created_by_contact ?? m.contact ?? '',
    is_staff: !!(m.is_staff ?? m.isStaff ?? false),
    is_internal: !!(m.is_internal ?? m.isInternal ?? false),
    body: m.body ?? m.message ?? m.text ?? '',
    attachments: Array.isArray(m.attachments) ? m.attachments : (m.attachments ? [m.attachments] : []),
    created_at: m.created_at ?? m.createdAt ?? m.timestamp ?? null,
    updated_at: m.updated_at ?? m.updatedAt ?? null,
    sender_user_id: m.sender_user_id ?? null,
  };
};

const normalizeConversation = (c) => ({
  id: c.id ?? null,
  uuid: c.uuid ?? c.id ?? null,
  subject: c.subject ?? '',
  status: c.status ?? 'open',
  created_by_name: c.created_by_name ?? c.name ?? 'Anonymous',
  created_by_contact: c.created_by_contact ?? c.contact ?? '',
  last_message_preview: c.last_message_preview ?? c.lastMessage ?? '',
  last_message_at: c.last_message_at ?? c.lastMessageAt ?? c.updated_at ?? c.created_at,
  created_at: c.created_at ?? c.createdAt,
  updated_at: c.updated_at ?? c.updatedAt,
  assigned_to: c.assigned_to ?? c.assignedTo ?? null,
  closed_by: c.closed_by ?? c.closedBy ?? null,
  closed_at: c.closed_at ?? c.closedAt ?? null,
  messages: Array.isArray(c.messages) ? c.messages.map(normalizeMessage) : [],
  participants: Array.isArray(c.participants) ? c.participants : [],
  unread_count: c.unread_count ?? c.unreadCount ?? 0,
});

const normalizeMessagesArray = (arr) => (Array.isArray(arr) ? arr.map(normalizeMessage).filter(msg => msg !== null) : []);
const normalizeConversationsArray = (arr) => (Array.isArray(arr) ? arr.map(normalizeConversation) : []);

// -------- slice --------
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // FIXED: Properly handle Pusher message format and always add to messages
    receiveMessage(state, action) {
      console.log('🟢 receiveMessage action payload:', action.payload);
      
      // The message data is already extracted in useChat hook
      const normalized = normalizeMessage(action.payload);
      console.log('🟢 Normalized message:', normalized);

      if (!normalized || !normalized.id) return;

      const exists = state.messages.some((m) => m.id === normalized.id);
      
      // Always add to messages if it doesn't exist (Pusher channel ensures correct conversation)
      if (!exists) {
        state.messages.push(normalized);
        
        // Sort messages by timestamp to ensure correct order
        state.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }

      // admin selected conversation update
      if (state.admin.selectedConversation &&
          (state.admin.selectedConversation.uuid === normalized.conversation_id ||
           state.admin.selectedConversation.id === normalized.conversation_id)) {
        state.admin.selectedConversation.messages = state.admin.selectedConversation.messages || [];
        if (!state.admin.selectedConversation.messages.some((m) => m.id === normalized.id)) {
          state.admin.selectedConversation.messages.push(normalized);
          // Sort admin messages too
          state.admin.selectedConversation.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        
        // Update last message preview and timestamp
        state.admin.selectedConversation.last_message_preview = normalized.body;
        state.admin.selectedConversation.last_message_at = normalized.created_at;
      }

      state.isTyping = false;
    },

    setTyping(state, action) {
      state.isTyping = !!action.payload;
    },

    selectConversation(state, action) {
      state.admin.selectedConversation = action.payload ? normalizeConversation(action.payload) : null;
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

    // New action to update conversation in admin list
    updateConversationInList(state, action) {
      const updatedConversation = normalizeConversation(action.payload);
      const index = state.admin.conversations.findIndex(
        c => c.uuid === updatedConversation.uuid || c.id === updatedConversation.id
      );
      if (index !== -1) {
        state.admin.conversations[index] = updatedConversation;
      }
      
      // Also update selected conversation if it's the same
      if (state.admin.selectedConversation && 
          (state.admin.selectedConversation.uuid === updatedConversation.uuid ||
           state.admin.selectedConversation.id === updatedConversation.id)) {
        state.admin.selectedConversation = updatedConversation;
      }
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
      const payload = action.payload?.data ?? action.payload ?? {};
      
      // Extract conversation data properly
      const conversationData = payload.data || payload;
      const uuid = conversationData.uuid;
      const name = conversationData.created_by_name ?? state.user?.name ?? '';
      const contact = conversationData.created_by_contact ?? state.user?.contact ?? '';

      if (uuid) {
        state.conversationUuid = uuid;
        state.user = { name, contact };
        state.messages = []; // Clear messages - they will be fetched separately
        
        setStoredData('chat_conversationUuid', uuid);
        setStoredData('chat_user', { name, contact });
      }
    });
    builder.addCase(startConversation.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to start conversation';
    });

    // fetchConversation
    builder.addCase(fetchConversation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchConversation.fulfilled, (state, action) => {
      state.isLoading = false;
      const payload = action.payload?.data ?? action.payload ?? {};
      const conversationData = payload.data || payload;
      
      const uuid = conversationData.uuid;
      const name = conversationData.created_by_name ?? state.user?.name ?? '';
      const contact = conversationData.created_by_contact ?? state.user?.contact ?? '';

      state.conversationUuid = uuid;
      state.user = { name, contact };

      // Don't set messages from conversation data since it doesn't include messages
      // Messages will be fetched separately using fetchConversationMessages

      if (uuid) setStoredData('chat_conversationUuid', uuid);
      if (name || contact) setStoredData('chat_user', { name, contact });
    });
    builder.addCase(fetchConversation.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to fetch conversation';
      // if not found or invalid clear stored session
      const msg = (action.payload && JSON.stringify(action.payload).toLowerCase()) || '';
      if (msg.includes('not found') || msg.includes('invalid') || msg.includes('404')) {
        state.conversationUuid = null;
        state.messages = [];
        removeStoredData('chat_conversationUuid');
        removeStoredData('chat_user');
      }
    });

    // fetchConversationMessages
    builder.addCase(fetchConversationMessages.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchConversationMessages.fulfilled, (state, action) => {
      state.isLoading = false;
      const payload = action.payload;
      console.log('Messages API payload:', payload);
      
      // Extract messages array from the API response
      let messagesArray = [];
      if (payload && payload.data && Array.isArray(payload.data)) {
        messagesArray = payload.data;
      } else if (Array.isArray(payload)) {
        messagesArray = payload;
      } else if (payload && Array.isArray(payload.messages)) {
        messagesArray = payload.messages;
      }
      
      console.log('Extracted messages array:', messagesArray);
      state.messages = normalizeMessagesArray(messagesArray);
      state.error = null;
    });
    builder.addCase(fetchConversationMessages.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to fetch messages';
    });

    // ADD THIS: fetchAdminConversationWithMessages
    builder.addCase(fetchAdminConversationWithMessages.pending, (state) => {
      state.admin.status = 'loading';
    });
    builder.addCase(fetchAdminConversationWithMessages.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const { conversation, messages } = action.payload;
      
      // Normalize conversation data
      const conversationData = conversation?.data ?? conversation;
      const normalizedConversation = normalizeConversation(conversationData);
      
      // Extract and normalize messages
      let messagesArray = [];
      const messagesData = messages?.data ?? messages;
      
      if (messagesData && Array.isArray(messagesData)) {
        messagesArray = messagesData;
      } else if (messagesData && messagesData.data && Array.isArray(messagesData.data)) {
        messagesArray = messagesData.data;
      }
      
      // Combine conversation with messages
      state.admin.selectedConversation = {
        ...normalizedConversation,
        messages: normalizeMessagesArray(messagesArray)
      };
      
      state.admin.error = null;
    });
    builder.addCase(fetchAdminConversationWithMessages.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to load conversation details';
    });

    // sendMessage
    builder.addCase(sendMessage.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.isLoading = false;
      const payload = action.payload?.data ?? action.payload ?? {};
      // server might return created message in different shapes
      const msg = payload.message ?? payload.data ?? payload;
      const normalized = normalizeMessage(msg);

      if (normalized && normalized.id) {
        if (!state.messages.some((m) => m.id === normalized.id)) {
          state.messages.push(normalized);
        }
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to send message';
    });

    // fetchConversations (admin)
    builder.addCase(fetchConversations.pending, (state) => {
      state.admin.status = 'loading';
    });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const payload = action.payload ?? {};
      
      if (Array.isArray(payload)) {
        state.admin.conversations = normalizeConversationsArray(payload);
      } else if (Array.isArray(payload.data)) {
        state.admin.conversations = normalizeConversationsArray(payload.data);
        if (payload.meta || payload.pagination) {
          state.admin.pagination = { 
            ...state.admin.pagination, 
            ...(payload.meta ?? payload.pagination) 
          };
        }
      } else {
        state.admin.conversations = [];
      }
      state.admin.error = null;
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to load conversations';
    });

    // fetchConversationDetails (admin) - keep this for backward compatibility
    builder.addCase(fetchConversationDetails.pending, (state) => {
      state.admin.status = 'loading';
    });
    builder.addCase(fetchConversationDetails.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const payload = action.payload?.data ?? action.payload ?? {};
      state.admin.selectedConversation = normalizeConversation(payload.data || payload);
      state.admin.error = null;
    });
    builder.addCase(fetchConversationDetails.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to load conversation details';
    });

    // sendAdminReply
    builder.addCase(sendAdminReply.pending, (state) => {
      state.admin.status = 'loading';
    });
    builder.addCase(sendAdminReply.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const payload = action.payload?.data ?? action.payload ?? {};
      const message = normalizeMessage(payload.message ?? payload.data ?? payload);
      
      if (state.admin.selectedConversation) {
        state.admin.selectedConversation.messages = state.admin.selectedConversation.messages || [];
        if (!state.admin.selectedConversation.messages.some((m) => m.id === message.id)) {
          state.admin.selectedConversation.messages.push(message);
        }
        
        // Update conversation preview
        state.admin.selectedConversation.last_message_preview = message.body;
        state.admin.selectedConversation.last_message_at = message.created_at;
      }
      
      // reflect into widget messages if relevant
      if (state.conversationUuid && (message.conversation_id === state.conversationUuid || message.conversationUuid === state.conversationUuid)) {
        if (!state.messages.some((m) => m.id === message.id)) {
          state.messages.push(message);
        }
      }
      state.admin.error = null;
    });
    builder.addCase(sendAdminReply.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to send reply';
    });

    // addAdminNote
    builder.addCase(addAdminNote.pending, (state) => {
      state.admin.status = 'loading';
    });
    builder.addCase(addAdminNote.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const payload = action.payload?.data ?? action.payload ?? {};
      const note = normalizeMessage(payload.note ?? payload.data ?? payload);
      
      if (state.admin.selectedConversation) {
        state.admin.selectedConversation.messages = state.admin.selectedConversation.messages || [];
        if (!state.admin.selectedConversation.messages.some((m) => m.id === note.id)) {
          state.admin.selectedConversation.messages.push(note);
        }
      }
      state.admin.error = null;
    });
    builder.addCase(addAdminNote.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to add note';
    });

    // deleteConversation
    builder.addCase(deleteConversation.pending, (state) => {
      state.admin.status = 'loading';
    });
    builder.addCase(deleteConversation.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const deletedId = action.payload?.deletedId ?? action.meta.arg;
      state.admin.conversations = state.admin.conversations.filter((c) => 
        c.id !== deletedId && c.uuid !== deletedId
      );
      if (state.admin.selectedConversation && 
          (state.admin.selectedConversation.id === deletedId || state.admin.selectedConversation.uuid === deletedId)) {
        state.admin.selectedConversation = null;
      }
      if (state.conversationUuid === deletedId) {
        state.conversationUuid = null;
        state.messages = [];
        removeStoredData('chat_conversationUuid');
        removeStoredData('chat_user');
      }
      state.admin.error = null;
    });
    builder.addCase(deleteConversation.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to delete conversation';
    });

    // closeConversation
    builder.addCase(closeConversation.pending, (state) => {
      state.admin.status = 'loading';
    });
    builder.addCase(closeConversation.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const closedId = action.payload?.closedId ?? action.meta.arg;
      
      // Update the conversation in the list
      const updatedConversation = normalizeConversation(action.payload?.data ?? action.payload ?? {});
      const index = state.admin.conversations.findIndex(
        c => c.uuid === closedId || c.id === closedId
      );
      if (index !== -1) {
        state.admin.conversations[index] = {
          ...state.admin.conversations[index],
          status: 'closed',
          closed_at: updatedConversation.closed_at,
          closed_by: updatedConversation.closed_by
        };
      }
      
      // Update selected conversation if it's the same
      if (state.admin.selectedConversation && 
          (state.admin.selectedConversation.uuid === closedId || state.admin.selectedConversation.id === closedId)) {
        state.admin.selectedConversation.status = 'closed';
        state.admin.selectedConversation.closed_at = updatedConversation.closed_at;
        state.admin.selectedConversation.closed_by = updatedConversation.closed_by;
      }
      
      state.admin.error = null;
    });
    builder.addCase(closeConversation.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.payload?.message ?? action.payload ?? action.error?.message ?? 'Failed to close conversation';
    });

    // markAsRead
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const readId = action.payload?.readId ?? action.meta.arg;
      
      // Update conversation in list
      const index = state.admin.conversations.findIndex(
        c => c.uuid === readId || c.id === readId
      );
      if (index !== -1) {
        state.admin.conversations[index].unread_count = 0;
      }
      
      // Update selected conversation
      if (state.admin.selectedConversation && 
          (state.admin.selectedConversation.uuid === readId || state.admin.selectedConversation.id === readId)) {
        state.admin.selectedConversation.unread_count = 0;
      }
    });

    // assignConversation
    builder.addCase(assignConversation.fulfilled, (state, action) => {
      const assignedId = action.payload?.assignedId ?? action.meta.arg;
      const updatedConversation = normalizeConversation(action.payload?.data ?? action.payload ?? {});
      
      // Update conversation in list
      const index = state.admin.conversations.findIndex(
        c => c.uuid === assignedId || c.id === assignedId
      );
      if (index !== -1) {
        state.admin.conversations[index].assigned_to = updatedConversation.assigned_to;
      }
      
      // Update selected conversation
      if (state.admin.selectedConversation && 
          (state.admin.selectedConversation.uuid === assignedId || state.admin.selectedConversation.id === assignedId)) {
        state.admin.selectedConversation.assigned_to = updatedConversation.assigned_to;
      }
    });

    // joinConversation
    builder.addCase(joinConversation.fulfilled, (state, action) => {
      // Join typically doesn't change conversation data significantly
      // We can refresh the conversation details to get updated participants
      if (state.admin.selectedConversation && 
          (state.admin.selectedConversation.uuid === action.meta.arg || state.admin.selectedConversation.id === action.meta.arg)) {
        // Optionally refetch conversation details to get updated participants
        // This would be handled by the component if needed
      }
    });
  },
});

export const {
  receiveMessage,
  setTyping,
  selectConversation,
  clearError,
  resetChat,
  updateAdminFilters,
  updateAdminPagination,
  updateConversationInList,
} = chatSlice.actions;

export default chatSlice.reducer;