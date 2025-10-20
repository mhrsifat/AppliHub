import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import Pusher from 'pusher-js';
import { receiveMessage, setTyping } from '../slices/chatSlice';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;
const API_BASE = import.meta.env.VITE_API_BASE;

export const useChat = (conversationUuid, isAnonymous = false) => {
  const dispatch = useDispatch();
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const privateChannel = (uuid) => `private-conversation.${uuid}`;

  const getAnonymousAuthData = () => {
    try {
      const chatUser = localStorage.getItem('chat_user');
      if (chatUser) {
        const userData = JSON.parse(chatUser);
        return {
          contact: userData.contact || ''
        };
      }
    } catch (error) {
      console.warn('Failed to get chat user from localStorage:', error);
    }
    return { contact: '' };
  };

  const initPusher = () => {
    if (pusherRef.current) return;

    if (isAnonymous) {
      const authData = getAnonymousAuthData();
      
      console.log('Initializing Pusher for anonymous user with:', authData);

      pusherRef.current = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        forceTLS: true,
        authEndpoint: `${API_BASE.replace(/\/$/, '')}/broadcasting/auth/anonymous`,
        auth: {
          params: authData
        },
        logToConsole: import.meta.env.DEV,
      });
    } else {
      // Staff authentication
      const authToken = localStorage.getItem('auth_token');
      console.log('Initializing Pusher for staff with token:', !!authToken);
      
      pusherRef.current = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        forceTLS: true,
        authEndpoint: `${API_BASE.replace(/\/$/, '')}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
        logToConsole: import.meta.env.DEV,
      });
    }

    // Handle connection events
    pusherRef.current.connection.bind('connected', () => {
      console.log('Pusher connected successfully');
    });

    pusherRef.current.connection.bind('error', (err) => {
      console.error('Pusher connection error:', err);
    });

    pusherRef.current.connection.bind('state_change', (states) => {
      console.log('Pusher state changed:', states);
    });
  };

  const subscribe = (uuid) => {
    if (!pusherRef.current) {
      console.error('Pusher not initialized');
      return;
    }

    const chanName = privateChannel(uuid);

    // If already subscribed to this channel, return
    if (channelRef.current && channelRef.current.name === chanName) {
      console.log('Already subscribed to:', chanName);
      return;
    }

    // Clean up previous subscription
    if (channelRef.current) {
      console.log('Unsubscribing from previous channel:', channelRef.current.name);
      channelRef.current.unbind_all();
      try { 
        pusherRef.current.unsubscribe(channelRef.current.name); 
      } catch (error) {
        console.warn('Error unsubscribing from channel:', error);
      }
      channelRef.current = null;
    }

    try {
      console.log('Attempting to subscribe to channel:', chanName);
      channelRef.current = pusherRef.current.subscribe(chanName);

      channelRef.current.bind('pusher:subscription_error', (status) => {
        console.error('Pusher subscription error:', status);
      });

      channelRef.current.bind('pusher:subscription_succeeded', () => {
        console.log('Successfully subscribed to:', chanName);
      });

      // Handle message events from backend
      channelRef.current.bind('message.sent', (data) => {
        console.log('Received message event:', data);
        if (data?.message) {
          dispatch(receiveMessage(data.message));
        }
      });

      // Handle the Laravel-specific event name
      channelRef.current.bind('MessageSent', (data) => {
        console.log('Received MessageSent event:', data);
        if (data?.message) {
          dispatch(receiveMessage(data.message));
        }
      });

      // Handle typing indicators
      channelRef.current.bind('user.typing', (data) => {
        console.log('User typing event:', data);
        dispatch(setTyping(true));
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => dispatch(setTyping(false)), 3000);
      });

      channelRef.current.bind('user.typing.stopped', (data) => {
        console.log('User stopped typing event:', data);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        dispatch(setTyping(false));
      });

      // Handle the Laravel-specific typing event names
      channelRef.current.bind('UserTyping', (data) => {
        console.log('Received UserTyping event:', data);
        dispatch(setTyping(true));
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => dispatch(setTyping(false)), 3000);
      });

      channelRef.current.bind('UserTypingStopped', (data) => {
        console.log('Received UserTypingStopped event:', data);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        dispatch(setTyping(false));
      });

    } catch (error) {
      console.error('Failed to subscribe to channel:', error);
    }
  };

  useEffect(() => {
    if (!conversationUuid) {
      console.log('No conversation UUID provided, skipping Pusher initialization');
      return;
    }

    console.log('Initializing Pusher for conversation:', conversationUuid, 'isAnonymous:', isAnonymous);
    initPusher();
    subscribe(conversationUuid);

    return () => {
      console.log('Cleaning up Pusher subscription for:', conversationUuid);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current) {
        channelRef.current.unbind_all();
        try { 
          pusherRef.current.unsubscribe(channelRef.current.name); 
        } catch (error) {
          console.warn('Error unsubscribing from channel:', error);
        }
        channelRef.current = null;
      }
    };
  }, [conversationUuid, isAnonymous]);

  return {
    isConnected: !!pusherRef.current && pusherRef.current.connection?.state === 'connected',
    pusher: pusherRef.current,
  };
};

export default useChat;