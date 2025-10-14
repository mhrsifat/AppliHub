import React, { useState } from 'react';
import { Fab, Modal, Box, Typography, IconButton } from '@mui/material';
import 'tailwindcss/tailwind.css';

// Heroicons
import { ChatBubbleLeftEllipsisIcon, XMarkIcon } from '@heroicons/react/24/outline';

import ChatWindow from './ChatWindow';

export default function ChatWidget({ apiBase }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50"
        sx={{ width: 56, height: 56 }}
      >
        <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-white" />
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
            <IconButton onClick={() => setOpen(false)} size="small">
              <XMarkIcon className="w-5 h-5" />
            </IconButton>
          </Box>
          <ChatWindow apiBase={apiBase} onClose={() => setOpen(false)} />
        </Box>
      </Modal>
    </>
  );
}