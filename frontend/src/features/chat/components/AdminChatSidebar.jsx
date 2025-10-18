// src/features/chat/components/AdminChatSidebar.jsx
import React from 'react';

const AdminChatSidebar = ({ isOpen, onToggle, filters, onFiltersChange, onClearFilters }) => {
  const statusOptions = [
    { value: 'all', label: 'All Conversations', count: 0 },
    { value: 'open', label: 'Open', count: 0 },
    { value: 'closed', label: 'Closed', count: 0 }
  ];

  const assignedOptions = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'assigned', label: 'Assigned', count: 0 },
    { value: 'unassigned', label: 'Unassigned', count: 0 }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  const hasActiveFilters = filters.status !== 'all' || filters.search || filters.dateRange !== 'today' || filters.assigned !== 'all';

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-0 overflow-hidden'
    } flex flex-col`}>
      
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 z-10"
      >
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="mb-4">
            <button
              onClick={onClearFilters}
              className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Search Conversations
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Search by name, email, or message..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-200 mb-3">
            Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, status: option.value })}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  filters.status === option.value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{option.label}</span>
                  {option.count > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      filters.status === option.value
                        ? 'bg-blue-400 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {option.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assignment Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-200 mb-3">
            Assignment
          </label>
          <div className="space-y-2">
            {assignedOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, assigned: option.value })}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  filters.assigned === option.value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{option.label}</span>
                  {option.count > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      filters.assigned === option.value
                        ? 'bg-blue-400 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {option.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-200 mb-3">
            Date Range
          </label>
          <div className="space-y-2">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, dateRange: option.value })}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  filters.dateRange === option.value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-200 mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Response Time</span>
              <span className="text-sm font-medium text-green-400">2m 34s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Satisfaction</span>
              <span className="text-sm font-medium text-green-400">94%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Active Chats</span>
              <span className="text-sm font-medium text-blue-400">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatSidebar;