// filepath: src/features/chat/hooks/useChat.js 
import { useEffect, useRef, useState, useCallback } from 'react'; import chatService from '../services/chatService';

// useChat: manages message list, optimistic sending (optimistic = দ্রুত-প্রতিদিন UI), subscriptions 
export default function useChat(conversationUuid) { const [messages, setMessages] = useState([]); const [loading, setLoading] = useState(false); const mountedRef = useRef(true); const subRef = useRef(null);

useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

const loadMessages = useCallback(async (uuid) => { if (!uuid) { setMessages([]); return; } setLoading(true); try { const list = await chatService.fetchMessages(uuid, { page: 1, per_page: 200 }); if (!mountedRef.current) return; setMessages(list || []); } catch (e) { console.error('fetchMessages error', e); } finally { if (mountedRef.current) setLoading(false); } }, []);

useEffect(() => { // load when uuid changes 
loadMessages(conversationUuid);

// subscribe to pusher events
if (!conversationUuid) return;
subRef.current = chatService.subscribe(conversationUuid, {
  onMessage: (payload) => {
    // payload may be a MessageResource wrapper or the message object
    const m = payload.data ? payload.data : payload;
    setMessages(prev => {
      // dedupe by id
      if (prev.some(x => x.id && m.id && x.id === m.id)) return prev;
      return [...prev, m];
    });
  },
  onTyping: (payload) => {
    // ignore here; use useTyping hook for UI
  }
});

return () => {
  if (conversationUuid) chatService.unsubscribe(conversationUuid);
};

}, [conversationUuid, loadMessages]);

const sendMessage = useCallback(async (uuid, formData, { optimisticPayload } = {}) => { if (!uuid) throw new Error('uuid required'); // optimistic UI 
if (optimisticPayload) { const clientId = temp-${Date.now()}; setMessages(prev => [...prev, { ...optimisticPayload, clientId, sending: true }]); try { const serverMsg = await chatService.sendMessage(uuid, formData); // replace optimistic 
setMessages(prev => prev.map(m => (m.clientId === clientId ? serverMsg : m))); return serverMsg; } catch (e) { // mark failed 
setMessages(prev => prev.map(m => (m.clientId === clientId ? { ...m, sending: false, failed: true } : m))); throw e; } }

const serverMsg = await chatService.sendMessage(uuid, formData);
return serverMsg;

}, []);

const loadMore = useCallback(async () => { // placeholder for pagination/load more implementation 
}, []);

return { messages, loading, loadMessages, sendMessage, loadMore }; }

