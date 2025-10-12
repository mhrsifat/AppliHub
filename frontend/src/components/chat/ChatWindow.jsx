import React, { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { Box, TextField, IconButton, Button, List, ListItem, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachmentIcon from '@mui/icons-material/AttachFile';
import api, { setAccessToken } from '../../services/api'; // your api.js client
import MessageItem from './MessageItem';

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
    // when conversation set, load messages and subscribe
    if (!conversation) return;
    fetchMessages();

    if (window.Pusher && conversation.id) {
      if (pusherRef.current) pusherRef.current.disconnect();
      pusherRef.current = new Pusher(process.env.VITE_PUSHER_KEY, {
        cluster: process.env.VITE_PUSHER_CLUSTER,
        authEndpoint: `${apiBase}/broadcasting/auth`,
        auth: {
          params: { contact }, // anonymous subscribers include contact to be authorzied on server channel
        },
      });

      const channel = pusherRef.current.subscribe(`conversation.${conversation.id}`);
      channel.bind('App\\Events\\MessageSent', (data) => {
        // event payload uses 'message'
        if (data.message) {
          setMessages((m) => [...m, data.message]);
          scrollToBottom();
        }
      });

      // also bind simpler event if server sends no namespaced event name
      channel.bind('message', (data) => {
        if (data.message) {
          setMessages((m) => [...m, data.message]);
          scrollToBottom();
        }
      });

      return () => {
        pusherRef.current.unsubscribe(`conversation.${conversation.id}`);
        pusherRef.current.disconnect();
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

      setConversation(res.data.data || res.data);
      if (res.data.data && res.data.data.id) {
        // fetch messages shortly
        fetchMessagesForConversation(res.data.data.id);
      }
      setBody('');
      setAttachments([]);
    } catch (err) {
      console.error(err);
      alert('Unable to open conversation.');
    }
  };

  const sendMessage = async () => {
    if (!conversation) {
      // start new conversation
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
          <IconButton component="label">
            <input hidden multiple type="file" onChange={(e) => setAttachments(Array.from(e.target.files))} />
            <AttachmentIcon />
          </IconButton>
          <Button variant="contained" endIcon={<SendIcon />} onClick={sendMessage}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
