// filepath: src/features/chat/services/widgetService.js
import api from '@/services/api';

const startConversation = async ({ name, contact, message }) => {
  const payload = { name, contact, message };
  const response = await api.post(`/message/conversations`, payload);
  return response.data;
};

const sendMessage = async ({ conversationUuid, message, file }) => {
  const formData = new FormData();
  
  if (message) {
    formData.append('body', message);
  }
  
  if (file) {
    formData.append('attachments[]', file);
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

// Fetch conversation messages (public route - uses UUID)
const fetchConversation = async (conversationUuid) => {
  if (!conversationUuid) {
    throw new Error('Conversation UUID is required');
  }
  
  try {
    // Use the public messages endpoint instead of the conversation endpoint
    const response = await api.get(`/message/conversations/${conversationUuid}/messages`);
    
    // Return in expected format with conversation data
    return {
      data: {
        uuid: conversationUuid,
        id: conversationUuid,
        messages: response.data.data || response.data || []
      }
    };
  } catch (error) {
    console.error('fetchConversation error:', error);
    throw error;
  }
};

const sendTyping = async (conversationUuid) => {
  if (!conversationUuid) return;
  
  try {
    await api.post(`/message/conversations/${conversationUuid}/typing`);
  } catch (error) {
    console.warn('Failed to send typing indicator:', error);
  }
};

const sendTypingStop = async (conversationUuid) => {
  if (!conversationUuid) return;
  
  try {
    await api.post(`/message/conversations/${conversationUuid}/typing/stop`);
  } catch (error) {
    console.warn('Failed to send typing stop indicator:', error);
  }
};

export const widgetService = {
  startConversation,
  sendMessage,
  fetchConversation,
  sendTyping,
  sendTypingStop,
};