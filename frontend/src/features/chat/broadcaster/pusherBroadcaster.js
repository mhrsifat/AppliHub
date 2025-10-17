// filepath: src/features/chat/broadcaster/pusherBroadcaster.js
import Pusher from "pusher-js";

/**
 * Small wrapper around pusher-js to match expected interface:
 * subscribe(channel), unsubscribe(channel), bind(channel,event,fn), unbind(channel,event,fn)
 *
 * Usage:
 * const pb = createPusherBroadcaster({ key: PUSHER_KEY, cluster: 'ap1', authEndpoint: '/broadcasting/auth' });
 * <UserChatWidget broadcaster={pb} />
 */

export function createPusherBroadcaster({ key, cluster = "mt1", authEndpoint = null, authHeaders = {} } = {}) {
  const pusher = new Pusher(key, {
    cluster,
    authEndpoint,
    auth: authEndpoint ? { headers: authHeaders } : undefined,
  });

  return {
    subscribe: (channel) => pusher.subscribe(channel),
    unsubscribe: (channel) => pusher.unsubscribe(channel),
    bind: (channel, event, handler) => {
      const ch = pusher.channel(channel) || pusher.subscribe(channel);
      ch.bind(event, handler);
    },
    unbind: (channel, event, handler) => {
      const ch = pusher.channel(channel);
      if (ch) ch.unbind(event, handler);
    },
    channelName: (uuid) => `conversation.${uuid}`,
    raw: pusher,
  };
}