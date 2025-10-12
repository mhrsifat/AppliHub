// src/features/employee/components/SalaryForm.jsx
import React, { useState } from 'react';
import useEmployees from '../hooks/useEmployees';

export default function SalaryForm({ employeeId, onClose }) {
  const { onAddSalary } = useEmployees();
  const [form, setForm] = useState({
    base_salary: '',
    bonus: '',
    promotion_title: '',
    effective_from: '',
    paid_month: '',
    remarks: '',
    is_promotion: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // API accepts JSON body
      await onAddSalary(employeeId, form);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold">Add Salary / Promotion</h4>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        {error && <div className="mb-2 text-red-600">{JSON.stringify(error)}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="base_salary" placeholder="Base salary" value={form.base_salary} onChange={handleChange} className="w-full border p-2 rounded" required />
          <input name="bonus" placeholder="Bonus" value={form.bonus} onChange={handleChange} className="w-full border p-2 rounded" />
          <input name="promotion_title" placeholder="Promotion title (optional)" value={form.promotion_title} onChange={handleChange} className="w-full border p-2 rounded" />
          <input name="effective_from" type="date" value={form.effective_from} onChange={handleChange} className="w-full border p-2 rounded" />
          <input name="paid_month" placeholder="Paid month (e.g. October 2025)" value={form.paid_month} onChange={handleChange} className="w-full border p-2 rounded" />
          <textarea name="remarks" placeholder="Remarks" value={form.remarks} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="flex items-center gap-2">
            <input name="is_promotion" type="checkbox" checked={form.is_promotion} onChange={handleChange} />
            <span className="text-sm">Is Promotion (admin only)</span>
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
            <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}