// filepath: src/features/chat/components/ConversationItem.jsx 
import React from 'react';

export default function ConversationItem({ conv, active, onClick }) { return ( <button onClick={onClick} className={w-full text-left px-2 py-2 rounded-md ${active ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}}> <div className="flex items-center justify-between"> <div> <div className="text-sm font-medium">{conv.subject || 'No subject'}</div> <div className="text-xs text-slate-500">{conv.last_message_preview}</div> </div> <div className="text-xs text-slate-400">{conv.messages_count}</div> </div> </button> ); }

