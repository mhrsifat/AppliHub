import api from '@/services/api';

const getConversations = async (params = {}) => {
  const response = await api.get(`/message/conversations`, { params });
  return response.data;
};

const getConversationById = async (conversationUuid) => {
  if (!conversationUuid) {
    throw new Error('Conversation UUID is required');
  }
  
  const response = await api.get(`/message/conversations/${conversationUuid}`);
  return response.data;
};

const sendReply = async ({ conversationUuid, message, file }) => {
  const formData = new FormData();
  formData.append('body', message);
  
  if (file) {
    // Handle single file or array of files
    if (Array.isArray(file)) {
      file.forEach(f => formData.append('attachments[]', f));
    } else {
      formData.append('attachments[]', file);
    }
  }
  
  const response = await api.post(
    `/message/conversations/${conversationUuid}/messages`,
    formData,
    { 
      headers: { 
        'Content-Type': 'multipart/form-data' 
      } 
    }
  );
  return response.data;
};

const addNote = async (conversationUuid, body) => {
  const response = await api.post(
    `/message/conversations/${conversationUuid}/notes`, 
    { body }
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

const markAsRead = async (conversationUuid) => {
  const response = await api.post(`/message/conversations/${conversationUuid}/read`);
  return response.data;
};

const assignConversation = async (conversationUuid) => {
  const response = await api.post(`/message/conversations/${conversationUuid}/assign`);
  return response.data;
};

const joinConversation = async (conversationUuid) => {
  const response = await api.post(`/message/conversations/${conversationUuid}/join`);
  return response.data;
};

export const adminService = {
  getConversations,
  getConversationById,
  sendReply,
  addNote,
  deleteConversation,
  closeConversation,
  markAsRead,
  assignConversation,
  joinConversation,
  updateConversationStatus: closeConversation, // Alias for backward compatibility
};