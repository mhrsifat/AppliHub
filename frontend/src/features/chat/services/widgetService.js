import api from '@/services/api';

const startConversation = async ({ name, contact, message, subject }) => {
  const payload = { name, contact, message, subject };
  const response = await api.post(`/message/conversations`, payload);
  return response.data;
};

const sendMessage = async ({ conversationUuid, name, contact, body, attachments }) => {
  const formData = new FormData();
  
  // Add name and contact to FormData
  if (name) {
    formData.append('name', name);
  }
  
  if (contact) {
    formData.append('contact', contact);
  }
  
  if (body) {
    formData.append('body', body);
  }
  
  if (attachments) {
    // Handle single file or array of files
    if (Array.isArray(attachments)) {
      attachments.forEach(file => formData.append('attachments[]', file));
    } else {
      formData.append('attachments[]', attachments);
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

// Fetch conversation with messages
const fetchConversation = async (conversationUuid) => {
  if (!conversationUuid) {
    throw new Error('Conversation UUID is required');
  }
  
  try {
    const response = await api.get(`/message/conversations/${conversationUuid}`);
    return response.data;
  } catch (error) {
    console.error('fetchConversation error:', error);
    throw error;
  }
};

// Fetch only messages for a conversation
const fetchConversationMessages = async (conversationUuid) => {
  if (!conversationUuid) {
    throw new Error('Conversation UUID is required');
  }
  
  try {
    const response = await api.get(`/message/conversations/${conversationUuid}/messages`);
    return response.data;
  } catch (error) {
    console.error('fetchConversationMessages error:', error);
    throw error;
  }
};

const sendTyping = async (conversationUuid, name = 'Guest') => {
  if (!conversationUuid) return;
  
  try {
    await api.post(`/message/conversations/${conversationUuid}/typing`, { name });
  } catch (error) {
    console.warn('Failed to send typing indicator:', error);
  }
};

const sendTypingStop = async (conversationUuid, name = 'Guest') => {
  if (!conversationUuid) return;
  
  try {
    await api.post(`/message/conversations/${conversationUuid}/typing/stop`, { name });
  } catch (error) {
    console.warn('Failed to send typing stop indicator:', error);
  }
};

export const widgetService = {
  startConversation,
  sendMessage,
  fetchConversation,
  fetchConversationMessages,
  sendTyping,
  sendTypingStop,
};