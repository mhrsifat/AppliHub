// filepath: src/features/chat/services/chatService.js 
import Pusher from 'pusher-js'; import api from './api';

// Small wrapper for pusher subscriptions and REST calls. // Exports: fetchMessages, sendMessage, sendTyping, subscribe, unsubscribe

let pusher = null; const channels = new Map();

function getPusher() { if (!pusher) { const key = typeof window !== 'undefined' ? window.CHAT_WIDGET_PUSHER_KEY : null; pusher = new Pusher(key || '', { cluster: typeof window !== 'undefined' ? window.CHAT_WIDGET_PUSHER_CLUSTER || 'mt1' : 'mt1', forceTLS: true }); } return pusher; }

export async function fetchMessages(uuid, { page = 1, per_page = 50 } = {}) { if (!uuid) return []; const res = await api.get(/message/conversations/${uuid}/messages, { params: { page, per_page } }); // normalize array
return res.data.data || res.data; }

export async function sendMessage(uuid, formData) { if (!uuid) throw new Error('conversation uuid required'); // formData should be a FormData instance
const res = await api.post(/message/conversations/${uuid}/messages, formData, { headers: { 'Content-Type': 'multipart/form-data' }, }); return res.data.data || res.data; }

export async function sendTyping(uuid, payload = {}) { if (!uuid) return null; const res = await api.post(/message/conversations/${uuid}/typing, payload); return res.data; }

export function subscribe(uuid, handlers = {}) { if (!uuid) return null; const channelName = conversation.${uuid}; if (channels.has(channelName)) return channels.get(channelName);

const instance = getPusher(); const channel = instance.subscribe(channelName);

const onMessage = (data) => { if (handlers.onMessage) handlers.onMessage(data.message || data); }; const onTyping = (data) => { if (handlers.onTyping) handlers.onTyping(data); };

channel.bind('MessageSent', onMessage); channel.bind('UserTyping', onTyping);

const subscription = { channel, onMessage, onTyping }; channels.set(channelName, subscription); return subscription; }

export function unsubscribe(uuid) { const channelName = conversation.${uuid}; const sub = channels.get(channelName); if (!sub) return; const instance = getPusher(); sub.channel.unbind('MessageSent', sub.onMessage); sub.channel.unbind('UserTyping', sub.onTyping); instance.unsubscribe(channelName); channels.delete(channelName); }

export default { fetchMessages, sendMessage, sendTyping, subscribe, unsubscribe, };

