// src/features/chat/services/chatServices.js
import api from '../../../services/api';

// Request interceptor to handle file uploads
const getHeaders = (hasFiles = false, token = null) => {
  const headers = {};
  
  if (!hasFiles) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Public routes (no auth required)
export const chatServices = {
  // Create new conversation
  createConversation: async (data) => {
    const hasFiles = data.attachments && data.attachments.length > 0;
    const formData = hasFiles ? new FormData() : { ...data };
    
    if (hasFiles) {
      formData.append('name', data.name);
      formData.append('contact', data.contact);
      if (data.subject) formData.append('subject', data.subject);
      if (data.message) formData.append('message', data.message);
      
      data.attachments.forEach(file => {
        formData.append('attachments[]', file);
      });
    }

    const response = await api.post('/message/conversations', formData, {
      headers: getHeaders(hasFiles)
    });
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (uuid, page = 1, per_page = 50) => {
    const response = await api.get(`/message/conversations/${uuid}/messages`, {
      params: { page, per_page }
    });
    return response.data;
  },

  // Send message to conversation
  sendMessage: async (uuid, data, token = null) => {
    const hasFiles = data.attachments && data.attachments.length > 0;
    const formData = hasFiles ? new FormData() : { ...data };
    
    if (hasFiles) {
      // If no token (public user), include name and contact
      if (!token) {
        formData.append('name', data.name);
        formData.append('contact', data.contact);
      }
      
      if (data.body) formData.append('body', data.body);
      
      data.attachments.forEach(file => {
        formData.append('attachments[]', file);
      });
    }

    const response = await api.post(`/message/conversations/${uuid}/messages`, formData, {
      headers: getHeaders(hasFiles, token)
    });
    return response.data;
  },

  // Get attachment info
  getAttachment: async (id) => {
    const response = await api.get(`/message/attachments/${id}`);
    return response.data;
  },

  // Send typing indicator
  sendTyping: async (uuid, data = null) => {
    const response = await api.post(`/message/conversations/${uuid}/typing`, data, {
      headers: getHeaders(false)
    });
    return response.data;
  },

  // Mark conversation as read
  markAsRead: async (uuid) => {
    const response = await api.post(`/message/conversations/${uuid}/read`, {}, {
      headers: getHeaders(false)
    });
    return response.data;
  }
};

// Staff routes (require auth)
export const staffChatServices = {
  // Get conversations list
  getConversations: async (params = {}) => {
    const response = await api.get('/message/conversations', { 
      params,
      headers: getHeaders(false)
    });
    return response.data;
  },

  // Join conversation
  joinConversation: async (uuid) => {
    const response = await api.post(`/message/conversations/${uuid}/join`, {}, {
      headers: getHeaders(false)
    });
    return response.data;
  },

  // Assign conversation
  assignConversation: async (uuid) => {
    const response = await api.post(`/message/conversations/${uuid}/assign`, {}, {
      headers: getHeaders(false)
    });
    return response.data;
  },

  // Get conversation details
  getConversation: async (uuid) => {
    const response = await api.get(`/message/conversations/${uuid}`, {
      headers: getHeaders(false)
    });
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/message/messages/${messageId}`, {
      headers: getHeaders(false)
    });
    return response.data;
  },

  // Update conversation status
  updateConversationStatus: async (uuid, status) => {
    const response = await api.patch(`/message/conversations/${uuid}/status`, { status }, {
      headers: getHeaders(false)
    });
    return response.data;
  }
};

export default chatServices;