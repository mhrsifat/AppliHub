// filepath: src/features/chat/hooks/useChat.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Pusher from 'pusher-js';
import { receiveMessage, setTyping } from '../slices/chatSlice';

export const useChat = (conversationId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!conversationId) return;
    const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER,
    });
    const channel = pusher.subscribe(`conversation-${conversationId}`);
    channel.bind('new-message', (data) => {
      dispatch(receiveMessage(data));
    });
    channel.bind('typing', (data) => {
      dispatch(setTyping(data.isTyping));
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId, dispatch]);
};