// filepath: src/features/chat/components/MessageList.jsx 
import React, { useEffect, useRef } from 'react'; import MessageItem from './MessageItem'; import useChat from '../hooks/useChat';

export default function MessageList({ conversationUuid, apiBase }) { const listRef = useRef(null); const { messages, loading, loadMore } = useChat(conversationUuid);

useEffect(() => { // scroll to bottom on new messages
if (!listRef.current) return; listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

return ( <div ref={listRef} className="h-full overflow-auto p-3 flex flex-col gap-3 bg-white dark:bg-slate-900"> {loading && <div className="text-center text-sm text-slate-400">Loading...</div>} {messages && messages.map(m => ( <MessageItem key={m.id || m.clientId} message={m} /> ))} {!messages || messages.length === 0 ? ( <div className="text-sm text-slate-400 text-center">Start the conversation</div> ) : null} </div> ); }

