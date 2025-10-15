// filepath: src/features/chat/components/UserComponent.jsx
import React from 'react'; import MessageList from './MessageList'; import MessageComposer from './MessageComposer';

export default function UserComponent({ conversationUuid, apiBase }) { return ( <div className="flex flex-col h-full"> <div className="flex-1 overflow-hidden"> <MessageList conversationUuid={conversationUuid} apiBase={apiBase} /> </div> <div className="p-3 border-t"> <MessageComposer conversationUuid={conversationUuid} apiBase={apiBase} /> </div> </div> ); }
