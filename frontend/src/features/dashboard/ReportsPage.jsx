// src/features/dashboard/pages/ReportsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoicesReport } from './dashboardSlice';
import Loader from '@/components/common/Loader';

export default function ReportsPage() {
  const dispatch = useDispatch();
  const { report, loading } = useSelector(s => s.dashboard);
  const [filters, setFilters] = useState({ status: '', from_date: '', to_date: '' });

  const handleChange = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSearch = () => dispatch(fetchInvoicesReport(filters));

  useEffect(() => {
    dispatch(fetchInvoicesReport({}));
  }, [dispatch]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 items-end">
        <input type="date" name="from_date" value={filters.from_date} onChange={handleChange} className="input" />
        <input type="date" name="to_date" value={filters.to_date} onChange={handleChange} className="input" />
        <select name="status" value={filters.status} onChange={handleChange} className="input">
          <option value="">All</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="canceled">Canceled</option>
        </select>
        <button onClick={handleSearch} className="btn-primary">Filter</button>
      </div>

      {loading && <Loader size="medium" />}
      <table className="table-auto w-full bg-white dark:bg-gray-800 shadow rounded">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Order #</th>
            <th>Total</th>
            <th>Status</th>
            <th>Paid</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {report?.map(inv => (
            <tr key={inv.id} className="border-b">
              <td>{inv.invoice_number}</td>
              <td>{inv.order?.order_number}</td>
              <td>{inv.grand_total}</td>
              <td>{inv.status}</td>
              <td>{inv.payments.reduce((sum,p)=>sum+parseFloat(p.amount),0)}</td>
              <td>{inv.grand_total - inv.payments.reduce((sum,p)=>sum+parseFloat(p.amount),0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}