// filepath: src/features/dashboard/AdminDashboardPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, fetchInvoiceDetails } from './dashboardSlice';
import StatCard from './components/StatCard';
import RecentInvoices from './components/RecentInvoices';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((s) => s.dashboard);
  const auth = useSelector((s) => s.auth);
  const { admin } = auth || {};

  useEffect(() => {
    if (!admin) return;
    dispatch(fetchDashboardStats());
  }, [dispatch, admin]);

  const handleOpenInvoice = (inv) => {
    dispatch(fetchInvoiceDetails(inv.id));
    // You can open a modal or route to invoice details page
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">Welcome, Admin</div>
      </div>

      {loading && <div className="p-4 bg-yellow-50 rounded">Loading...</div>}
      {error && <div className="p-4 bg-red-50 rounded">Error: {error.message || JSON.stringify(error)}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={stats.total_revenue} subtitle="Completed payments">
              <CurrencyDollarIcon className="w-5 h-5" />
            </StatCard>

            <StatCard title="Total Refunds" value={stats.total_refunds} subtitle="All refunds" />

            <StatCard title="Total Invoices" value={stats.total_invoices} subtitle={`${stats.paid_invoices_count} paid`} />

            <StatCard title="Total Due" value={stats.total_due} subtitle="Outstanding across invoices" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2">
              {/* placeholder for monthly chart or table */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h3 className="font-medium mb-3">Monthly Revenue (last months)</h3>
                <ul className="text-sm space-y-2">
                  {stats.monthly_revenue?.map((m) => (
                    <li key={m.month} className="flex justify-between">
                      <span>{m.month}</span>
                      <span>{m.total}</span>
                    </li>
                  )) || <li>No data</li>}
                </ul>
              </div>
            </div>

            <RecentInvoices invoices={stats.recent_invoices || []} onOpen={handleOpenInvoice} />
          </div>
        </>
      )}
    </div>
  );
}