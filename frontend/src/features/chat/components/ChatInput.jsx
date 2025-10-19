// filepath: src/features/chat/components/ChatInput.jsx
import React, { useState } from 'react';

const ChatInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  const handleSend = () => {
    if (!message.trim() && !file) return;
    onSend({ message, file });
    setMessage('');
    setFile(null);
  };

  return (
    <div className="border-t pt-4">
      {file && (
        <div className="mb-2 text-sm text-gray-600">
          Selected file: {file.name}
          <button
            className="ml-2 text-red-500"
            onClick={() => setFile(null)}
          >
            Remove
          </button>
        </div>
      )}
      <div className="flex items-center">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 mr-2"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input
          type="file"
          className="mr-2"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInput;