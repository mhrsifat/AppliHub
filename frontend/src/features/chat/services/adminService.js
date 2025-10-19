// filepath: src/features/chat/services/adminService.js
import api from '@/services/api';

const getConversations = async (params = {}) => {
  const response = await api.get(`/message/conversations`, { params });
  return response.data;
};

const getConversationById = async (conversationUuid) => {
  if (!conversationUuid) {
    throw new Error('Conversation ID is required');
  }
  
  const response = await api.get(`/message/conversations/${conversationUuid}`);
  return response.data;
};

const sendReply = async ({ conversationUuid, message, file }) => {
  const formData = new FormData();
  formData.append('message', message);
  if (file) {
    formData.append('file', file);
  }
  
  const response = await api.post(
    `/message/admin/conversations/${conversationUuid}/reply`,
    formData,
    { 
      headers: { 
        'Content-Type': 'multipart/form-data' 
      } 
    }
  );
  return response.data;
};

const addNote = async (conversationUuid, note) => {
  const response = await api.post(
    `/message/conversations/${conversationUuid}/notes`, 
    { note }
  );
  return response.data;
};

const deleteConversation = async (conversationUuid) => {
  const response = await api.delete(`/message/conversations/${conversationUuid}`);
  return response.data;
};

const closeConversation = async (conversationUuid) => {
  const response = await api.post(`/message/conversations/${conversationUuid}/close`);
  return response.data;
};

const updateConversationStatus = async (conversationUuid, status) => {
  const response = await api.patch(
    `/message/conversations/${conversationUuid}/status`, 
    { status }
  );
  return response.data;
};

export const adminService = {
  getConversations,
  getConversationById,
  sendReply,
  addNote,
  deleteConversation,
  closeConversation,
  updateConversationStatus,
};