// filepath: src/features/chat/hooks/useChat.js
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Pusher from "pusher-js";
import { receiveMessage, setTyping } from "../slices/chatSlice";

/**
 * Custom hook for real-time chat functionality
 * Supports multiple websites, platforms, and both authenticated/anonymous users
 * 
 * @param {string} conversationUuid - The UUID of the conversation
 * @param {Object} options - Configuration options
 * @param {string} options.apiBase - Override default API base URL
 * @param {string} options.pusherKey - Override default Pusher key
 * @param {string} options.pusherCluster - Override default Pusher cluster
 * @param {boolean} options.autoConnect - Whether to auto-connect (default: true)
 * @param {Function} options.onConnected - Callback when connected
 * @param {Function} options.onError - Callback when error occurs
 * @returns {Object} Chat interface object
 */
export const useChat = (conversationUuid, options = {}) => {
  const dispatch = useDispatch();
  
  // Refs for stable references
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const optionsRef = useRef(options);
  
  // State
  const [authToken, setAuthToken] = useState(() => {
    return window.apiAccessToken || 
           localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token') ||
           '';
  });
  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastError, setLastError] = useState(null);

  // Get user authentication state
  const { user, employee, admin, isAuthenticated } = useSelector(
    (state) => state.auth || {}
  );

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Configuration with overrides
  const config = {
    PUSHER_KEY: options.pusherKey || import.meta.env.VITE_PUSHER_KEY,
    PUSHER_CLUSTER: options.pusherCluster || import.meta.env.VITE_PUSHER_CLUSTER || "ap1",
    API_BASE: options.apiBase || import.meta.env.VITE_API_BASE,
    autoConnect: options.autoConnect !== false,
    enableLogging: options.enableLogging ?? false, // Disabled by default in production
  };

  // Logging helper - only logs in development or when explicitly enabled
  const log = useCallback((level, message, data = {}) => {
    if (!config.enableLogging && !import.meta.env.DEV) return;
    
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      conversationUuid,
      userType: isAuthenticated ? 'authenticated' : 'anonymous',
      userId: user?.id || employee?.id || admin?.id || 'anonymous',
      ...data
    };

    if (import.meta.env.DEV) {
      switch (level) {
        case 'error':
          console.error(`❌ [useChat] ${message}`, logData);
          break;
        case 'warn':
          console.warn(`⚠️ [useChat] ${message}`, logData);
          break;
        case 'info':
          console.info(`🔹 [useChat] ${message}`, logData);
          break;
        case 'debug':
          console.debug(`🔍 [useChat] ${message}`, logData);
          break;
        default:
          console.log(`📝 [useChat] ${message}`, logData);
      }
    }
  }, [conversationUuid, isAuthenticated, user, employee, admin, config.enableLogging]);

  // Get anonymous user data from various storage methods
  const getAnonymousAuthData = useCallback(() => {
    try {
      const storageKeys = ['chat_user', 'anonymous_user', 'guest_user'];
      
      for (const key of storageKeys) {
        try {
          const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
          if (stored) {
            const userData = JSON.parse(stored);
            if (userData.contact || userData.email || userData.phone) {
              log('debug', `Found anonymous user data in ${key}`, { userData });
              return {
                contact: userData.contact || userData.email || userData.phone || '',
                conversation_uuid: conversationUuid || userData.conversationUuid || '',
              };
            }
          }
        } catch (parseError) {
          log('debug', `Failed to parse ${key}`, { error: parseError.message });
        }
      }

      if (optionsRef.current.contact) {
        return {
          contact: optionsRef.current.contact,
          conversation_uuid: conversationUuid || '',
        };
      }

      log('warn', 'No anonymous user data found');
      return { contact: '', conversation_uuid: conversationUuid || '' };
    } catch (error) {
      log('error', 'Error getting anonymous auth data', { error: error.message });
      return { contact: '', conversation_uuid: conversationUuid || '' };
    }
  }, [conversationUuid, log]);

  // Get authentication headers for authenticated users
  const getAuthHeaders = useCallback(() => {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };

    const token = authToken || 
                  window.apiAccessToken || 
                  localStorage.getItem('auth_token') ||
                  sessionStorage.getItem('auth_token');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      log('debug', 'Added Bearer token to auth headers');
    } else {
      log('warn', 'No auth token available for authenticated user');
    }

    return headers;
  }, [authToken, log]);

  // Channel name helper
  const privateChannel = useCallback((uuid) => {
    return `private-conversation.${uuid}`;
  }, []);

  // Create Pusher authentication response
  const createPusherAuthResponse = useCallback((channelName, socketId) => {
    try {
      const stringToSign = `${socketId}:${channelName}`;
      log('debug', 'Created Pusher auth string', { stringToSign });
      return { auth: stringToSign };
    } catch (error) {
      log('error', 'Failed to create Pusher auth response', { error: error.message });
      throw error;
    }
  }, [log]);

  // Initialize Pusher connection
  const initPusher = useCallback(() => {
    if (pusherRef.current) {
      log('debug', 'Pusher already initialized');
      return;
    }

    if (!config.PUSHER_KEY) {
      const error = "Cannot initialize Pusher: App key missing";
      log('error', error);
      setLastError(error);
      if (optionsRef.current.onError) {
        optionsRef.current.onError(new Error(error));
      }
      return;
    }

    const baseConfig = {
      cluster: config.PUSHER_CLUSTER,
      forceTLS: true,
      authTransport: "ajax",
      enableStats: false,
      disableStats: true,
      logToConsole: false, // Always disabled in production
    };

    const isAnonymous = !isAuthenticated && !admin && !employee && !user;
    
    if (isAnonymous) {
      const authData = getAnonymousAuthData();
      log('info', 'Initializing anonymous Pusher connection', { authData });
      
      pusherRef.current = new Pusher(config.PUSHER_KEY, {
        ...baseConfig,
        authEndpoint: `${config.API_BASE}/broadcasting/auth/anonymous`,
        auth: {
          params: authData,
          headers: {
            ...baseConfig.auth?.headers,
          },
        },
      });
    } else {
      log('info', 'Initializing authenticated Pusher connection', {
        hasToken: !!authToken,
        userType: admin ? 'admin' : employee ? 'employee' : user ? 'user' : 'unknown'
      });
      
      pusherRef.current = new Pusher(config.PUSHER_KEY, {
        ...baseConfig,
        authEndpoint: `${config.API_BASE}/broadcasting/auth`,
        auth: {
          headers: getAuthHeaders(),
        },
      });
    }

    // Connection state management
    pusherRef.current.connection.bind("connected", () => {
      log('info', 'Pusher connected successfully');
      setConnectionState('connected');
      setLastError(null);
      if (optionsRef.current.onConnected) {
        optionsRef.current.onConnected();
      }
    });

    pusherRef.current.connection.bind("error", (err) => {
      log('error', 'Pusher connection error', { error: err });
      setConnectionState('error');
      setLastError(err);
      if (optionsRef.current.onError) {
        optionsRef.current.onError(err);
      }
    });

    pusherRef.current.connection.bind("disconnected", () => {
      log('info', 'Pusher disconnected');
      setConnectionState('disconnected');
    });

    pusherRef.current.connection.bind("state_change", (states) => {
      log('debug', 'Pusher state change', {
        previous: states.previous,
        current: states.current
      });
      setConnectionState(states.current);
    });

    pusherRef.current.connection.bind("message", (data) => {
      log('debug', 'Global Pusher message', { data });
    });

  }, [
    config.PUSHER_KEY,
    config.PUSHER_CLUSTER,
    config.API_BASE,
    isAuthenticated,
    admin,
    employee,
    user,
    authToken,
    getAnonymousAuthData,
    getAuthHeaders,
    log
  ]);

  // Subscribe to private channel
  const subscribe = useCallback((uuid) => {
    if (!pusherRef.current) {
      log('error', 'Pusher not initialized for subscription');
      return;
    }

    const chanName = privateChannel(uuid);
    log('info', 'Subscribing to channel', { channel: chanName });

    // Unsubscribe from previous channel
    if (channelRef.current) {
      try {
        pusherRef.current.unsubscribe(channelRef.current.name);
        channelRef.current.unbind_all();
        log('debug', 'Unsubscribed from previous channel', { 
          previousChannel: channelRef.current.name 
        });
      } catch (error) {
        log('warn', 'Error unsubscribing from previous channel', { 
          error: error.message 
        });
      }
      channelRef.current = null;
    }

    try {
      channelRef.current = pusherRef.current.subscribe(chanName);

      // Channel subscription events
      channelRef.current.bind("pusher:subscription_succeeded", () => {
        log('info', 'Successfully subscribed to channel', { channel: chanName });
      });

      channelRef.current.bind("pusher:subscription_error", (err) => {
        log('error', 'Channel subscription error', { 
          channel: chanName, 
          error: err 
        });
        setLastError(err);
      });

      // Message events
      channelRef.current.bind("MessageSent", (data) => {
        log('info', 'Message received via Pusher', { 
          messageId: data.message?.id || data.id,
          channel: chanName
        });

        const messageData = data.message || data.data || data;
        
        if (messageData) {
          log('debug', 'Dispatching receiveMessage', { messageData });
          dispatch(receiveMessage(messageData));
        } else {
          log('warn', 'Received empty or invalid message data', { data });
        }
      });

      // Typing indicators
      const handleTyping = (isTyping) => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        dispatch(setTyping(isTyping));
        
        if (isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            dispatch(setTyping(false));
          }, 3000);
        }
      };

      channelRef.current.bind("UserTyping", () => handleTyping(true));
      channelRef.current.bind("UserStopTyping", () => handleTyping(false));

      // Custom events
      if (optionsRef.current.customEvents) {
        Object.entries(optionsRef.current.customEvents).forEach(([event, handler]) => {
          channelRef.current.bind(event, handler);
        });
      }

    } catch (error) {
      log('error', 'Error subscribing to channel', { 
        channel: chanName, 
        error: error.message 
      });
      setLastError(error);
    }
  }, [privateChannel, dispatch, log]);

  // Unsubscribe and cleanup
  const unsubscribe = useCallback(() => {
    log('info', 'Cleaning up chat subscriptions');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (channelRef.current && pusherRef.current) {
      try {
        const channelName = channelRef.current.name;
        pusherRef.current.unsubscribe(channelName);
        channelRef.current.unbind_all();
        channelRef.current = null;
        log('debug', 'Unsubscribed from channel', { channel: channelName });
      } catch (error) {
        log('warn', 'Error during unsubscribe', { error: error.message });
      }
    }
  }, [log]);

  // Disconnect Pusher completely
  const disconnect = useCallback(() => {
    log('info', 'Disconnecting Pusher');
    unsubscribe();
    
    if (pusherRef.current) {
      try {
        pusherRef.current.disconnect();
        pusherRef.current = null;
        setConnectionState('disconnected');
        log('info', 'Pusher disconnected successfully');
      } catch (error) {
        log('error', 'Error disconnecting Pusher', { error: error.message });
      }
    }
  }, [unsubscribe, log]);

  // Reconnect with new credentials
  const reconnect = useCallback((newToken = null) => {
    log('info', 'Reconnecting Pusher with new credentials');
    
    if (newToken) {
      setAuthToken(newToken);
    }
    
    disconnect();
    
    setTimeout(() => {
      if (conversationUuid && config.autoConnect) {
        initPusher();
        subscribe(conversationUuid);
      }
    }, 100);
  }, [conversationUuid, config.autoConnect, initPusher, subscribe, disconnect, log]);

  // Send typing indicators
  const sendTyping = useCallback((isTyping = true) => {
    if (!channelRef.current) {
      log('warn', 'Cannot send typing indicator - no active channel');
      return;
    }

    const eventName = isTyping ? "client-typing" : "client-stop-typing";
    
    try {
      channelRef.current.trigger(eventName, {
        conversationUuid,
        timestamp: new Date().toISOString(),
        userType: isAuthenticated ? 'authenticated' : 'anonymous',
        userId: user?.id || employee?.id || admin?.id || 'anonymous'
      });
      
      log('debug', `Sent typing indicator: ${isTyping ? 'typing' : 'stop typing'}`);
    } catch (error) {
      log('error', 'Failed to send typing indicator', { error: error.message });
    }
  }, [conversationUuid, isAuthenticated, user, employee, admin, log]);

  // Main effect: initialize and subscribe when conversationUuid changes
  useEffect(() => {
    if (!conversationUuid) {
      log('warn', 'No conversation UUID provided');
      return;
    }

    if (!config.PUSHER_KEY) {
      const error = "Missing Pusher key - cannot initialize chat";
      log('error', error);
      setLastError(error);
      return;
    }

    if (config.autoConnect) {
      log('info', 'Auto-connecting to chat', { conversationUuid });
      initPusher();
      subscribe(conversationUuid);
    }

    return () => {
      log('info', 'Cleaning up chat hook', { conversationUuid });
      unsubscribe();
    };
  }, [conversationUuid, config.autoConnect, config.PUSHER_KEY, initPusher, subscribe, unsubscribe, log]);

  // Listen for global token changes
  useEffect(() => {
    const handleTokenChange = (event) => {
      log('info', 'Global token change detected', { 
        hasToken: !!event.detail,
        tokenLength: event.detail ? event.detail.length : 0
      });
      setAuthToken(event.detail);
      reconnect(event.detail);
    };

    const handleStorageChange = (event) => {
      if (event.key === 'auth_token' || event.key === 'apiAccessToken') {
        const newToken = event.newValue || localStorage.getItem('auth_token');
        log('info', 'Storage token change detected', { key: event.key });
        setAuthToken(newToken);
        reconnect(newToken);
      }
    };

    const handleMessage = (event) => {
      if (event.data?.type === 'chat_token_update') {
        log('info', 'Cross-domain token update received');
        setAuthToken(event.data.token);
        reconnect(event.data.token);
      }
    };

    window.addEventListener("tokenChanged", handleTokenChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("tokenChanged", handleTokenChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("message", handleMessage);
    };
  }, [reconnect, log]);

  // Manual connection control
  const connect = useCallback(() => {
    if (!conversationUuid) {
      const error = "Cannot connect: no conversation UUID";
      log('error', error);
      setLastError(error);
      return false;
    }

    if (!config.PUSHER_KEY) {
      const error = "Cannot connect: missing Pusher key";
      log('error', error);
      setLastError(error);
      return false;
    }

    log('info', 'Manual connection initiated');
    initPusher();
    subscribe(conversationUuid);
    return true;
  }, [conversationUuid, config.PUSHER_KEY, initPusher, subscribe, log]);

  // Public API
  const chatInterface = {
    // Connection state
    isConnected: connectionState === 'connected',
    connectionState,
    lastError,
    
    // Connection control
    connect,
    disconnect,
    reconnect: () => reconnect(authToken),
    
    // Messaging
    sendTyping: () => sendTyping(true),
    stopTyping: () => sendTyping(false),
    
    // Channel info
    currentChannel: channelRef.current?.name || null,
    pusherInstance: pusherRef.current,
    
    // Utilities
    updateToken: (newToken) => {
      log('info', 'Updating auth token via API');
      setAuthToken(newToken);
      reconnect(newToken);
    },
    
    // Debug info (only in development)
    getDebugInfo: () => import.meta.env.DEV ? {
      conversationUuid,
      connectionState,
      isAuthenticated,
      userType: admin ? 'admin' : employee ? 'employee' : user ? 'user' : 'anonymous',
      channel: channelRef.current?.name,
      pusherState: pusherRef.current?.connection?.state,
      config: {
        hasPusherKey: !!config.PUSHER_KEY,
        apiBase: config.API_BASE,
        autoConnect: config.autoConnect
      }
    } : null
  };

  return chatInterface;
};

