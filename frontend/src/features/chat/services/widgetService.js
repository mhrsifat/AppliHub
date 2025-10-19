// filepath: src/features/chat/services/widgetService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const startConversation = async ({ name, email, phone, message }) => {
  const payload = { name, email, phone, message };
  const response = await axios.post(`${API_URL}/widget/conversations`, payload);
  return response.data;
};

const sendMessage = async ({ conversationId, message, file }) => {
  const formData = new FormData();
  formData.append('message', message);
  if (file) {
    formData.append('file', file);
  }
  const response = await axios.post(
    `${API_URL}/widget/conversations/${conversationId}/messages`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

const fetchConversation = async (conversationId) => {
  const response = await axios.get(`${API_URL}/widget/conversations/${conversationId}`);
  return response.data;
};

const sendTyping = async (conversationId) => {
  await axios.post(`${API_URL}/widget/conversations/${conversationId}/typing`);
};

export const widgetService = {
  startConversation,
  sendMessage,
  fetchConversation,
  sendTyping,
};