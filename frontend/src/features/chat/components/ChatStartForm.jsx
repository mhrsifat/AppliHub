// filepath: src/features/chat/components/ChatStartForm.jsx
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const ChatStartForm = ({ onStart, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.message.trim()) {
      onStart(formData);
    }
  };

  const isFormValid = formData.name.trim() && formData.message.trim();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Support
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start a conversation with our team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email or Phone
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="Your contact information"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              disabled={isLoading}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none disabled:opacity-50"
              placeholder="How can we help you?"
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Starting Chat...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Start Chat</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatStartForm;