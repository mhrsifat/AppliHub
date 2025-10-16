// filepath: src/features/chat/pages/Page.jsx
import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import MessageList from '../components/MessageList';
import MessageComposer from '../components/MessageComposer';
import { useChat } from '../hooks/useChat';
import chatService from '../services/chatService';

const Page = () => {
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

  const { messages, loading, sending, error, typingUsers, sendMessage, loadMore, hasMore } = useChat(
    conversationUuid,
    userInfo
  );

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-600">
              We're here to help. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          {/* Main content card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {showForm ? (
              /* Welcome form */
              <div className="p-8 md:p-12">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Start a Conversation
                  </h2>
                  <p className="text-gray-600">
                    Fill in your details below to begin chatting with our team.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email or Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    onClick={handleCreateConversation}
                    disabled={creating}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {creating ? 'Starting conversation...' : 'Start Conversation'}
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Chat interface */
              <div className="flex flex-col h-[600px]">
                {/* Chat header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Chat with {userInfo?.name}</h2>
                      <p className="text-sm opacity-90">We typically reply within minutes</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <MessageList
                  messages={messages}
                  loading={loading}
                  typingUsers={typingUsers}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  currentUserContact={userInfo?.contact}
                />

                {/* Composer */}
                <MessageComposer
                  onSend={handleSendMessage}
                  sending={sending}
                  conversationId={conversationUuid}
                  userName={userInfo?.name}
                  placeholder="Type your message..."
                />
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Your privacy is important to us. All conversations are secure and confidential.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;