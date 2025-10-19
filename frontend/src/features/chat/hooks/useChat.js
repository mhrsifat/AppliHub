// filepath: src/features/chat/hooks/useChat.js
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import Pusher from 'pusher-js';
import { receiveMessage, setTyping } from '../slices/chatSlice';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;
const API_BASE = import.meta.env.VITE_API_BASE; // must be absolute origin like https://api.example.com

export const useChat = (conversationUuid) => {
  const dispatch = useDispatch();
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentAuthHeaderRef = useRef(null);

  // helper to build channel name
  const privateChannelName = (uuid) => `private-conversation.${uuid}`;

  // initialize pusher (idempotent)
  const initPusher = () => {
    if (pusherRef.current) return;

    // create pusher with auth endpoint
    pusherRef.current = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      authEndpoint: `${API_BASE.replace(/\/$/, '')}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: currentAuthHeaderRef.current || '',
        },
      },
    });

    // optional debug in dev
    if (import.meta.env.DEV) {
      Pusher.logToConsole = true;
    }
  };

  // subscribe to a private channel (handles re-subscribe safely)
  const subscribeToChannel = (uuid) => {
    if (!pusherRef.current) return;
    const chan = privateChannelName(uuid);

    // if already subscribed to same channel, return it
    if (channelRef.current && channelRef.current.name === chan) return;

    // unsubscribe previous if any
    if (channelRef.current) {
      channelRef.current.unbind_all();
      try {
        pusherRef.current.unsubscribe(channelRef.current.name);
      } catch (e) {
        // ignore
      }
      channelRef.current = null;
    }

    channelRef.current = pusherRef.current.subscribe(chan);

    // bind events
    channelRef.current.bind('MessageSent', (data) => {
      if (data?.message) dispatch(receiveMessage(data.message));
    });

    channelRef.current.bind('UserTyping', () => {
      dispatch(setTyping(true));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => dispatch(setTyping(false)), 3000);
    });

    channelRef.current.bind('UserTypingStopped', () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      dispatch(setTyping(false));
    });
  };

  // update auth header (token) used by pusher and resubscribe
  const updateAuthHeader = (authHeader) => {
    currentAuthHeaderRef.current = authHeader || null;

    if (!pusherRef.current) return;

    // update config for future auth requests
    if (!pusherRef.current.config) pusherRef.current.config = {};
    if (!pusherRef.current.config.auth) pusherRef.current.config.auth = {};
    if (!pusherRef.current.config.auth.headers) pusherRef.current.config.auth.headers = {};

    pusherRef.current.config.auth.headers.Authorization = currentAuthHeaderRef.current || '';

    // if already subscribed, force a resubscribe to pick new auth header
    if (channelRef.current) {
      const name = channelRef.current.name;
      channelRef.current.unbind_all();
      try {
        pusherRef.current.unsubscribe(name);
      } catch (e) {
        // ignore
      }
      channelRef.current = null;
      // re-subscribe
      const uuid = name.replace(/^private-conversation\./, '');
      subscribeToChannel(uuid);
    }
  };

  useEffect(() => {
    if (!conversationUuid) return;

    initPusher();

    // read any existing token from window (your api.js broadcasts tokenChanged events)
    const initialEvent = (window.__INITIAL_AUTH_HEADER && window.__INITIAL_AUTH_HEADER) || null;
    if (initialEvent) updateAuthHeader(initialEvent);

    // listen for token changes dispatched from your api helper
    const onTokenChanged = (e) => {
      // e.detail expected to be full header string: "Bearer x.y.z" or null
      updateAuthHeader(e?.detail || null);
    };
    window.addEventListener('tokenChanged', onTokenChanged);

    // subscribe to the private channel
    subscribeToChannel(conversationUuid);

    return () => {
      // cleanup
      window.removeEventListener('tokenChanged', onTokenChanged);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current) {
        channelRef.current.unbind_all();
        try {
          pusherRef.current.unsubscribe(channelRef.current.name);
        } catch (e) {
          // ignore
        }
        channelRef.current = null;
      }
      // We don't disconnect pusher instance here to allow reuse across routes.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationUuid, dispatch]);

  return {
    isConnected: !!pusherRef.current && pusherRef.current.connection?.state === 'connected',
    pusher: pusherRef.current,
  };
};

export default useChat;