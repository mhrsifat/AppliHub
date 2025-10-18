// src/features/chat/components/StartConversation.jsx
import React, { useState } from 'react';

const StartConversation = ({ onCreateConversation, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: '',
    message: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    contact: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim()) {
      setTouched({ name: true, contact: true });
      return;
    }

    try {
      await onCreateConversation(formData);
    } catch (error) {
      // Error is handled in parent component
      console.error('Failed to create conversation:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const isNameValid = formData.name.trim().length > 0;
  const isContactValid = formData.contact.trim().length > 0;

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">How can we help you?</h3>
        <p className="text-gray-600 text-sm">
          Start a conversation with our support team. We're here to help!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
              touched.name && !isNameValid
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
          {touched.name && !isNameValid && (
            <p className="text-red-500 text-xs mt-1">Please enter your name</p>
          )}
        </div>

        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
            Phone or Email *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            required
            value={formData.contact}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
              touched.contact && !isContactValid
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Phone number or email address"
            disabled={isLoading}
          />
          {touched.contact && !isContactValid && (
            <p className="text-red-500 text-xs mt-1">Please enter your contact information</p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="What is this about?"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
            placeholder="How can we help you? Please provide as much detail as possible..."
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !isNameValid || !isContactValid}
          className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:shadow-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Starting Conversation...
            </div>
          ) : (
            'Start Conversation'
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>We typically respond within a few minutes during business hours</p>
      </div>
    </div>
  );
};

export default React.memo(StartConversation);