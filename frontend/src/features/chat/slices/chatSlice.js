// filepath: src/features/chat/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { widgetService } from '../services/widgetService';
import { adminService } from '../services/adminService';

// Thunks for widget
export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async ({ name, email, phone, message }, thunkAPI) => {
    const response = await widgetService.startConversation({ name, email, phone, message });
    return response;
  }
);

export const fetchConversation = createAsyncThunk(
  'chat/fetchConversation',
  async (conversationId, thunkAPI) => {
    const response = await widgetService.fetchConversation(conversationId);
    return response;
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, message, file }, thunkAPI) => {
    const response = await widgetService.sendMessage({ conversationId, message, file });
    return response;
  }
);

// Thunks for admin
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, thunkAPI) => {
    const response = await adminService.getConversations();
    return response;
  }
);

export const fetchConversationDetails = createAsyncThunk(
  'chat/fetchConversationDetails',
  async (conversationId, thunkAPI) => {
    const response = await adminService.getConversationById(conversationId);
    return response;
  }
);

export const sendAdminReply = createAsyncThunk(
  'chat/sendAdminReply',
  async ({ conversationId, message, file }, thunkAPI) => {
    const response = await adminService.sendReply({ conversationId, message, file });
    return response;
  }
);

export const addAdminNote = createAsyncThunk(
  'chat/addAdminNote',
  async ({ conversationId, note }, thunkAPI) => {
    const response = await adminService.addNote(conversationId, note);
    return response;
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId, thunkAPI) => {
    const response = await adminService.deleteConversation(conversationId);
    return response;
  }
);

export const closeConversation = createAsyncThunk(
  'chat/closeConversation',
  async (conversationId, thunkAPI) => {
    const response = await adminService.closeConversation(conversationId);
    return response;
  }
);

const initialState = {
  conversationId: localStorage.getItem('chat_conversationId') || null,
  user: localStorage.getItem('chat_user') ? JSON.parse(localStorage.getItem('chat_user')) : { name: '', email: '', phone: '' },
  messages: [],
  isTyping: false,
  status: 'idle',
  error: null,
  admin: {
    conversations: [],
    selectedConversation: null,
    status: 'idle',
    error: null,
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    receiveMessage: (state, action) => {
      state.messages.push(action.payload);
      if (state.admin.selectedConversation && state.admin.selectedConversation.id === action.payload.conversationId) {
        state.admin.selectedConversation.messages.push(action.payload);
      }
      state.isTyping = false;
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    selectConversation: (state, action) => {
      state.admin.selectedConversation = action.payload;
    },
  },
  extraReducers: (builder) => {
    // startConversation
    builder.addCase(startConversation.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(startConversation.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const { conversationId, name, email, phone, messages } = action.payload;
      state.conversationId = conversationId;
      state.user = { name, email, phone };
      state.messages = messages || [];
      localStorage.setItem('chat_conversationId', conversationId);
      localStorage.setItem('chat_user', JSON.stringify({ name, email, phone }));
    });
    builder.addCase(startConversation.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // fetchConversation
    builder.addCase(fetchConversation.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchConversation.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const { conversationId, name, email, phone, messages } = action.payload;
      state.conversationId = conversationId;
      state.user = { name, email, phone };
      state.messages = messages || [];
      localStorage.setItem('chat_conversationId', conversationId);
      localStorage.setItem('chat_user', JSON.stringify({ name, email, phone }));
    });
    builder.addCase(fetchConversation.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // sendMessage (user)
    builder.addCase(sendMessage.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.messages.push(action.payload);
      if (state.admin.selectedConversation && state.admin.selectedConversation.id === action.payload.conversationId) {
        state.admin.selectedConversation.messages.push(action.payload);
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // fetchConversations (admin)
    builder.addCase(fetchConversations.pending, (state) => {
      state.admin.status = 'loading';
      state.admin.error = null;
    });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      state.admin.conversations = action.payload;
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.error.message;
    });

    // fetchConversationDetails (admin)
    builder.addCase(fetchConversationDetails.pending, (state) => {
      state.admin.status = 'loading';
      state.admin.error = null;
    });
    builder.addCase(fetchConversationDetails.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      state.admin.selectedConversation = action.payload;
    });
    builder.addCase(fetchConversationDetails.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.error.message;
    });

    // sendAdminReply
    builder.addCase(sendAdminReply.pending, (state) => {
      state.admin.status = 'loading';
      state.admin.error = null;
    });
    builder.addCase(sendAdminReply.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const message = action.payload;
      if (state.admin.selectedConversation) {
        state.admin.selectedConversation.messages.push(message);
      }
      state.messages.push(message);
    });
    builder.addCase(sendAdminReply.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.error.message;
    });

    // addAdminNote
    builder.addCase(addAdminNote.pending, (state) => {
      state.admin.status = 'loading';
      state.admin.error = null;
    });
    builder.addCase(addAdminNote.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const note = action.payload;
      if (state.admin.selectedConversation) {
        state.admin.selectedConversation.notes.push(note);
      }
    });
    builder.addCase(addAdminNote.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.error.message;
    });

    // deleteConversation (admin)
    builder.addCase(deleteConversation.pending, (state) => {
      state.admin.status = 'loading';
      state.admin.error = null;
    });
    builder.addCase(deleteConversation.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const deletedId = action.meta.arg;
      state.admin.conversations = state.admin.conversations.filter(c => c.id !== deletedId);
      if (state.admin.selectedConversation && state.admin.selectedConversation.id === deletedId) {
        state.admin.selectedConversation = null;
      }
      if (state.conversationId === deletedId) {
        state.conversationId = null;
        localStorage.removeItem('chat_conversationId');
        localStorage.removeItem('chat_user');
        state.messages = [];
      }
    });
    builder.addCase(deleteConversation.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.error.message;
    });

    // closeConversation (admin)
    builder.addCase(closeConversation.pending, (state) => {
      state.admin.status = 'loading';
      state.admin.error = null;
    });
    builder.addCase(closeConversation.fulfilled, (state, action) => {
      state.admin.status = 'succeeded';
      const closedId = action.meta.arg;
      state.admin.conversations = state.admin.conversations.filter(c => c.id !== closedId);
      if (state.admin.selectedConversation && state.admin.selectedConversation.id === closedId) {
        state.admin.selectedConversation = null;
      }
      if (state.conversationId === closedId) {
        state.conversationId = null;
        localStorage.removeItem('chat_conversationId');
        localStorage.removeItem('chat_user');
        state.messages = [];
      }
    });
    builder.addCase(closeConversation.rejected, (state, action) => {
      state.admin.status = 'failed';
      state.admin.error = action.error.message;
    });
  },
});

export const { receiveMessage, setTyping, selectConversation } = chatSlice.actions;
export default chatSlice.reducer;