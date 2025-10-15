// filepath: src/features/chat/components/ChatWidgetButton.jsx
import React from 'react'; import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

export default function ChatWidgetButton({ onClick, open }) { return ( <button onClick={onClick} aria-label={open ? 'Close chat' : 'Open chat'} className="bg-white/90 dark:bg-slate-800/95 shadow-lg rounded-full p-3 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" > <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-indigo-600" /> </button> ); }

