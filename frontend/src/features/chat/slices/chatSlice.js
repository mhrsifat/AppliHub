// filepath: src/features/chat/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { widgetService } from '../services/widgetService';
import { adminService } from '../services/adminService';

// Helper function to safely parse localStorage
const getStoredData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    // Try to parse the JSON
    const parsed = JSON.parse(item);
    return parsed;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    console.warn('Corrupted data:', localStorage.getItem(key));
    
    // Clear the corrupted data
    try {
      localStorage.removeItem(key);
      console.log(`Cleared corrupted ${key} from localStorage`);
    } catch (clearError) {
      console.error('Error clearing localStorage:', clearError);
    }
    
    return defaultValue;
  }
};

// Helper function to safely save to localStorage
const setStoredData = (key, value) => {
  try {
    const stringified = JSON.stringify(value);
    localStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// Helper function to safely remove from localStorage
const removeStoredData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

// Thunks for widget
export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async ({ name, contact, message }, { rejectWithValue }) => {
    try {
      const response = await widgetService.startConversation({ name, contact, message });
      console.log('startConversation API response:', response);
      return response;
    } catch (error) {
      console.error('startConversation error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'chat/fetchConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const response = await widgetService.fetchConversation(conversationUuid);
      console.log('fetchConversation API response:', response);
      return response;
    } catch (error) {
      console.error('fetchConversation error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationUuid, message, file }, { rejectWithValue }) => {
    try {
      const response = await widgetService.sendMessage({ conversationUuid, message, file });
      console.log('sendMessage API response:', response);
      return response;
    } catch (error) {
      console.error('sendMessage error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Thunks for admin
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getConversations(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchConversationDetails = createAsyncThunk(
  'chat/fetchConversationDetails',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const response = await adminService.getConversationById(conversationUuid);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendAdminReply = createAsyncThunk(
  'chat/sendAdminReply',
  async ({ conversationUuid, message, file }, { rejectWithValue }) => {
    try {
      const response = await adminService.sendReply({ conversationUuid, message, file });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addAdminNote = createAsyncThunk(
  'chat/addAdminNote',
  async ({ conversationUuid, note }, { rejectWithValue }) => {
    try {
      const response = await adminService.addNote(conversationUuid, note);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const response = await adminService.deleteConversation(conversationUuid);
      return { ...response, deletedId: conversationUuid };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const closeConversation = createAsyncThunk(
  'chat/closeConversation',
  async (conversationUuid, { rejectWithValue }) => {
    try {
      const response = await adminService.closeConversation(conversationUuid);
      return { ...response, closedId: conversationUuid };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  // Widget state
  conversationUuid: getStoredData('chat_conversationUuid'),
  user: getStoredData('chat_user', { name: '', contact: '' }),
  messages: [],
  isTyping: false,
  isLoading: false,
  error: null,
  
  // Admin state
  admin: {
    conversations: [],
    selectedConversation: null,
    status: 'idle',
    error: null,
    filters: {
      status: 'all',
      search: '',
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    receiveMessage: (state, action) => {
      const messageData = action.payload;
      
      // Normalize message structure
      const normalizedMessage = {
        id: messageData.id,
        conversation_id: messageData.conversation_id || messageData.conversationUuid,
        sender_name: messageData.sender_name || messageData.senderName || messageData.name,
        sender_contact: messageData.sender_contact || messageData.senderContact || messageData.contact,
        is_staff: messageData.is_staff || messageData.isStaff || false,
        body: messageData.body || messageData.message || messageData.text || '',
        attachments: messageData.attachments || [],
        created_at: messageData.created_at || messageData.createdAt || messageData.timestamp,
      };
      
      if (normalizedMessage.conversation_id === state.conversationUuid) {
        const exists = state.messages.some(msg => msg.id === normalizedMessage.id);
        if (!exists) {
          state.messages.push(normalizedMessage);
        }
      }
      
      if (state.admin.selectedConversation && 
          state.admin.selectedConversation.id === normalizedMessage.conversation_id) {
        const conversationExists = state.admin.selectedConversation.messages?.some(
          msg => msg.id === normalizedMessage.id
        );
        if (!conversationExists) {
          if (!state.admin.selectedConversation.messages) {
            state.admin.selectedConversation.messages = [];
          }
          state.admin.selectedConversation.messages.push(normalizedMessage);
        }
      }
      
      state.isTyping = false;
    },
    
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    
    selectConversation: (state, action) => {
      state.admin.selectedConversation = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
      state.admin.error = null;
    },
    
    resetChat: (state) => {
      state.conversationUuid = null;
      state.user = { name: '', contact: '' };
      state.messages = [];
      state.isTyping = false;
      state.isLoading = false;
      state.error = null;
      
      // Clear localStorage using helper
      removeStoredData('chat_conversationUuid');
      removeStoredData('chat_user');
    },
    
    updateAdminFilters: (state, action) => {
      state.admin.filters = { ...state.admin.filters, ...action.payload };
    },
    
    updateAdminPagination: (state, action) => {
      state.admin.pagination = { ...state.admin.pagination, ...action.payload };
    },
  },
  
  extraReducers: (builder) => {
    // startConversation
    builder
      .addCase(startConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        console.log('startConversation fulfilled payload:', action.payload);
        
        state.isLoading = false;
        
        // Handle the API response structure: { data: { id, uuid, created_by_name, ... } }
        const data = action.payload.data || action.payload;
        
        // Use UUID as conversationUuid
        const convId = data.uuid || data.id;
        const userName = data.created_by_name || data.name || '';
        const userContact = data.created_by_contact || data.contact || '';
        
        state.conversationUuid = convId;
        state.user = { 
          name: userName, 
          contact: userContact 
        };
        
        // Handle messages array - normalize structure
        const messagesArray = data.messages || [];
        state.messages = Array.isArray(messagesArray) ? messagesArray.map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id || msg.conversationUuid,
          sender_name: msg.sender_name || msg.senderName || msg.name,
          sender_contact: msg.sender_contact || msg.senderContact || msg.contact,
          is_staff: msg.is_staff || msg.isStaff || false,
          body: msg.body || msg.message || msg.text || '',
          attachments: msg.attachments || [],
          created_at: msg.created_at || msg.createdAt || msg.timestamp,
        })) : [];
        
        console.log('Normalized messages:', state.messages);
        
        // Save to localStorage using helper
        setStoredData('chat_conversationUuid', convId);
        setStoredData('chat_user', { name: userName, contact: userContact });
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });

    // fetchConversation
    builder
      .addCase(fetchConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        console.log('fetchConversation fulfilled payload:', action.payload);
        
        state.isLoading = false;
        
        // Handle conversation data structure
        const conversationData = action.payload.data || action.payload;
        
        const convId = conversationData.uuid || conversationData.id;
        
        // When fetching messages only, user info comes from stored state
        // Keep existing user info if available
        const userName = conversationData.created_by_name || state.user?.name || '';
        const userContact = conversationData.created_by_contact || state.user?.contact || '';
        
        state.conversationUuid = convId;
        state.user = { 
          name: userName, 
          contact: userContact 
        };
        
        // Handle messages - could be nested in data.messages or at top level
        const messagesArray = conversationData.messages || action.payload.data || [];
        
        // Normalize message structure if needed
        state.messages = Array.isArray(messagesArray) ? messagesArray.map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id || msg.conversationUuid,
          sender_name: msg.sender_name || msg.senderName || msg.name,
          sender_contact: msg.sender_contact || msg.senderContact || msg.contact,
          is_staff: msg.is_staff || msg.isStaff || false,
          body: msg.body || msg.message || msg.text || '',
          attachments: msg.attachments || [],
          created_at: msg.created_at || msg.createdAt || msg.timestamp,
        })) : [];
        
        console.log('Normalized messages:', state.messages);
        
        // Save to localStorage using helper (only if we have user info)
        if (convId) {
          setStoredData('chat_conversationUuid', convId);
        }
        if (userName || userContact) {
          setStoredData('chat_user', { name: userName, contact: userContact });
        }
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
        
        if (action.payload?.includes('not found') || action.payload?.includes('invalid')) {
          state.conversationUuid = null;
          state.messages = [];
          removeStoredData('chat_conversationUuid');
          removeStoredData('chat_user');
        }
      });

    // sendMessage
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const responseData = action.payload.data || action.payload;
        const messageData = responseData.message || responseData;
        
        // Normalize message structure
        const normalizedMessage = {
          id: messageData.id,
          conversation_id: messageData.conversation_id || messageData.conversationUuid,
          sender_name: messageData.sender_name || messageData.senderName || messageData.name,
          sender_contact: messageData.sender_contact || messageData.senderContact || messageData.contact,
          is_staff: messageData.is_staff || messageData.isStaff || false,
          body: messageData.body || messageData.message || messageData.text || '',
          attachments: messageData.attachments || [],
          created_at: messageData.created_at || messageData.createdAt || messageData.timestamp,
        };
        
        const exists = state.messages.some(msg => msg.id === normalizedMessage.id);
        if (!exists) {
          state.messages.push(normalizedMessage);
        }
        
        if (state.admin.selectedConversation && 
            (state.admin.selectedConversation.id === normalizedMessage.conversation_id ||
             state.admin.selectedConversation.id === normalizedMessage.conversationUuid)) {
          const conversationExists = state.admin.selectedConversation.messages?.some(
            msg => msg.id === normalizedMessage.id
          );
          if (!conversationExists) {
            if (!state.admin.selectedConversation.messages) {
              state.admin.selectedConversation.messages = [];
            }
            state.admin.selectedConversation.messages.push(normalizedMessage);
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });

    // fetchConversations (admin)
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.admin.status = 'loading';
        state.admin.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.admin.status = 'succeeded';
        
        if (Array.isArray(action.payload)) {
          state.admin.conversations = action.payload;
        } else if (action.payload.data && Array.isArray(action.payload.data)) {
          state.admin.conversations = action.payload.data;
          if (action.payload.pagination) {
            state.admin.pagination = { 
              ...state.admin.pagination, 
              ...action.payload.pagination 
            };
          }
        } else {
          state.admin.conversations = [];
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.admin.status = 'failed';
        state.admin.error = action.payload || action.error.message;
      });

    // fetchConversationDetails (admin)
    builder
      .addCase(fetchConversationDetails.pending, (state) => {
        state.admin.status = 'loading';
        state.admin.error = null;
      })
      .addCase(fetchConversationDetails.fulfilled, (state, action) => {
        state.admin.status = 'succeeded';
        const data = action.payload.data || action.payload;
        state.admin.selectedConversation = data;
      })
      .addCase(fetchConversationDetails.rejected, (state, action) => {
        state.admin.status = 'failed';
        state.admin.error = action.payload || action.error.message;
      });

    // sendAdminReply
    builder
      .addCase(sendAdminReply.pending, (state) => {
        state.admin.status = 'loading';
        state.admin.error = null;
      })
      .addCase(sendAdminReply.fulfilled, (state, action) => {
        state.admin.status = 'succeeded';
        const data = action.payload.data || action.payload;
        const message = data.message || data;
        
        if (state.admin.selectedConversation) {
          if (!state.admin.selectedConversation.messages) {
            state.admin.selectedConversation.messages = [];
          }
          const exists = state.admin.selectedConversation.messages.some(
            msg => msg.id === message.id
          );
          if (!exists) {
            state.admin.selectedConversation.messages.push(message);
          }
        }
        
        if (state.conversationUuid === (message.conversation_id || message.conversationUuid)) {
          const widgetExists = state.messages.some(msg => msg.id === message.id);
          if (!widgetExists) {
            state.messages.push(message);
          }
        }
      })
      .addCase(sendAdminReply.rejected, (state, action) => {
        state.admin.status = 'failed';
        state.admin.error = action.payload || action.error.message;
      });

    // addAdminNote
    builder
      .addCase(addAdminNote.pending, (state) => {
        state.admin.status = 'loading';
        state.admin.error = null;
      })
      .addCase(addAdminNote.fulfilled, (state, action) => {
        state.admin.status = 'succeeded';
        const data = action.payload.data || action.payload;
        const note = data.note || data;
        
        if (state.admin.selectedConversation) {
          if (!state.admin.selectedConversation.notes) {
            state.admin.selectedConversation.notes = [];
          }
          state.admin.selectedConversation.notes.push(note);
        }
      })
      .addCase(addAdminNote.rejected, (state, action) => {
        state.admin.status = 'failed';
        state.admin.error = action.payload || action.error.message;
      });

    // deleteConversation
    builder
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.admin.status = 'succeeded';
        const deletedId = action.payload.deletedId || action.meta.arg;
        
        state.admin.conversations = state.admin.conversations.filter(
          c => c.id !== deletedId && c.uuid !== deletedId
        );
        
        if (state.admin.selectedConversation?.id === deletedId || 
            state.admin.selectedConversation?.uuid === deletedId) {
          state.admin.selectedConversation = null;
        }
        
        if (state.conversationUuid === deletedId) {
          state.conversationUuid = null;
          state.messages = [];
          removeStoredData('chat_conversationUuid');
          removeStoredData('chat_user');
        }
      });

    // closeConversation
    builder
      .addCase(closeConversation.fulfilled, (state, action) => {
        state.admin.status = 'succeeded';
        const closedId = action.payload.closedId || action.meta.arg;
        
        state.admin.conversations = state.admin.conversations.map(conv =>
          (conv.id === closedId || conv.uuid === closedId) 
            ? { ...conv, status: 'closed' } 
            : conv
        );
        
        if (state.admin.selectedConversation?.id === closedId || 
            state.admin.selectedConversation?.uuid === closedId) {
          state.admin.selectedConversation.status = 'closed';
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
  updateAdminPagination
} = chatSlice.actions;

export default chatSlice.reducer;