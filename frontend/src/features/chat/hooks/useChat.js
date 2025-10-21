import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pusher from 'pusher-js';
import { receiveMessage, setTyping } from '../slices/chatSlice';

// ✅ Use the correct environment variable names that you have
const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;
const API_BASE = import.meta.env.VITE_API_BASE;

export const useChat = (conversationUuid) => {
  const dispatch = useDispatch();
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ✅ Add validation for Pusher key
  useEffect(() => {
    if (!PUSHER_KEY) {
      console.error('❌ Pusher app key is missing. Check your environment variables.');
      return;
    }
  }, []);

  // ✅ Initial token from memory (window.apiAccessToken)
  const [authToken, setAuthToken] = useState(() => window.apiAccessToken);

  const { user, employee, admin, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Listen for token changes
  useEffect(() => {
    const handler = (e) => setAuthToken(e.detail);
    window.addEventListener('tokenChanged', handler);
    return () => window.removeEventListener('tokenChanged', handler);
  }, []);

  // Get anonymous user data from localStorage
  const getAnonymousAuthData = () => {
    try {
      const stored = localStorage.getItem('chat_user');
      if (stored) {
        const userData = JSON.parse(stored);
        return { 
          contact: userData.contact || '',
          conversation_uuid: conversationUuid || ''
        };
      }
    } catch (_) {}
    return { contact: '', conversation_uuid: conversationUuid || '' };
  };

  const privateChannel = (uuid) => `private-conversation.${uuid}`;

  const initPusher = () => {
    if (pusherRef.current) return;

    // ✅ Validate Pusher key before initializing
    if (!PUSHER_KEY) {
      console.error('❌ Cannot initialize Pusher: App key is missing');
      return;
    }

    const baseConfig = {
      cluster: PUSHER_CLUSTER || 'ap1',
      forceTLS: true,
      authTransport: 'ajax',
      auth: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
      },
      logToConsole: import.meta.env.DEV,
    };

    console.log('🔧 Pusher Config:', {
      hasKey: !!PUSHER_KEY,
      cluster: PUSHER_CLUSTER,
      apiBase: API_BASE
    });

    if (!isAuthenticated && !admin && !employee && !user) {
      // Anonymous Pusher
      const authData = getAnonymousAuthData();
      console.log('🔹 Anonymous Pusher init', authData);

      pusherRef.current = new Pusher(PUSHER_KEY, {
        ...baseConfig,
        authEndpoint: `${API_BASE}/broadcasting/auth/anonymous`,
        auth: { 
          params: authData 
        },
      });
    } else {
      // Authenticated Pusher (memory token)
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

    // Connection event handlers
    pusherRef.current.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
    });

    pusherRef.current.connection.bind('error', (err) => {
      console.error('❌ Pusher connection error:', err);
      if (err.error) {
        console.error('Pusher error details:', {
          type: err.type,
          error: err.error,
          status: err.status
        });
      }
    });

    pusherRef.current.connection.bind('disconnected', () => {
      console.log('🔴 Pusher disconnected');
    });

    pusherRef.current.connection.bind('state_change', (states) => {
      console.log('🔄 Pusher state change:', states.previous, '->', states.current);
    });
  };

  const subscribe = (uuid) => {
    if (!pusherRef.current) {
      console.error('⚠️ Pusher not initialized');
      return;
    }

    const chanName = privateChannel(uuid);
    console.log('📡 Attempting to subscribe to:', chanName);

    // Cleanup previous channel
    if (channelRef.current) {
      try {
        pusherRef.current.unsubscribe(channelRef.current.name);
        console.log('🔄 Unsubscribed from previous channel:', channelRef.current.name);
      } catch (_) {}
      channelRef.current.unbind_all();
      channelRef.current = null;
    }

    try {
      channelRef.current = pusherRef.current.subscribe(chanName);
      
      channelRef.current.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Successfully subscribed to:', chanName);
      });

      channelRef.current.bind('pusher:subscription_error', (err) => {
        console.error('❌ Subscription error:', err);
        console.error('Subscription error details:', {
          type: err.type,
          error: err.error,
          status: err.status
        });
      });

      // Messages - listen for MessageSent event
      channelRef.current.bind('MessageSent', (data) => {
        console.log('📨 Message received via broadcast:', data);
        if (data?.message) {
          dispatch(receiveMessage(data.message));
        }
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

      channelRef.current.bind('UserTyping', () => {
        console.log('⌨️ User typing event received');
        handleTyping(true);
      });
      
      channelRef.current.bind('UserStopTyping', () => {
        console.log('💤 User stopped typing event received');
        handleTyping(false);
      });

    } catch (error) {
      console.error('❌ Error subscribing to channel:', error);
    }
  };

  useEffect(() => {
    if (!conversationUuid) {
      console.log('⛔ No conversation UUID provided');
      return;
    }

    // ✅ Check if Pusher key exists before proceeding
    if (!PUSHER_KEY) {
      console.error('❌ Pusher app key is missing. Cannot initialize chat.');
      return;
    }

    console.log('🔄 useChat effect running for conversation:', conversationUuid);
    console.log('🔐 Auth status:', {
      isAuthenticated,
      hasToken: !!authToken,
      user: !!user,
      employee: !!employee,
      admin: !!admin
    });
    
    initPusher();
    subscribe(conversationUuid);

    return () => {
      console.log('🧹 Cleaning up useChat for conversation:', conversationUuid);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current && pusherRef.current) {
        try {
          pusherRef.current.unsubscribe(channelRef.current.name);
          console.log('🔴 Unsubscribed from channel:', channelRef.current.name);
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