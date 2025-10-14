// filepath: src/features/dashboard/DashboardRouter.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import AdminDashboardPage from './AdminDashboardPage';
import EmployeeDashboardPage from './EmployeeDashboardPage';

export default function DashboardRouter() {
  const { admin, employee } = useSelector((s) => s.auth || {});

  if (admin) return <AdminDashboardPage />;
  if (employee) return <EmployeeDashboardPage />;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="text-gray-500">You do not have a dashboard role assigned.</p>
    </div>
  );
}