export default useChat;

// Global token management utilities
export const ChatAPI = {
  // Set global token with silent error handling
  setGlobalToken: (token, storageType = 'localStorage') => {
    try {
      if (storageType === 'localStorage') {
        localStorage.setItem('auth_token', token);
      } else if (storageType === 'sessionStorage') {
        sessionStorage.setItem('auth_token', token);
      }
      
      window.apiAccessToken = token;
      
      const event = new CustomEvent('tokenChanged', { detail: token });
      window.dispatchEvent(event);
      
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'chat_token_update',
          token: token
        }, '*');
      }
    } catch (error) {
      // Silent fail in production
      if (import.meta.env.DEV) {
        console.error('Failed to set global token:', error);
      }
    }
  },

  // Clear authentication with silent error handling
  clearAuth: () => {
    try {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      delete window.apiAccessToken;
      
      const event = new CustomEvent('tokenChanged', { detail: null });
      window.dispatchEvent(event);
    } catch (error) {
      // Silent fail in production
      if (import.meta.env.DEV) {
        console.error('Failed to clear auth:', error);
      }
    }
  },

  // Set anonymous user data with silent error handling
  setAnonymousUser: (userData, storageType = 'localStorage') => {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem('chat_user', JSON.stringify(userData));
    } catch (error) {
      // Silent fail in production
      if (import.meta.env.DEV) {
        console.error('Failed to set anonymous user:', error);
      }
    }
  }
};

