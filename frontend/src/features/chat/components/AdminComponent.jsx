// filepath: src/features/chat/components/AdminComponent.jsx
import React from 'react';
import ConversationList from './ConversationList'; import MessageList from './MessageList'; import MessageComposer from './MessageComposer';

export default function AdminComponent({ apiBase }) { const [activeConversation, setActiveConversation] = React.useState(null);

return ( <div className="flex h-full"> <div className="w-80 border-r"> <ConversationList apiBase={apiBase} onSelect={setActiveConversation} /> </div> <div className="flex-1 flex flex-col"> <div className="flex-1 overflow-hidden"> <MessageList conversationUuid={activeConversation} apiBase={apiBase} /> </div> <div className="p-3 border-t"> <MessageComposer conversationUuid={activeConversation} apiBase={apiBase} /> </div> </div> </div> ); }

