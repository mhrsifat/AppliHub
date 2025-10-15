// filepath: src/features/chat/components/ChatWidgetPanel.jsx
import React from 'react'; import ConversationList from './ConversationList'; import MessageList from './MessageList'; import MessageComposer from './MessageComposer'; import TypingIndicator from './TypingIndicator';

export default function ChatWidgetPanel({ onClose, apiBase }) { // minimal local state — conversation UUID will be created when user sends first message
  const [conversationUuid, setConversationUuid] = React.useState(null);

return ( <div className="w-[360px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col"> <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-800"> <div className="flex items-center gap-2"> <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">💬</div> <div> <div className="text-sm font-semibold">Support</div> <div className="text-xs text-slate-500">We reply within 24 hrs</div> </div> </div> <div className="flex items-center gap-2"> <button onClick={onClose} className="text-slate-500 hover:text-slate-700">Close</button> </div> </div>

<div className="flex-1 flex flex-col">
    <ConversationList apiBase={apiBase} conversationUuid={conversationUuid} onSelect={setConversationUuid} />
    <div className="flex-1 overflow-hidden">
      <MessageList conversationUuid={conversationUuid} apiBase={apiBase} />
    </div>
    <div className="px-3 py-2 border-t dark:border-slate-800">
      <TypingIndicator conversationUuid={conversationUuid} apiBase={apiBase} />
      <MessageComposer conversationUuid={conversationUuid} apiBase={apiBase} onCreated={setConversationUuid} />
    </div>
  </div>
</div>

); }
