// filepath: src/features/chat/store/slices.js 
import { createSlice } from '@reduxjs/toolkit';

const initialState = { conversations: {}, messages: {}, };

const chatSlice = createSlice({ name: 'chat', initialState, reducers: { upsertConversation(state, action) { const conv = action.payload; state.conversations[conv.uuid] = conv; }, upsertMessage(state, action) { const msg = action.payload; const convId = msg.conversation_id; if (!state.messages[convId]) state.messages[convId] = []; if (!state.messages[convId].some(m => m.id && msg.id && m.id === msg.id)) state.messages[convId].push(msg); }, clearConversation(state, action) { delete state.messages[action.payload]; } } });

export const { upsertConversation, upsertMessage, clearConversation } = chatSlice.actions; export default chatSlice.reducer;

