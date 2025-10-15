// filepath: src/features/dashboard/components/StatCard.jsx
import React from 'react';

/**
 * Props:
 *  - title: string
 *  - value: string | number
 *  - subtitle: string (optional)
 *  - children: optional icon element
 */
export default function StatCard({ title, value, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mr-4">
        {children}
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500 dark:text-gray-300">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
    </div>
  );
}