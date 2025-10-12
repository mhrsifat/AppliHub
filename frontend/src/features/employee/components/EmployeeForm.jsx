// src/features/employee/components/EmployeeForm.jsx
import React, { useEffect, useState } from 'react';
import useEmployees from '../hooks/useEmployees';

/**
 * EmployeeForm supports both create and update.
 * Pass `initial` prop to edit an existing employee.
 * onClose should be passed to close modal and refresh list.
 */
export default function EmployeeForm({ initial = null, onClose }) {
  const { onCreate, onUpdate } = useEmployees();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    full_address: '',
    status: 'active',
    role: 'staff',
    password: '',
    avatar: null,
  });
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (initial) {
      setForm({
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        email: initial.email || '',
        phone: initial.phone || '',
        location: initial.location || '',
        full_address: initial.full_address || '',
        status: initial.status || 'active',
        role: (initial.roles && initial.roles[0]) || 'staff',
        password: '',
        avatar: null,
      });
    }
  }, [initial]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((s) => ({ ...s, [name]: files[0] }));
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  };

  const toFormData = (obj) => {
    const fd = new FormData();
    Object.keys(obj).forEach((k) => {
      if (obj[k] === null || obj[k] === undefined) return;
      // password should not be sent empty when editing
      if (k === 'password' && obj[k] === '') return;
      // file
      fd.append(k, obj[k]);
    });
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors(null);

    try {
      const fd = toFormData(form);
      if (initial && initial.id) {
        await onUpdate(initial.id, fd);
      } else {
        await onCreate(fd);
      }
      onClose();
    } catch (err) {
      // err likely includes validation errors from backend
      setErrors(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-auto bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{initial ? 'Edit Employee' : 'Create Employee'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Close</button>
        </div>

        {errors && (
          <div className="mb-3 text-red-600">
            {typeof errors === 'string' ? errors : JSON.stringify(errors)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            name="first_name"
            placeholder="First name"
            value={form.first_name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            name="last_name"
            placeholder="Last name"
            value={form.last_name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
            required={!initial}
            disabled={!!initial}
          />
          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="full_address"
            placeholder="Full address"
            value={form.full_address}
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          />
          <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select name="role" value={form.role} onChange={handleChange} className="border p-2 rounded">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          {!initial && (
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="border p-2 rounded col-span-2"
            />
          )}

          <div className="col-span-2">
            <label className="block text-sm mb-1">Avatar (optional)</label>
            <input name="avatar" type="file" accept="image/*" onChange={handleChange} />
          </div>

          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}