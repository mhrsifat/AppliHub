// filepath: src/features/chat/pages/AdminChatDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchConversations,
  fetchConversationDetails,
  sendAdminReply,
  addAdminNote,
  deleteConversation,
  closeConversation,
} from '../slices/chatSlice';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';

const AdminChatDashboard = () => {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.admin.conversations);
  const selectedConversation = useSelector((state) => state.chat.admin.selectedConversation);

  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const handleSelectConversation = (conversationId) => {
    dispatch(fetchConversationDetails(conversationId));
  };

  const handleAdminSend = ({ message, file }) => {
    if (!selectedConversation) return;
    dispatch(sendAdminReply({ conversationId: selectedConversation.id, message, file }));
  };

  const handleAddNote = () => {
    if (!selectedConversation || !noteText.trim()) return;
    dispatch(addAdminNote({ conversationId: selectedConversation.id, note: noteText }));
    setNoteText('');
  };

  const handleDelete = () => {
    if (selectedConversation && window.confirm('Are you sure you want to delete this conversation?')) {
      dispatch(deleteConversation(selectedConversation.id));
    }
  };

  const handleClose = () => {
    if (selectedConversation && window.confirm('Are you sure you want to close this conversation?')) {
      dispatch(closeConversation(selectedConversation.id));
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-1/3 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        {conversations.length === 0 && <div>No conversations</div>}
        <ul>
          {conversations.map((conv) => (
            <li
              key={conv.id}
              className={`p-2 cursor-pointer hover:bg-gray-100 ${
                selectedConversation && conv.id === selectedConversation.id ? 'bg-gray-200' : ''
              }`}
              onClick={() => handleSelectConversation(conv.id)}
            >
              <div className="font-medium">{conv.name || 'Anonymous'} ({conv.email || conv.phone})</div>
              <div className="text-sm text-gray-600 truncate">
                {conv.lastMessage && `${conv.lastMessage.substring(0, 30)}...`}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Conversation Details */}
      <div className="flex-1 p-4">
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            <div>
              <h2 className="text-lg font-semibold">
                Conversation with {selectedConversation.name} ({selectedConversation.email || selectedConversation.phone})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto my-4">
              {selectedConversation.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} currentUser={selectedConversation.name} />
              ))}
            </div>
            <ChatInput onSend={handleAdminSend} />
            <div className="mt-4">
              <h3 className="font-semibold">Add Note</h3>
              <textarea
                className="w-full border rounded px-3 py-2 mb-2"
                rows="3"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button
                onClick={handleAddNote}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Add Note
              </button>
              <div className="mt-2">
                {selectedConversation.notes && selectedConversation.notes.map((note) => (
                  <div key={note.id} className="text-sm text-gray-700 mb-1">
                    - {note.note}{' '}
                    <span className="text-xs text-gray-500">
                      {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleClose}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Close Conversation
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete Conversation
              </button>
            </div>
          </div>
        ) : (
          <div>Select a conversation to view details</div>
        )}
      </div>
    </div>
  );
};

export default AdminChatDashboard;