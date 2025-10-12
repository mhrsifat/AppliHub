// src/features/employee/components/EmployeeDetailsModal.jsx
import React, { useEffect, useState } from 'react';
import useEmployees from '../hooks/useEmployees';
import SalaryForm from './SalaryForm';

export default function EmployeeDetailsModal({ employee, onClose }) {
  const { onListSalaries, salaries = {}, clearErrors } = useEmployees();
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await onListSalaries(employee.id, { paid_month: undefined });
      } catch (err) {
        setMessage(err?.message || 'Failed loading salary history');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  const empSalaries = salaries[employee.id] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-auto bg-black/40">
      <div className="w-full max-w-3xl bg-white rounded shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold">Employee Details</h3>
            <div className="text-sm text-gray-600">{employee.first_name} {employee.last_name}</div>
          </div>
          <div>
            <button onClick={onClose} className="text-gray-600">Close</button>
          </div>
        </div>

        {message && <div className="mb-3 text-red-600">{message}</div>}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Phone:</strong> {employee.phone}</p>
            <p><strong>Location:</strong> {employee.location}</p>
            <p><strong>Address:</strong> {employee.full_address}</p>
            <p><strong>Status:</strong> {employee.status}</p>
            <p><strong>Roles:</strong> {employee.roles?.join(', ')}</p>
          </div>

          <div>
            <img
              src={employee.avatar ? `/storage/${employee.avatar}` : `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}`}
              alt="avatar"
              className="w-32 h-32 rounded object-cover"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Salary History</h4>
          <button onClick={() => { setShowSalaryForm(true); clearErrors(); }} className="px-3 py-1 bg-green-600 text-white rounded">Add Salary / Promotion</button>
        </div>

        <div className="space-y-3">
          {empSalaries.length === 0 && <div className="text-gray-500">No salary records found.</div>}
          {empSalaries.map((s) => (
            <div key={s.id} className="border p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{s.promotion_title || 'Salary'}</div>
                <div className="text-sm text-gray-600">{s.paid_month} • Effective: {s.effective_from}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Base: {s.base_salary}</div>
                <div className="text-sm">Bonus: {s.bonus}</div>
              </div>
            </div>
          ))}
        </div>

        {showSalaryForm && (
          <SalaryForm
            employeeId={employee.id}
            onClose={() => {
              setShowSalaryForm(false);
              onListSalaries(employee.id, {});
            }}
          />
        )}
      </div>
    </div>
  );
}