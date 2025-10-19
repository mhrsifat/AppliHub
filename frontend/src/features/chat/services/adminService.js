// filepath: src/features/chat/services/adminService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const getConversations = async () => {
  const response = await axios.get(`${API_URL}/admin/conversations`);
  return response.data;
};

const getConversationById = async (conversationId) => {
  const response = await axios.get(`${API_URL}/admin/conversations/${conversationId}`);
  return response.data;
};

const sendReply = async ({ conversationId, message, file }) => {
  const formData = new FormData();
  formData.append('message', message);
  if (file) {
    formData.append('file', file);
  }
  const response = await axios.post(
    `${API_URL}/admin/conversations/${conversationId}/reply`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

const addNote = async (conversationId, note) => {
  const response = await axios.post(`${API_URL}/admin/conversations/${conversationId}/notes`, { note });
  return response.data;
};

const deleteConversation = async (conversationId) => {
  const response = await axios.delete(`${API_URL}/admin/conversations/${conversationId}`);
  return response.data;
};

const closeConversation = async (conversationId) => {
  const response = await axios.post(`${API_URL}/admin/conversations/${conversationId}/close`);
  return response.data;
};

export const adminService = {
  getConversations,
  getConversationById,
  sendReply,
  addNote,
  deleteConversation,
  closeConversation,
};