// filepath: src/features/chat/hooks/useChat.js
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import Pusher from 'pusher-js';
import { receiveMessage, setTyping } from '../slices/chatSlice';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

export const useChat = (conversationUuid) => {
  const dispatch = useDispatch();
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!conversationUuid) return;

    // Initialize Pusher (Cloud)
    if (!pusherRef.current) {
      Pusher.logToConsole = true; // Optional: see logs in console
      pusherRef.current = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        forceTLS: true, // Cloud Pusher always uses WSS
      });
    }

    const channelName = `conversation.${conversationUuid}`;
    channelRef.current = pusherRef.current.subscribe(channelName);

    // Listen for messages
    channelRef.current.bind('MessageSent', (data) => {
      if (data.message) dispatch(receiveMessage(data.message));
    });

    // Listen for typing events
    channelRef.current.bind('UserTyping', () => {
      dispatch(setTyping(true));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => dispatch(setTyping(false)), 3000);
    });

    channelRef.current.bind('UserTypingStopped', () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      dispatch(setTyping(false));
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [conversationUuid, dispatch]);

  return {
    isConnected: pusherRef.current?.connection?.state === 'connected',
    pusher: pusherRef.current,
  };
};
