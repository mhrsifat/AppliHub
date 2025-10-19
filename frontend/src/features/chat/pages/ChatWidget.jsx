// filepath: src/features/chat/pages/ChatWidget.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { startConversation, fetchConversation, sendMessage } from '../slices/chatSlice';
import { useChat } from '../hooks/useChat';
import ChatStartForm from '../components/ChatStartForm';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';

const ChatWidget = () => {
  const dispatch = useDispatch();
  const conversationId = useSelector((state) => state.chat.conversationId);
  const user = useSelector((state) => state.chat.user);
  const messages = useSelector((state) => state.chat.messages);
  const isTyping = useSelector((state) => state.chat.isTyping);

  // Fetch conversation on mount if exists and no messages loaded
  useEffect(() => {
    if (conversationId && messages.length === 0) {
      dispatch(fetchConversation(conversationId));
    }
  }, [conversationId, messages.length, dispatch]);

  // Subscribe to Pusher for real-time updates via custom hook
  useChat(conversationId);

  const handleStart = ({ name, email, phone, message }) => {
    dispatch(startConversation({ name, email, phone, message }));
  };

  const handleSendMessage = ({ message, file }) => {
    if (!conversationId) return;
    dispatch(sendMessage({ conversationId, message, file }));
  };

  if (!conversationId) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <ChatStartForm onStart={handleStart} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-4 border rounded shadow-lg bg-white">
      <MessageList messages={messages} currentUser={user.name} />
      {isTyping && <TypingIndicator />}
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

export default ChatWidget;