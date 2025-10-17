// filepath: src/features/chat/chatSlices.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import chatServices from "./chatServices";

/**
 * Redux slice handles conversations, messages, optimistic states and presence.
 */

export const fetchConversations = createAsyncThunk("chat/fetchConversations", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await chatServices.listConversations(params);
    return res;
  } catch (e) {
    return rejectWithValue(e.response?.data || e.message);
  }
});

export const fetchMessages = createAsyncThunk("chat/fetchMessages", async ({ uuid, page = 1, per_page = 50 }, { rejectWithValue }) => {
  try {
    const res = await chatServices.listMessages(uuid, { page, per_page });
    return { uuid, data: res };
  } catch (e) {
    return rejectWithValue(e.response?.data || e.message);
  }
});

export const createConversation = createAsyncThunk("chat/createConversation", async (payload, { rejectWithValue }) => {
  try {
    const res = await chatServices.createConversation(payload);
    return res;
  } catch (e) {
    return rejectWithValue(e.response?.data || e.message);
  }
});

export const sendMessage = createAsyncThunk("chat/sendMessage", async ({ uuid, body, name, contact, attachments, onUploadProgress } = {}, { rejectWithValue }) => {
  try {
    const res = await chatServices.sendMessage({ uuid, body, name, contact, attachments, onUploadProgress });
    return { uuid, data: res };
  } catch (e) {
    return rejectWithValue(e.response?.data || e.message);
  }
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    conversationsMeta: {},
    currentConversation: null,
    messages: {}, // { [uuid]: { data: [], meta: {} } }
    optimisticMap: {}, // tempId -> status
    loading: false,
    error: null,
    typing: {},
    presence: {}, // { [uuid]: { online: [], lastSeen: ... } }
  },
  reducers: {
    appendOptimisticMessage(state, action) {
      const { uuid, message } = action.payload;
      if (!state.messages[uuid]) state.messages[uuid] = { data: [], meta: {} };
      state.messages[uuid].data.push(message);
      state.optimisticMap[message._optimisticId] = { status: "sending" };
    },
    markOptimisticResolved(state, action) {
      const { uuid, tempId, serverMessage } = action.payload;
      if (!state.messages[uuid]) return;
      const idx = state.messages[uuid].data.findIndex((m) => m._optimisticId === tempId);
      if (idx !== -1) state.messages[uuid].data[idx] = serverMessage;
      delete state.optimisticMap[tempId];
    },
    markOptimisticFailed(state, action) {
      const { uuid, tempId } = action.payload;
      if (!state.messages[uuid]) return;
      const idx = state.messages[uuid].data.findIndex((m) => m._optimisticId === tempId);
      if (idx !== -1) state.messages[uuid].data[idx]._status = "failed";
      state.optimisticMap[tempId] = { status: "failed" };
    },
    setTyping(state, action) {
      const { uuid, payload } = action.payload;
      state.typing[uuid] = payload;
    },
    setPresence(state, action) {
      const { uuid, presence } = action.payload;
      state.presence[uuid] = presence;
    },
    clearMessages(state, action) {
      const uuid = action.payload;
      delete state.messages[uuid];
    },
    setCurrentConversation(state, action) {
      state.currentConversation = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchConversations.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchConversations.fulfilled, (s, a) => {
        s.loading = false;
        s.conversations = a.payload.data || [];
        s.conversationsMeta = a.payload.meta || {};
      })
      .addCase(fetchConversations.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchMessages.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        s.loading = false;
        const { uuid, data } = a.payload;
        s.messages[uuid] = { data: data.data || [], meta: data.meta || {} };
      })
      .addCase(fetchMessages.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createConversation.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(createConversation.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload.data) s.conversations.unshift(a.payload.data);
      })
      .addCase(createConversation.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(sendMessage.fulfilled, (s, a) => {
        const uuid = a.payload.uuid;
        const payloadMessage = a.payload.data?.data;
        if (payloadMessage) {
          // find optimistic entry by optimistic id on server message (if server echoes it)
          if (!s.messages[uuid]) s.messages[uuid] = { data: [], meta: {} };
          // replace matching optimistic if any
          const tempId = payloadMessage._optimisticId;
          if (tempId) {
            const idx = s.messages[uuid].data.findIndex((m) => m._optimisticId === tempId);
            if (idx !== -1) s.messages[uuid].data[idx] = payloadMessage;
            else s.messages[uuid].data.push(payloadMessage);
            delete s.optimisticMap[tempId];
          } else {
            s.messages[uuid].data.push(payloadMessage);
          }
        }
      })
      .addCase(sendMessage.rejected, (s, a) => {
        // send failed handled locally via markOptimisticFailed reducer
        s.error = a.payload;
      });
  },
});

export const {
  appendOptimisticMessage,
  markOptimisticResolved,
  markOptimisticFailed,
  setTyping,
  setPresence,
  clearMessages,
  setCurrentConversation,
} = chatSlice.actions;
export default chatSlice.reducer;