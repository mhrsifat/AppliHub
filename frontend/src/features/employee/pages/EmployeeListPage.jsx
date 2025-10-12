// src/features/employee/pages/EmployeeListPage.jsx
import React, { useState } from 'react';
import useEmployees from '../hooks/useEmployees';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeRow from '../components/EmployeeRow';
import EmployeeDetailsModal from '../components/EmployeeDetailsModal';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';

export default function EmployeeListPage() {
  const {
    list = [],
    meta = {},
    loading,
    error,
    page,
    search,
    load,
    onSearch,
    onPage,
    onDelete,
    onRestore,
    onForceDelete,
    setSelectedItem,
  } = useEmployees(1, 12);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsFor, setDetailsFor] = useState(null);
  const [message, setMessage] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (employee) => {
    setEditing(employee);
    setShowForm(true);
  };

  const openDetails = (employee) => {
    setDetailsFor(employee);
    setShowDetails(true);
  };

  const handleDelete = async (id, hard = false) => {
    try {
      if (hard) {
        if (!window.confirm('Hard delete permanently?')) return;
        await onForceDelete(id);
        setMessage('Employee permanently deleted');
      } else {
        if (!window.confirm('Soft delete employee?')) return;
        await onDelete(id);
        setMessage('Employee soft-deleted');
      }
      load(page, search);
    } catch (err) {
      setMessage(err?.message || 'Delete failed');
    }
  };

  const handleRestore = async (id) => {
    try {
      await onRestore(id);
      setMessage('Employee restored');
      load(page, search);
    } catch (err) {
      setMessage(err?.message || 'Restore failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <div className="flex items-center gap-3">
          <SearchBar defaultValue={search} onSearch={(q) => onSearch(q)} />
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            + Create Employee
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded bg-amber-100 text-amber-800">{message}</div>
      )}

      {error && <div className="mb-4 text-red-600">{JSON.stringify(error)}</div>}

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Roles</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan="8" className="p-6 text-center text-gray-500">
                  No employees found
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="8" className="p-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {list.map((emp, idx) => (
              <EmployeeRow
                key={emp.id}
                index={(meta.current_page - 1) * (meta.per_page || 12) + idx + 1}
                employee={emp}
                onEdit={() => openEdit(emp)}
                onView={() => openDetails(emp)}
                onDelete={(hard) => handleDelete(emp.id, hard)}
                onRestore={() => handleRestore(emp.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <Pagination
          current={meta.current_page || 1}
          last={meta.last_page || 1}
          onPage={(p) => {
            onPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {showForm && (
        <EmployeeForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
            load(page, search);
          }}
        />
      )}

      {showDetails && detailsFor && (
        <EmployeeDetailsModal
          employee={detailsFor}
          onClose={() => {
            setShowDetails(false);
            setDetailsFor(null);
            load(page, search);
          }}
        />
      )}
    </div>
  );
}