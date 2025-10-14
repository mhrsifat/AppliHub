import React, { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { Box, TextField, IconButton, Button, List } from '@mui/material';
import api from '../../services/api'; // your api.js client
import MessageItem from './MessageItem';

// Heroicons
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';

export default function ChatWindow({ apiBase, onClose }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const pusherRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    fetchMessages();

    if (window.Pusher && conversation.id) {
      if (pusherRef.current) pusherRef.current.disconnect();
      pusherRef.current = new Pusher(process.env.VITE_PUSHER_KEY, {
        cluster: process.env.VITE_PUSHER_CLUSTER,
        authEndpoint: `${apiBase}/broadcasting/auth`,
        auth: {
          params: { contact },
        },
      });

      const channel = pusherRef.current.subscribe(`conversation.${conversation.id}`);

      // Laravel sometimes sends the FQCN event name, sometimes a short name. Bind both.
      channel.bind('App\\Events\\MessageSent', (data) => {
        if (data.message) {
          setMessages((m) => [...m, data.message]);
          scrollToBottom();
        }
      });

      channel.bind('message', (data) => {
        if (data.message) {
          setMessages((m) => [...m, data.message]);
          scrollToBottom();
        }
      });

      return () => {
        try {
          pusherRef.current.unsubscribe(`conversation.${conversation.id}`);
          pusherRef.current.disconnect();
        } catch (e) {
          // ignore
        }
      };
    }
  }, [conversation]);

  const createConversation = async () => {
    if (!name || !contact) {
      alert('Please provide name and contact (email or phone).');
      return;
    }
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('contact', contact);
      form.append('message', body);
      attachments.forEach((f) => form.append('attachments[]', f));

      const res = await api.post('/message/conversations', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const conv = res.data.data || res.data;
      setConversation(conv);
      if (conv && conv.id) fetchMessagesForConversation(conv.id);
      setBody('');
      setAttachments([]);
    } catch (err) {
      console.error(err);
      alert('Unable to open conversation.');
    }
  };

  const sendMessage = async () => {
    if (!conversation) {
      await createConversation();
      return;
    }

    const form = new FormData();
    form.append('body', body);
    form.append('name', name);
    form.append('contact', contact);
    attachments.forEach((f) => form.append('attachments[]', f));
    try {
      const res = await api.post(`/message/conversations/${conversation.id}/messages`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((m) => [...m, res.data.data || res.data]);
      setBody('');
      setAttachments([]);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      alert('Unable to send message.');
    }
  };

  const fetchMessages = async () => {
    if (!conversation) return;
    try {
      const res = await api.get(`/message/conversations/${conversation.id}/messages`);
      setMessages(res.data.data || res.data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessagesForConversation = async (id) => {
    try {
      const res = await api.get(`/message/conversations/${id}/messages`);
      setConversation({ id });
      setMessages(res.data.data || res.data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 50);
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }} ref={listRef}>
        <List>
          {messages.map((m) => (
            <MessageItem key={m.id} message={m} />
          ))}
        </List>
      </Box>

      <Box sx={{ mt: 1 }}>
        {!conversation && (
          <>
            <TextField fullWidth placeholder="Your name" value={name} onChange={(e)=>setName(e.target.value)} sx={{mb:1}} />
            <TextField fullWidth placeholder="Email or phone" value={contact} onChange={(e)=>setContact(e.target.value)} sx={{mb:1}} />
          </>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            placeholder="Type a message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <IconButton component="label" title="Attach files">
            <input hidden multiple type="file" onChange={(e) => setAttachments(Array.from(e.target.files))} />
            <PaperClipIcon className="w-5 h-5" />
          </IconButton>

          <Button variant="contained" endIcon={<PaperAirplaneIcon className="w-4 h-4" />} onClick={sendMessage}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}