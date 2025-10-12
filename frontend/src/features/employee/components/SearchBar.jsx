// src/features/employee/components/SearchBar.jsx
import React, { useState } from 'react';

export default function SearchBar({ defaultValue = '', onSearch }) {
  const [q, setQ] = useState(defaultValue || '');

  const submit = (e) => {
    e.preventDefault();
    onSearch(q.trim());
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        className="border rounded p-2"
      />
      <button type="submit" className="px-3 py-1 border rounded">Search</button>
      <button
        type="button"
        onClick={() => {
          setQ('');
          onSearch('');
        }}
        className="px-3 py-1 border rounded"
      >
        Clear
      </button>
    </form>
  );
}