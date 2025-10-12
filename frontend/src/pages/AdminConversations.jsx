import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, Badge, Button } from '@mui/material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

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
      <Button onClick={fetch}>Refresh</Button>
      <List>
        {conversations.map(c => (
          <ListItem key={c.id} button onClick={()=>nav(`/admin/chat/${c.id}`)}>
            <ListItemText primary={c.subject || c.created_by_name} secondary={`${c.last_message_preview || ''} • ${c.last_message_at || ''}`} />
            <Badge badgeContent={c.messages_count || 0} color="primary" />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