/**
 * @typedef {Object} ChatOptions
 * @property {string} [apiBase] - Override default API base URL
 * @property {string} [pusherKey] - Override default Pusher key
 * @property {string} [pusherCluster] - Override default Pusher cluster
 * @property {boolean} [autoConnect] - Whether to auto-connect (default: true)
 * @property {string} [contact] - Contact info for anonymous users
 * @property {boolean} [enableLogging] - Enable debug logging
 * @property {Function} [onConnected] - Callback when connected
 * @property {Function} [onError] - Callback when error occurs
 * @property {Object} [customEvents] - Custom event handlers
 */

/**
 * @typedef {Object} ChatInterface
 * @property {boolean} isConnected - Whether chat is connected
 * @property {string} connectionState - Current connection state
 * @property {Error|null} lastError - Last error encountered
 * @property {Function} connect - Manual connect function
 * @property {Function} disconnect - Manual disconnect function
 * @property {Function} reconnect - Reconnect function
 * @property {Function} sendTyping - Send typing indicator
 * @property {Function} stopTyping - Send stop typing indicator
 * @property {string|null} currentChannel - Current channel name
 * @property {Object|null} pusherInstance - Raw Pusher instance
 * @property {Function} updateToken - Update auth token
 * @property {Function} getDebugInfo - Get debug information (dev only)
 */