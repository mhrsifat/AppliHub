// filepath: src/features/chat/components/MessageList.jsx
import React from 'react';
import ChatMessage from './ChatMessage';

const MessageList = ({ messages, currentUser }) => {
  return (
    <div className="flex-1 overflow-y-auto mb-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} currentUser={currentUser} />
      ))}
    </div>
  );
};

export default MessageList;