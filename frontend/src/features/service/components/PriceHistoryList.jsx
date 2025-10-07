// PriceHistoryList.jsx
import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';

export default function PriceHistoryList({ histories = [] }) {
  if (!histories.length) return <Typography variant="body2">No price changes recorded.</Typography>;

  return (
    <List dense>
      {histories.map(h => (
        <ListItem key={h.id}>
          <ListItemText
            primary={`${h.old_price} → ${h.new_price}`}
            secondary={`${new Date(h.created_at).toLocaleString()} ${h.note ? ` — ${h.note}` : ''}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
