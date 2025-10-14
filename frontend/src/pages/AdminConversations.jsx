import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, Badge, Button } from '@mui/material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

export default function AdminConversations() {
  const [conversations, setConversations] = useState([]);
  const nav = useNavigate();

  const fetch = async () => {
    const res = await api.get('/message/conversations');
    setConversations(res.data.data || res.data);
  };

  useEffect(()=>{ fetch(); }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h3>Conversations</h3>
        <Button onClick={fetch} variant="outlined">Refresh</Button>
      </Box>

      <List>
        {conversations.map(c => (
          <ListItem key={c.id} button onClick={()=>nav(`/admin/chat/${c.id}`)}>
            <ListItemText
              primary={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                <span>{c.subject || c.created_by_name}</span>
              </div>}
              secondary={`${c.last_message_preview || ''} • ${c.last_message_at || ''}`}
            />
            <Badge badgeContent={c.messages_count || 0} color="primary" />
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 