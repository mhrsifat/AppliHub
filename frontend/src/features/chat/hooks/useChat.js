// filepath: src/features/chat/hooks/useChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';
import chatService from '../services/chatService';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2';

export const useChat = (conversationUuid, userInfo = null) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef({});

  // Initialize Pusher and subscribe to conversation
  useEffect(() => {
    if (!conversationUuid || !PUSHER_KEY) return;

    try {
      pusherRef.current = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        encrypted: true
      });

      const conversationId = conversationUuid.split('-')[0]; // or extract ID properly
      channelRef.current = pusherRef.current.subscribe(`conversation.${conversationId}`);

      // Listen for new messages
      channelRef.current.bind('MessageSent', (data) => {
        setMessages(prev => {
          // Avoid duplicates (optimistic update might have added it)
          const exists = prev.some(msg => 
            msg.id === data.message?.id || 
            msg.tempId === data.message?.tempId
          );
          if (exists) {
            // Replace optimistic message with real one
            return prev.map(msg => 
              msg.tempId === data.message?.tempId ? data.message : msg
            );
          }
          return [...prev, data.message];
        });
      });

      // Listen for typing indicators
      channelRef.current.bind('UserTyping', (data) => {
        const { userName, conversationId: cId } = data;
        if (!userName) return;

        setTypingUsers(prev => {
          if (!prev.includes(userName)) {
            return [...prev, userName];
          }
          return prev;
        });

        // Clear typing after 3 seconds
        if (typingTimeoutRef.current[userName]) {
          clearTimeout(typingTimeoutRef.current[userName]);
        }
        typingTimeoutRef.current[userName] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== userName));
          delete typingTimeoutRef.current[userName];
        }, 3000);
      });

    } catch (err) {
      console.error('Pusher initialization error:', err);
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(channelRef.current.name);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [conversationUuid]);

  // Load messages
  const loadMessages = useCallback(async (page = 1) => {
    if (!conversationUuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatService.fetchMessages(conversationUuid, page);
      const newMessages = response.data || [];
      
      if (page === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }
      
      setHasMore(newMessages.length > 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationUuid]);

  // Send message with optimistic update
  const sendMessage = useCallback(async (messageData) => {
    if (!conversationUuid) return;
    
    setSending(true);
    setError(null);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      tempId,
      body: messageData.body,
      sender_name: messageData.name || userInfo?.name || 'You',
      sender_contact: messageData.contact || userInfo?.contact,
      is_staff: !!userInfo?.isStaff,
      attachments: [],
      created_at: new Date().toISOString(),
      sending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await chatService.sendMessage(
        conversationUuid,
        messageData,
        userInfo?.isStaff
      );

      // Replace optimistic message with real response
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId ? { ...response.data, tempId } : msg
        )
      );

      return response.data;
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  }, [conversationUuid, userInfo]);

  // Load more messages (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadMessages(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, loadMessages]);

  // Initial load
  useEffect(() => {
    if (conversationUuid) {
      loadMessages(1);
    }
  }, [conversationUuid, loadMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    typingUsers,
    hasMore,
    sendMessage,
    loadMore,
    refreshMessages: () => loadMessages(1)
  };
};