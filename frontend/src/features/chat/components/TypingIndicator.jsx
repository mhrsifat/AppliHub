// src/features/chat/components/TypingIndicator.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const TypingIndicator = () => {
  const { typingUsers } = useSelector(state => state.chat);
  const [visibleUsers, setVisibleUsers] = useState([]);

  // Filter out typing users that haven't updated in the last 4 seconds
  useEffect(() => {
    const now = Date.now();
    const activeUsers = typingUsers.filter(user => now - user.timestamp < 4000);
    setVisibleUsers(activeUsers);
  }, [typingUsers]);

  if (visibleUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-3 px-4 py-3 bg-blue-50 rounded-2xl mx-4 mb-4 border border-blue-100">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <div className="text-sm text-blue-700 font-medium">
        {visibleUsers.map(user => 
          user.isStaff ? `${user.userName} (Support)` : user.userName
        ).join(', ')} 
        {visibleUsers.length === 1 ? ' is' : ' are'} typing...
      </div>
    </div>
  );
};

export default React.memo(TypingIndicator);