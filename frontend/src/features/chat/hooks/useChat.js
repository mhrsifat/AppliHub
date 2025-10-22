// filepath: src/features/chat/hooks/useChat.js
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pusher from 'pusher-js';
import { receiveMessage, setTyping } from '../slices/chatSlice';

// ✅ Environment variables
const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;
const API_BASE = import.meta.env.VITE_API_BASE;

export const useChat = (conversationUuid) => {
  const dispatch = useDispatch();
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [authToken, setAuthToken] = useState(() => window.apiAccessToken);

  const { user, employee, admin, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // ✅ Listen for global token updates
  useEffect(() => {
    const handler = (e) => setAuthToken(e.detail);
    window.addEventListener('tokenChanged', handler);
    return () => window.removeEventListener('tokenChanged', handler);
  }, []);

  // ✅ Anonymous fallback auth
  const getAnonymousAuthData = () => {
    try {
      const stored = localStorage.getItem('chat_user');
      if (stored) {
        const userData = JSON.parse(stored);
        return {
          contact: userData.contact || '',
          conversation_uuid: conversationUuid || '',
        };
      }
    } catch (_) {}
    return { contact: '', conversation_uuid: conversationUuid || '' };
  };

  const privateChannel = (uuid) => `private-conversation.${uuid}`;

  // ✅ Initialize Pusher
  const initPusher = () => {
    if (pusherRef.current) return;
    if (!PUSHER_KEY) {
      console.error('❌ Cannot initialize Pusher: App key missing');
      return;
    }

    const baseConfig = {
      cluster: PUSHER_CLUSTER || 'ap1',
      forceTLS: true,
      authTransport: 'ajax',
      auth: {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
      logToConsole: import.meta.env.DEV,
    };

    if (!isAuthenticated && !admin && !employee && !user) {
      // Anonymous connection
      const authData = getAnonymousAuthData();
      console.log('🔹 Anonymous Pusher init', authData);
      pusherRef.current = new Pusher(PUSHER_KEY, {
        ...baseConfig,
        authEndpoint: `${API_BASE}/broadcasting/auth/anonymous`,
        auth: { params: authData },
      });
    } else {
      // Authenticated connection
      console.log('🔹 Authenticated Pusher init', authToken ? '(token active)' : '(no token)');
      pusherRef.current = new Pusher(PUSHER_KEY, {
        ...baseConfig,
        authEndpoint: `${API_BASE}/broadcasting/auth`,
        auth: {
          headers: {
            ...baseConfig.auth.headers,
            Authorization: authToken ? `Bearer ${authToken}` : '',
          },
        },
      });
    }

    // ✅ Connection state logging
    pusherRef.current.connection.bind('connected', () =>
      console.log('✅ Pusher connected successfully')
    );
    pusherRef.current.connection.bind('error', (err) =>
      console.error('❌ Pusher connection error:', err)
    );
    pusherRef.current.connection.bind('disconnected', () =>
      console.log('🔴 Pusher disconnected')
    );
    pusherRef.current.connection.bind('state_change', (states) =>
      console.log('🔄 Pusher state change:', states.previous, '->', states.current)
    );
  };

  // ✅ Subscribe to private channel
  const subscribe = (uuid) => {
    if (!pusherRef.current) {
      console.error('⚠️ Pusher not initialized');
      return;
    }

    const chanName = privateChannel(uuid);
    console.log('📡 Subscribing to:', chanName);

    // Unsubscribe previous
    if (channelRef.current) {
      try {
        pusherRef.current.unsubscribe(channelRef.current.name);
      } catch (_) {}
      channelRef.current.unbind_all();
      channelRef.current = null;
    }

    try {
      channelRef.current = pusherRef.current.subscribe(chanName);

      channelRef.current.bind('pusher:subscription_succeeded', () =>
        console.log('✅ Subscribed to:', chanName)
      );
      channelRef.current.bind('pusher:subscription_error', (err) =>
        console.error('❌ Subscription error:', err)
      );

      // Message event
      channelRef.current.bind('MessageSent', (data) => {
        console.log('📨 Message received:', data);
        if (data?.message) dispatch(receiveMessage(data.message));
      });

      // Typing events
      const handleTyping = (isTyping) => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        dispatch(setTyping(isTyping));
        if (isTyping) {
          typingTimeoutRef.current = setTimeout(
            () => dispatch(setTyping(false)),
            3000
          );
        }
      };

      channelRef.current.bind('UserTyping', () => handleTyping(true));
      channelRef.current.bind('UserStopTyping', () => handleTyping(false));
    } catch (err) {
      console.error('❌ Error subscribing:', err);
    }
  };

  // ✅ Effect: initialize + subscribe
  useEffect(() => {
    if (!conversationUuid) {
      console.log('⛔ No conversation UUID');
      return;
    }
    if (!PUSHER_KEY) {
      console.error('❌ Missing Pusher key');
      return;
    }

    initPusher();
    subscribe(conversationUuid);

    return () => {
      console.log('🧹 Cleaning up chat:', conversationUuid);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current && pusherRef.current) {
        try {
          pusherRef.current.unsubscribe(channelRef.current.name);
        } catch (_) {}
        channelRef.current.unbind_all();
      }
    };
  }, [conversationUuid, isAuthenticated, admin, employee, user, authToken]);

  // ✅ Reconnect on token change
  useEffect(() => {
    const reconnect = (e) => {
      setAuthToken(e.detail);
      if (pusherRef.current) {
        try {
          pusherRef.current.disconnect();
        } catch (_) {}
        pusherRef.current = null;
        initPusher();
        subscribe(conversationUuid);
      }
    };
    window.addEventListener('tokenChanged', reconnect);
    return () => window.removeEventListener('tokenChanged', reconnect);
  }, [conversationUuid]);

  return {
    isConnected:
      !!pusherRef.current &&
      pusherRef.current.connection.state === 'connected',
    pusher: pusherRef.current,
  };
};

export default useChat;