// filepath: src/features/chat/components/ConversationList.jsx 
import React, { useEffect, useState } from 'react'; import ConversationItem from './ConversationItem'; import api from '../services/api';

export default function ConversationList({ apiBase = '/api', conversationUuid, onSelect }) { const [conversations, setConversations] = useState([]); const [loading, setLoading] = useState(false);

useEffect(() => { let mounted = true; setLoading(true); api.get(${apiBase}/message/conversations).then(res => { if (!mounted) return; setConversations(res.data.data || res.data); }).catch(() => {}).finally(() => setLoading(false)); return () => { mounted = false; }; }, [apiBase]);

return ( <div className="px-3 py-2 border-b dark:border-slate-800"> <div className="text-xs text-slate-500 mb-2">Conversations</div> <div className="flex flex-col gap-2 max-h-[160px] overflow-auto"> {loading && <div className="text-sm text-slate-400">Loading...</div>} {conversations.map(conv => ( <ConversationItem key={conv.id} conv={conv} active={conv.uuid === conversationUuid} onClick={() => onSelect(conv.uuid)} /> ))} {conversations.length === 0 && !loading && <div className="text-sm text-slate-400">No conversations yet</div>} </div> </div> ); }
