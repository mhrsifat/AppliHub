// src/features/chat/components/AdminChatHeader.jsx
import React from 'react';

const AdminChatHeader = ({ 
  onRefresh, 
  autoRefresh, 
  onAutoRefreshChange, 
  conversationCount 
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage customer conversations and provide support
            </p>
          </div>
          
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">
              {conversationCount} Active
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-refresh</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Support Agent</div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              SA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatHeader;