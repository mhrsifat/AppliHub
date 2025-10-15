// filepath: src/features/chat/pages/Page.jsx
import React from 'react'; import ChatWidget from '../components/ChatWidget'; import UserComponent from '../components/UserComponent';

export default function Page({ apiBase }) { return ( <div className="min-h-screen bg-slate-50 dark:bg-slate-900"> <div className="max-w-4xl mx-auto p-4"> <h1 className="text-xl font-semibold mb-4">Chat</h1> <div className="border rounded-lg overflow-hidden h-[600px]"> <UserComponent apiBase={apiBase} /> </div> </div> <ChatWidget apiBase={apiBase} /> </div> ); }

