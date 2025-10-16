// filepath: src/features/chat/services/chatService.js
import api from '../../../services/api';

const chatService = {
  // Create new conversation (public)
  createConversation: async (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('contact', data.contact);
    if (data.subject) formData.append('subject', data.subject);
    if (data.message) formData.append('message', data.message);
    
    if (data.attachments?.length) {
      data.attachments.forEach(file => {
        formData.append('attachments[]', file);
      });
    }

    const response = await api.post('/message/conversations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get conversation messages
  fetchMessages: async (uuid, page = 1, perPage = 50) => {
    const response = await api.get(`/message/conversations/${uuid}/messages`, {
      params: { page, per_page: perPage }
    });
    return response.data;
  },

  // Send message to conversation
  sendMessage: async (uuid, data, isStaff = false) => {
    const formData = new FormData();
    
    if (!isStaff) {
      formData.append('name', data.name);
      formData.append('contact', data.contact);
    }
    
    if (data.body) formData.append('body', data.body);
    
    if (data.attachments?.length) {
      data.attachments.forEach(file => {
        formData.append('attachments[]', file);
      });
    }

    const response = await api.post(
      `/message/conversations/${uuid}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Send typing indicator
  sendTyping: async (conversationId, name = null) => {
    const response = await api.post(
      `/message/conversations/${conversationId}/typing`,
      name ? { name } : {}
    );
    return response.data;
  },

  // Staff: List all conversations
  listConversations: async (page = 1, perPage = 20, filters = {}) => {
    const response = await api.get('/message/conversations', {
      params: { page, per_page: perPage, ...filters }
    });
    return response.data;
  },

  // Staff: Get conversation detail
  getConversation: async (uuid) => {
    const response = await api.get(`/message/conversations/${uuid}`);
    return response.data;
  },

  // Staff: Join conversation
  joinConversation: async (uuid) => {
    const response = await api.post(`/message/conversations/${uuid}/join`);
    return response.data;
  },

  // Staff: Assign conversation
  assignConversation: async (uuid) => {
    const response = await api.post(`/message/conversations/${uuid}/assign`);
    return response.data;
  },

  // Staff: Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/message/messages/${messageId}`);
    return response.data;
  },

  // Get attachment metadata
  getAttachment: async (attachmentId) => {
    const response = await api.get(`/message/attachments/${attachmentId}`);
    return response.data;
  }
};

export default chatService;