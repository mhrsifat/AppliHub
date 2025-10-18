// src/features/chat/services/staffChatServices.js
import api from '../../../services/api';

export const staffChatServices = {
  // Get conversations list
  getConversations: async (params = {}) => {
    try {
      const response = await api.get('/message/conversations', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Join conversation
  joinConversation: async (uuid) => {
    try {
      const response = await api.post(`/message/conversations/${uuid}/join`, {});
      return response.data;
    } catch (error) {
      console.error('Error joining conversation:', error);
      throw error;
    }
  },

  // Assign conversation
  assignConversation: async (uuid) => {
    try {
      const response = await api.post(`/message/conversations/${uuid}/assign`, {});
      return response.data;
    } catch (error) {
      console.error('Error assigning conversation:', error);
      throw error;
    }
  },

  // Get conversation details
  getConversation: async (uuid) => {
    try {
      const response = await api.get(`/message/conversations/${uuid}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/message/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Update conversation status
  updateConversationStatus: async (uuid, status) => {
    try {
      const response = await api.patch(`/message/conversations/${uuid}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }
  },

  // Add internal note to conversation
  addNote: async (uuid, note) => {
    try {
      const response = await api.post(`/message/conversations/${uuid}/notes`, { note });
      return response.data;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  // Transfer conversation to another agent
  transferConversation: async (uuid, agentId) => {
    try {
      const response = await api.post(`/message/conversations/${uuid}/transfer`, { agent_id: agentId });
      return response.data;
    } catch (error) {
      console.error('Error transferring conversation:', error);
      throw error;
    }
  },

  // Get conversation metrics
  getMetrics: async (uuid) => {
    try {
      const response = await api.get(`/message/conversations/${uuid}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation metrics:', error);
      // Return mock data for development
      return {
        data: {
          response_time: '2m 34s',
          customer_satisfaction: 4.5,
          messages_count: 24,
          resolution_time: '15m 22s',
          first_response_time: '1m 12s'
        }
      };
    }
  },

  // Bulk actions
  bulkAssign: async (conversationUuids, agentId) => {
    try {
      const response = await api.post('/message/conversations/bulk/assign', {
        conversations: conversationUuids,
        agent_id: agentId
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk assigning conversations:', error);
      throw error;
    }
  },

  bulkUpdateStatus: async (conversationUuids, status) => {
    try {
      const response = await api.post('/message/conversations/bulk/status', {
        conversations: conversationUuids,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      throw error;
    }
  },

  // Get admin dashboard stats
  getDashboardStats: async (params = {}) => {
    try {
      const response = await api.get('/message/conversations/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for development
      return {
        data: {
          open_conversations: 12,
          avg_response_time: '2m 34s',
          satisfaction_rate: '94%',
          first_contact_resolution: '89%',
          total_conversations: 156,
          resolved_today: 8,
          unassigned_conversations: 3,
          avg_resolution_time: '15m 22s'
        }
      };
    }
  },

  // Get agent performance metrics
  getAgentMetrics: async (agentId, params = {}) => {
    try {
      const response = await api.get(`/message/agents/${agentId}/metrics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching agent metrics:', error);
      // Return mock data for development
      return {
        data: {
          agent_name: 'Support Agent',
          conversations_handled: 45,
          avg_response_time: '2m 15s',
          satisfaction_score: 4.7,
          resolution_rate: '92%',
          current_active_chats: 3
        }
      };
    }
  },

  // Get conversation analytics
  getConversationAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/message/conversations/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation analytics:', error);
      // Return mock data for development
      return {
        data: {
          daily_conversations: [
            { date: '2024-01-01', count: 15 },
            { date: '2024-01-02', count: 23 },
            { date: '2024-01-03', count: 18 },
            { date: '2024-01-04', count: 27 },
            { date: '2024-01-05', count: 22 },
            { date: '2024-01-06', count: 19 },
            { date: '2024-01-07', count: 25 }
          ],
          response_times: [
            { hour: '09:00', time: '1m 23s' },
            { hour: '10:00', time: '1m 45s' },
            { hour: '11:00', time: '2m 12s' },
            { hour: '12:00', time: '2m 45s' },
            { hour: '13:00', time: '1m 56s' },
            { hour: '14:00', time: '2m 08s' },
            { hour: '15:00', time: '1m 56s' },
            { hour: '16:00', time: '2m 34s' },
            { hour: '17:00', time: '3m 12s' },
            { hour: '18:00', time: '3m 12s' }
          ],
          conversation_sources: [
            { source: 'Website', count: 45 },
            { source: 'Mobile App', count: 32 },
            { source: 'Email', count: 18 },
            { source: 'Social Media', count: 12 }
          ]
        }
      };
    }
  },

  // Get available agents
  getAgents: async () => {
    try {
      const response = await api.get('/message/agents');
      return response.data;
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Return mock data for development
      return {
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com', status: 'online', active_chats: 2 },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'online', active_chats: 1 },
          { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'offline', active_chats: 0 },
          { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'online', active_chats: 3 }
        ]
      };
    }
  },

  // Mark conversation as read
  markAsRead: async (uuid) => {
    try {
      const response = await api.post(`/message/conversations/${uuid}/read`, {});
      return response.data;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  // Get conversation tags
  getTags: async () => {
    try {
      const response = await api.get('/message/conversations/tags');
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      // Return mock data for development
      return {
        data: [
          { id: 1, name: 'Billing', color: 'blue' },
          { id: 2, name: 'Technical', color: 'red' },
          { id: 3, name: 'Sales', color: 'green' },
          { id: 4, name: 'Feature Request', color: 'purple' },
          { id: 5, name: 'Bug Report', color: 'orange' }
        ]
      };
    }
  },

  // Add tag to conversation
  addTag: async (uuid, tagId) => {
    try {
      const response = await api.post(`/message/conversations/${uuid}/tags`, { tag_id: tagId });
      return response.data;
    } catch (error) {
      console.error('Error adding tag to conversation:', error);
      throw error;
    }
  },

  // Remove tag from conversation
  removeTag: async (uuid, tagId) => {
    try {
      const response = await api.delete(`/message/conversations/${uuid}/tags/${tagId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing tag from conversation:', error);
      throw error;
    }
  },

  // Export conversations
  exportConversations: async (params = {}) => {
    try {
      const response = await api.get('/message/conversations/export', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting conversations:', error);
      throw error;
    }
  },

  // Get conversation templates
  getTemplates: async () => {
    try {
      const response = await api.get('/message/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Return mock data for development
      return {
        data: [
          { id: 1, name: 'Welcome Message', content: 'Hello! Thank you for reaching out to us. How can I help you today?' },
          { id: 2, name: 'Issue Resolution', content: 'I understand the issue you\'re facing. Let me help you resolve this.' },
          { id: 3, name: 'Follow Up', content: 'Just following up on our previous conversation. Do you need any further assistance?' },
          { id: 4, name: 'Closing', content: 'Thank you for contacting us. If you have any more questions, feel free to reach out!' }
        ]
      };
    }
  }
};

export default staffChatServices;