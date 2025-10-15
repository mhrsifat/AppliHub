// filepath: src/features/dashboard/components/RecentInvoices.jsx
import React from 'react';

export default function RecentInvoices({ invoices = [], onOpen }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Recent Invoices</h3>
        <span className="text-sm text-gray-500">{invoices.length}</span>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {invoices.map((inv) => (
          <li key={inv.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{inv.invoice_number}</div>
              <div className="text-sm text-gray-500">
                {new Date(inv.created_at).toLocaleString()} — {inv.status}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{inv.grand_total}</div>
              <button
                onClick={() => onOpen?.(inv)}
                className="mt-2 text-sm px-3 py-1 rounded bg-gray-100 dark:bg-gray-700"
              >
                View
              </button>
            </div>
          </li>
        ))}
        {invoices.length === 0 && <li className="py-3 text-gray-500">No invoices</li>}
      </ul>
    </div>
  );
}