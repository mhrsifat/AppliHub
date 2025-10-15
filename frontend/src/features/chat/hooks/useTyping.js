// filepath: src/features/chat/hooks/useTyping.js 
import { useEffect, useRef, useState } from 'react'; import chatService from '../services/chatService';

// debounce helper function
debounce(fn, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }

export default function useTyping(conversationUuid, { name } = {}) { const [typing, setTyping] = useState(null); const lastEmit = useRef(0);

useEffect(() => { // subscribe to typing events locally via pusher handled in useChat or chatService // Here we only expose local typing state; the app-level subscription will feed UI.
function onTyping(payload) { const p = payload.data ? payload.data : payload; if (!p) return; setTyping({ name: p.userName || name || 'Someone', isStaff: !!p.isStaff }); setTimeout(() => setTyping(null), 3000); }

// subscribe to pusher channel directly to listen typing events
if (!conversationUuid) return;
const sub = chatService.subscribe(conversationUuid, { onTyping });

return () => {
  if (conversationUuid) chatService.unsubscribe(conversationUuid);
};

}, [conversationUuid, name]);

// function to emit typing
(debounced) const emit = useRef(debounce(async () => { if (!conversationUuid) return; try { await chatService.sendTyping(conversationUuid, { name }); lastEmit.current = Date.now(); } catch (e) { // ignore 
} }, 800));

return { typing, emit: emit.current }; }

