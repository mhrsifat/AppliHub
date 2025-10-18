// src/features/chat/hooks/useStaffChat.js
import { useCallback } from 'react';
import { useStaffChat as useBaseStaffChat } from './useChat';
import { staffChatServices } from '../services/staffChatServices';

export const useStaffChat = () => {
  const baseChat = useBaseStaffChat();

  const updateConversationStatus = useCallback(async (conversationUuid, status) => {
    try {
      await staffChatServices.updateConversationStatus(conversationUuid, status);
      
      // Update local state
      if (baseChat.currentConversation?.uuid === conversationUuid) {
        baseChat.setCurrentConversation({
          ...baseChat.currentConversation,
          status
        });
      }
      
      // Update in conversations list
      baseChat.setConversations(prev => 
        prev.map(conv => 
          conv.uuid === conversationUuid 
            ? { ...conv, status }
            : conv
        )
      );
      
    } catch (error) {
      baseChat.setError('Failed to update conversation status');
      throw error;
    }
  }, [baseChat]);

  const addNoteToConversation = useCallback(async (conversationUuid, note) => {
    try {
      await staffChatServices.addNote(conversationUuid, note);
    } catch (error) {
      baseChat.setError('Failed to add note');
      throw error;
    }
  }, [baseChat]);

  const transferConversation = useCallback(async (conversationUuid, targetAgentId) => {
    try {
      await staffChatServices.transferConversation(conversationUuid, targetAgentId);
    } catch (error) {
      baseChat.setError('Failed to transfer conversation');
      throw error;
    }
  }, [baseChat]);

  const getConversationMetrics = useCallback(async (conversationUuid) => {
    try {
      return await staffChatServices.getMetrics(conversationUuid);
    } catch (error) {
      baseChat.setError('Failed to load conversation metrics');
      throw error;
    }
  }, [baseChat]);

  const bulkAssignConversations = useCallback(async (conversationUuids, agentId) => {
    try {
      await staffChatServices.bulkAssign(conversationUuids, agentId);
      baseChat.loadConversations(); // Refresh the list
    } catch (error) {
      baseChat.setError('Failed to bulk assign conversations');
      throw error;
    }
  }, [baseChat]);

  const bulkUpdateConversationStatus = useCallback(async (conversationUuids, status) => {
    try {
      await staffChatServices.bulkUpdateStatus(conversationUuids, status);
      baseChat.loadConversations(); // Refresh the list
    } catch (error) {
      baseChat.setError('Failed to bulk update conversation status');
      throw error;
    }
  }, [baseChat]);

  const getDashboardStats = useCallback(async (params = {}) => {
    try {
      return await staffChatServices.getDashboardStats(params);
    } catch (error) {
      baseChat.setError('Failed to load dashboard stats');
      throw error;
    }
  }, []);

  const getAgents = useCallback(async () => {
    try {
      return await staffChatServices.getAgents();
    } catch (error) {
      baseChat.setError('Failed to load agents');
      throw error;
    }
  }, []);

  const getTemplates = useCallback(async () => {
    try {
      return await staffChatServices.getTemplates();
    } catch (error) {
      baseChat.setError('Failed to load templates');
      throw error;
    }
  }, []);

  return {
    ...baseChat,
    updateConversationStatus,
    addNoteToConversation,
    transferConversation,
    getConversationMetrics,
    bulkAssignConversations,
    bulkUpdateConversationStatus,
    getDashboardStats,
    getAgents,
    getTemplates
  };
};