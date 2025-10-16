// filepath: src/features/chat/components/ChatWidgetPanel.jsx
import React, { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2, Send } from 'lucide-react';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import { useChat } from '../hooks/useChat';
import chatService from '../services/chatService';

const ChatWidgetPanel = ({ isMinimized, onToggleMinimize, onClose }) => {
  const [conversationUuid, setConversationUuid] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: '',
    message: ''
  });
  const [creating, setCreating] = useState(false);

  const { messages, loading, sending, error, typingUsers, sendMessage } = useChat(
    conversationUuid,
    userInfo
  );

  // Note: In production, you may want to persist conversation data
  // For now, conversation is maintained in memory during the session

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.contact.trim()) {
      alert('Please provide your name and contact information');
      return;
    }

    setCreating(true);
    try {
      const response = await chatService.createConversation({
        name: formData.name,
        contact: formData.contact,
        subject: formData.subject,
        message: formData.message
      });

      const uuid = response.data.uuid;
      const user = {
        name: formData.name,
        contact: formData.contact,
        isStaff: false
      };

      setConversationUuid(uuid);
      setUserInfo(user);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (messageData) => {
    await sendMessage({
      ...messageData,
      name: userInfo?.name,
      contact: userInfo?.contact
    });
  };

  return (
    <div
      className={`fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Chat Support</h3>
            <p className="text-xs opacity-90">We typically reply in minutes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <>
          {showForm ? (
            /* Welcome form */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Welcome!</h4>
                <p className="text-gray-600">Please provide your details to start chatting with us.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email or Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com or +1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Your message..."
                  />
                </div>

                <button
                  onClick={handleCreateConversation}
                  disabled={creating}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? 'Starting...' : 'Start Chat'}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Chat interface */
            <>
              <MessageList
                messages={messages}
                loading={loading}
                typingUsers={typingUsers}
                currentUserContact={userInfo?.contact}
              />

              <MessageComposer
                onSend={handleSendMessage}
                sending={sending}
                conversationId={conversationUuid}
                userName={userInfo?.name}
                placeholder="Type your message..."
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChatWidgetPanel;