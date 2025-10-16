// filepath: src/features/chat/components/ChatWidget.jsx
import React, { useState } from 'react';
import ChatWidgetButton from './ChatWidgetButton';
import ChatWidgetPanel from './ChatWidgetPanel';

const ChatWidget = ({ unreadCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Widget button */}
      <ChatWidgetButton
        isOpen={isOpen}
        onClick={handleToggle}
        unreadCount={unreadCount}
      />

      {/* Widget panel */}
      {isOpen && (
        <ChatWidgetPanel
          isMinimized={isMinimized}
          onToggleMinimize={handleToggleMinimize}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default ChatWidget;