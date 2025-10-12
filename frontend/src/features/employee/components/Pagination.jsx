// src/features/employee/components/Pagination.jsx
import React from 'react';

export default function Pagination({ current = 1, last = 1, onPage = () => {} }) {
  if (last <= 1) return null;

  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(last, current + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onPage(1)} disabled={current === 1} className="px-3 py-1 border rounded">First</button>
      <button onClick={() => onPage(current - 1)} disabled={current === 1} className="px-3 py-1 border rounded">Prev</button>

      {start > 1 && <span className="px-2">...</span>}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`px-3 py-1 border rounded ${p === current ? 'bg-gray-200' : ''}`}
        >
          {p}
        </button>
      ))}

      {end < last && <span className="px-2">...</span>}

      <button onClick={() => onPage(current + 1)} disabled={current === last} className="px-3 py-1 border rounded">Next</button>
      <button onClick={() => onPage(last)} disabled={current === last} className="px-3 py-1 border rounded">Last</button>
    </div>
  );
}