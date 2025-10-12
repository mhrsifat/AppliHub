import React, { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import api from '../services/api';
import ChatWindow from '../components/chat/ChatWindow';
import { useParams } from 'react-router-dom';

export default function AdminConversationView() {
  const { id } = useParams();
  const [conv, setConv] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await api.get(`/message/conversations/${id}`);
      setConv(res.data.data || res.data);
    };
    fetch();
  }, [id]);

  if (!conv) return <div>Loading...</div>;

  return (
    <Box>
      <h2>{conv.subject || conv.created_by_name}</h2>
      <ChatWindow apiBase={process.env.VITE_API_BASE} />
    </Box>
  );
}
