// src/features/chat/routes/AdminRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminChat from '../pages/AdminChat';
import AdminDashboard from '../pages/AdminDashboard';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/chat" element={<AdminChat />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
};

export default AdminRoutes;