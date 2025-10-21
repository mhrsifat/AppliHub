// filepath: src/features/chat/hooks/useChat.js
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pusher from 'pusher-js';
import { receiveMessage, setTyping } from '../slices/chatSlice';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;
const API_BASE = import.meta.env.VITE_API_BASE;

export const useChat = (conversationUuid) => {
  const dispatch = useDispatch();
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [authToken, setAuthToken] = useState(null);

  const { user, employee, admin, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Listen for token changes broadcast from api.js
  useEffect(() => {
    const handler = (e) => setAuthToken(e.detail);
    window.addEventListener('tokenChanged', handler);
    return () => window.removeEventListener('tokenChanged', handler);
  }, []);

  const getAnonymousAuthData = () => {
    try {
      const stored = localStorage.getItem('chat_user');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return { contact: '' };
  };

  const privateChannel = (uuid) => `private-conversation.${uuid}`;

  const initPusher = () => {
    if (pusherRef.current) return;

    const baseConfig = {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      logToConsole: import.meta.env.DEV,
    };

    // Anonymous
    if (!isAuthenticated && !admin && !employee && !user) {
      const authData = getAnonymousAuthData();
      console.log('🔹 Anonymous Pusher init', authData);

      pusherRef.current = new Pusher(PUSHER_KEY, {
        ...baseConfig,
        authEndpoint: `${API_BASE.replace(/\/$/, '')}/broadcasting/auth/anonymous`,
        auth: { params: authData },
      });
    } else {
      // Authenticated (token comes from memory)
      console.log('🔹 Authenticated Pusher init', authToken ? '(token active)' : '(no token)');
      pusherRef.current = new Pusher(PUSHER_KEY, {
        ...baseConfig,
        authEndpoint: `${API_BASE.replace(/\/$/, '')}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: authToken || '',
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      });
    }

    pusherRef.current.connection.bind('error', (err) =>
      console.error('Pusher error:', err)
    );
  };

  const subscribe = (uuid) => {
    if (!pusherRef.current) return console.error('⚠️ Pusher not initialized');
    const chanName = privateChannel(uuid);

    if (channelRef.current) {
      try {
        pusherRef.current.unsubscribe(channelRef.current.name);
      } catch (_) {}
      channelRef.current.unbind_all();
      channelRef.current = null;
    }

    channelRef.current = pusherRef.current.subscribe(chanName);
    console.log('📡 Subscribed to:', chanName);

    channelRef.current.bind('message.sent', (data) => {
      if (data?.message) dispatch(receiveMessage(data.message));
    });
    channelRef.current.bind('MessageSent', (data) => {
      if (data?.message) dispatch(receiveMessage(data.message));
    });

    const handleTyping = (isTyping) => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      dispatch(setTyping(isTyping));
      if (isTyping)
        typingTimeoutRef.current = setTimeout(
          () => dispatch(setTyping(false)),
          3000
        );
    };

    channelRef.current.bind('user.typing', () => handleTyping(true));
    channelRef.current.bind('user.typing.stopped', () => handleTyping(false));
    channelRef.current.bind('UserTyping', () => handleTyping(true));
    channelRef.current.bind('UserTypingStopped', () => handleTyping(false));
  };

  useEffect(() => {
    if (!conversationUuid) {
      console.log('⛔ No conversation UUID');
      return;
    }

    initPusher();
    subscribe(conversationUuid);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current && pusherRef.current) {
        try {
          pusherRef.current.unsubscribe(channelRef.current.name);
        } catch (_) {}
        channelRef.current.unbind_all();
      }
    };
  }, [conversationUuid, isAuthenticated, admin, employee, user, authToken]);

  return {
    isConnected:
      !!pusherRef.current &&
      pusherRef.current.connection.state === 'connected',
    pusher: pusherRef.current,
  };
};

export default useChat;