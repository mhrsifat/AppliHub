// src/features/chat/services/pusherService.js
import Pusher from 'pusher-js';

class PusherService {
  constructor() {
    this.pusher = null;
    this.channels = new Map();
    this.isConnected = false;
    this.connectionCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
  }

  initialize() {
    const appKey = import.meta.env.VITE_PUSHER_KEY;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER;

    if (!appKey) {
      console.error('Pusher app key not found');
      this.executeConnectionCallbacks('error');
      return;
    }

    try {
      this.pusher = new Pusher(appKey, {
        cluster,
        forceTLS: true,
        authEndpoint: `${import.meta.env.VITE_API_BASE}/broadcasting/auth`,
        auth: {
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        }
      });

      // Connection event handlers
      this.pusher.connection.bind('connected', () => {
        console.log('Pusher connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.executeConnectionCallbacks('connected');
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('Pusher disconnected');
        this.isConnected = false;
        this.executeConnectionCallbacks('disconnected');
      });

      this.pusher.connection.bind('error', (err) => {
        console.error('Pusher connection error:', err);
        this.isConnected = false;
        this.executeConnectionCallbacks('error');
      });

      this.pusher.connection.bind('connecting', () => {
        console.log('Pusher connecting...');
        this.executeConnectionCallbacks('connecting');
      });

    } catch (error) {
      console.error('Error initializing Pusher:', error);
      this.executeConnectionCallbacks('error');
    }
  }

  subscribeToConversation(conversationUuid, onMessage, onTyping, onRead = null) {
    if (!this.pusher) {
      console.error('Pusher not initialized');
      return null;
    }

    const channelName = `conversation.${conversationUuid}`;
    
    try {
      // Unsubscribe if already subscribed
      this.unsubscribeFromConversation(conversationUuid);

      const channel = this.pusher.subscribe(channelName);

      // Bind to message events
      channel.bind('MessageSent', (data) => {
        if (onMessage && data.message) {
          onMessage(data.message);
        }
      });

      // Bind to typing events
      channel.bind('UserTyping', (data) => {
        if (onTyping) {
          onTyping(data);
        }
      });

      // Bind to read receipts if provided
      if (onRead) {
        channel.bind('MessageRead', (data) => {
          onRead(data);
        });
      }

      // Handle subscription events
      channel.bind('subscription_succeeded', () => {
        console.log(`Subscribed to conversation: ${conversationUuid}`);
      });

      channel.bind('subscription_error', (error) => {
        console.error(`Subscription error for ${conversationUuid}:`, error);
      });

      this.channels.set(conversationUuid, channel);
      
      return () => {
        this.unsubscribeFromConversation(conversationUuid);
      };
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      return null;
    }
  }

  unsubscribeFromConversation(conversationUuid) {
    const channel = this.channels.get(conversationUuid);
    if (channel && this.pusher) {
      try {
        channel.unbind_all();
        this.pusher.unsubscribe(`conversation.${conversationUuid}`);
        this.channels.delete(conversationUuid);
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      }
    }
  }

  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  executeConnectionCallbacks(status) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  disconnect() {
    if (this.pusher) {
      this.channels.clear();
      this.pusher.disconnect();
      this.isConnected = false;
      this.connectionCallbacks = [];
    }
  }

  getConnectionState() {
    return this.pusher ? this.pusher.connection.state : 'disconnected';
  }

  // Utility method to check if we're connected
  waitForConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== checkConnection);
        reject(new Error('Connection timeout'));
      }, timeout);

      const checkConnection = (status) => {
        if (status === 'connected') {
          clearTimeout(timeoutId);
          this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== checkConnection);
          resolve(true);
        } else if (status === 'error') {
          clearTimeout(timeoutId);
          this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== checkConnection);
          reject(new Error('Connection failed'));
        }
      };

      this.connectionCallbacks.push(checkConnection);
    });
  }
}

// Create a singleton instance
const pusherService = new PusherService();
export default pusherService;