// filepath: src/features/chat/components/AdminComponent.jsx
import React from 'react';
import AdminPage from '../pages/AdminPage';

/**
 * AdminComponent - Staff/Admin chat interface
 * 
 * Usage:
 * import { AdminComponent } from '@/features/chat';
 * import { ProtectedRoute } from '@/components/auth';
 * 
 * function StaffDashboard() {
 *   return (
 *     <ProtectedRoute roles={['admin', 'staff']}>
 *       <AdminComponent />
 *     </ProtectedRoute>
 *   );
 * }
 */
const AdminComponent = () => {
  return <AdminPage />;
};

export default AdminComponent;