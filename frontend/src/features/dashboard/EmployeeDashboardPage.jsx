// filepath: src/features/dashboard/EmployeeDashboardPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from './dashboardSlice';
import StatCard from './components/StatCard';
import RecentInvoices from './components/RecentInvoices';

export default function EmployeeDashboardPage() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((s) => s.dashboard);
  const auth = useSelector((s) => s.auth);
  const { employee } = auth || {};

  useEffect(() => {
    if (!employee) return;
    // employee sees subset — reuse same endpoint but render less
    dispatch(fetchDashboardStats());
  }, [dispatch, employee]);

  const handleOpenInvoice = (inv) => {
    // open invoice — maybe navigate
    console.log('open invoice', inv.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employee Dashboard</h1>
        <div className="text-sm text-gray-500">Welcome, Employee</div>
      </div>

      {loading && <div className="p-4 bg-yellow-50 rounded">Loading...</div>}
      {error && <div className="p-4 bg-red-50 rounded">Error: {error.message || JSON.stringify(error)}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Revenue (completed)" value={stats.total_revenue} />
            <StatCard title="Open Invoices" value={stats.unpaid_invoices_count} subtitle="Requires attention" />
            <StatCard title="Recent Refunds" value={stats.total_refunds} />
          </div>

          <div className="mt-4">
            <RecentInvoices invoices={stats.recent_invoices || []} onOpen={handleOpenInvoice} />
          </div>
        </>
      )}
    </div>
  );
}