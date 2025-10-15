// filepath: src/features/chat/components/TypingIndicator.jsx
import React from 'react'; import useTyping from '../hooks/useTyping';

export default function TypingIndicator({ conversationUuid }) { const typing = useTyping(conversationUuid); if (!typing) return null; return ( <div className="text-xs text-slate-500 mb-1 italic">{typing.name} is typing…</div> ); }

