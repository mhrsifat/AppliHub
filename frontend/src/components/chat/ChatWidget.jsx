import React, { useEffect, useState, useRef } from 'react';
import { Fab, Modal, Box, Typography, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ChatWindow from './ChatWindow';
import 'tailwindcss/tailwind.css';

export default function ChatWidget({ apiBase }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50"
      >
        <ChatIcon />
      </Fab>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 80,
            width: { xs: '95%', sm: 420 },
            height: { xs: '70%', sm: 600 },
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
            <Typography variant="subtitle1">Chat with Support</Typography>
            <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
          </Box>
          <ChatWindow apiBase={apiBase} onClose={() => setOpen(false)} />
        </Box>
      </Modal>
    </>
  );
}
