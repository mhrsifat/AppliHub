// src/features/chat/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffChatServices } from '../services/staffChatServices';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, conversationsResponse] = await Promise.all([
        staffChatServices.getDashboardStats(),
        staffChatServices.getConversations({ per_page: 5 })
      ]);
      
      setStats(statsResponse.data);
      setRecentConversations(conversationsResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Dashboard</h1>
          <p className="text-gray-600">Overview of customer support performance and metrics</p>
        </div>
        <Link
          to="/admin/chat"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Go to Live Chat
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Open Conversations"
          value={stats?.open_conversations || 0}
          change="+12%"
          changeType="positive"
          icon="💬"
          link="/admin/chat"
        />
        <StatCard
          title="Avg Response Time"
          value={stats?.avg_response_time || '0m'}
          change="-5%"
          changeType="positive"
          icon="⏱️"
        />
        <StatCard
          title="Customer Satisfaction"
          value={stats?.satisfaction_rate || '0%'}
          change="+2%"
          changeType="positive"
          icon="⭐"
        />
        <StatCard
          title="First Contact Resolution"
          value={stats?.first_contact_resolution || '0%'}
          change="+3%"
          changeType="positive"
          icon="🎯"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Conversations</h3>
            <Link 
              to="/admin/chat" 
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentConversations.slice(0, 5).map(conversation => (
              <div key={conversation.uuid} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conversation.subject || 'No Subject'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.created_by_name} • {conversation.created_by_contact}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!conversation.assigned_to && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Unassigned
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(conversation.last_message_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/admin/chat"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Start Chatting</div>
                <div className="text-sm text-gray-500">Respond to customer messages</div>
              </div>
            </Link>
            
            <button className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">View Reports</div>
                <div className="text-sm text-gray-500">Analytics and performance</div>
              </div>
            </button>

            <button className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Manage Agents</div>
                <div className="text-sm text-gray-500">Team settings and permissions</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, changeType, icon, link }) => {
  const content = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        <span className={`text-sm font-medium ${
          changeType === 'positive' ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );

  if (link) {
    return (
      <Link to={link}>
        {content}
      </Link>
    );
  }

  return content;
};

export default AdminDashboard;