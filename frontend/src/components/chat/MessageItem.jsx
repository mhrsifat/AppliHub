import React from 'react';
import { ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Link } from '@mui/material';

// Use heroicons for any small inline icon needs (optional)
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function MessageItem({ message }) {
  const isStaff = !!message.is_staff;

  return (
    <ListItem alignItems="flex-start" className={isStaff ? 'bg-gray-50' : ''}>
      <ListItemAvatar>
        <Avatar>{isStaff ? 'S' : (message.sender_name ? message.sender_name[0] : '?')}</Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Typography variant="subtitle2">{message.sender_name}</Typography>
            {isStaff && <Typography variant="caption" color="textSecondary">(Staff)</Typography>}
          </div>
        }
        secondary={
          <>
            <Typography component="span" variant="body2">{message.body}</Typography>
            {message.attachments && message.attachments.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {message.attachments.map(a => (
                  <div key={a.id}>
                    <Link href={a.url} target="_blank" rel="noreferrer">{a.filename}</Link>
                  </div>
                ))}
              </div>
            )}
          </>
        }
      />
    </ListItem>
  );
}