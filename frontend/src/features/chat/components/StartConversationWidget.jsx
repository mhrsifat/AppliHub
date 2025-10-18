// src/features/chat/components/StartConversationWidget.jsx
import React, { useState } from 'react';

const StartConversationWidget = ({ onCreateConversation, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim()) {
      alert('Please provide your name and contact information');
      return;
    }

    try {
      await onCreateConversation(formData);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">How can we help you?</h3>
        <p className="text-sm text-gray-600">
          Start a conversation with our support team
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="contact" className="block text-xs font-medium text-gray-700 mb-1">
            Phone or Email *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            required
            value={formData.contact}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Phone or email"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-xs font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="What is this about?"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            value={formData.message}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="How can we help you?"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Starting...
            </div>
          ) : (
            'Start Conversation'
          )}
        </button>
      </form>

      <div className="mt-3 text-center text-xs text-gray-500">
        <p>We typically respond within a few minutes</p>
      </div>
    </div>
  );
};

export default StartConversationWidget;