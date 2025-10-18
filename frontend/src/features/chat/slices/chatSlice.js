// filepath: src/features/chat/slices/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { setAccessToken } from "src/services/api";

// Async thunks
export const createOrResumeConversation = createAsyncThunk(
  "chat/createOrResumeConversation",
  async ({ name, contact, existingUuid }, { rejectWithValue }) => {
    try {
      if (existingUuid) {
        // try to fetch to validate
        const res = await api.get(`/message/conversations/${existingUuid}`);
        return { conversation: res.data.data };
      }
      const res = await api.post("/message/conversations", {
        name,
        contact,
        subject: "Web widget",
      });
      return { conversation: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ uuid, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/message/conversations/${uuid}/messages?page=${page}`);
      return { messages: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const sendMessageApi = createAsyncThunk(
  "chat/sendMessageApi",
  async ({ uuid, body, files = [] }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      if (body) fd.append("body", body);
      files.forEach((f) => fd.append("attachments[]", f));
      const res = await api.post(`/message/conversations/${uuid}/messages`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          // upload progress handled in component via event (not here)
        },
      });
      return { message: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversation: null,
    messages: [],
    typing: {},
    loading: false,
    error: null,
  },
  reducers: {
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    replaceMessage(state, action) {
      const idx = state.messages.findIndex((m) => m.temp_id === action.payload.temp_id);
      if (idx !== -1) state.messages[idx] = action.payload;
    },
    setTyping(state, action) {
      state.typing = { ...state.typing, ...action.payload };
    },
    clearTyping(state, action) {
      state.typing = {};
    },
    optimisticAdd(state, action) {
      state.messages.push(action.payload);
    },
    removeMessageByTempId(state, action) {
      state.messages = state.messages.filter((m) => m.temp_id !== action.payload);
    },
    setConversation(state, action) {
      state.conversation = action.payload;
    },
    clearChat(state) {
      state.conversation = null;
      state.messages = [];
      state.typing = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrResumeConversation.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createOrResumeConversation.fulfilled, (s, a) => {
        s.loading = false;
        s.conversation = a.payload.conversation;
      })
      .addCase(createOrResumeConversation.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        s.messages = a.payload.messages;
      })
      .addCase(sendMessageApi.fulfilled, (s, a) => {
        // server returned saved message, append or replace based on id
        // naive append:
        s.messages.push(a.payload.message);
      })
      .addCase(sendMessageApi.rejected, (s, a) => {
        s.error = a.payload;
      });
  },
});

export const {
  addMessage,
  setTyping,
  clearTyping,
  optimisticAdd,
  removeMessageByTempId,
  replaceMessage,
  setConversation,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;