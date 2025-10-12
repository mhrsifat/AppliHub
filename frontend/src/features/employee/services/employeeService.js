// src/features/employee/services/employeeService.js
import api from '../../../services/api';

const base = '/employees';

export default {
  // List employees with optional filters
  list(params) {
    return api.get(base, { params });
  },

  // Get single employee
  show(id) {
    return api.get(`${base}/${id}`);
  },

  // Create employee (Admin/Manager rules handled in backend)
  create(formData) {
    return api.post(base, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Update employee
  update(id, formData) {
    return api.put(`${base}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Soft delete employee
  remove(id) {
    return api.delete(`${base}/${id}`);
  },

  // Restore employee
  restore(id) {
    return api.post(`${base}/restore/${id}`);
  },

  // Hard delete employee
  forceDelete(id) {
    return api.delete(`${base}/force/${id}`);
  },

  // Add salary/promotion
  addSalary(id, payload) {
    return api.post(`${base}/${id}/salary`, payload);
  },

  // List salary history
  listSalaries(id, params) {
    return api.get(`${base}/${id}/salaries`, { params });
  },

  // Delete a salary record
  removeSalary(id, salaryId) {
    return api.delete(`${base}/${id}/salaries/${salaryId}`);
  },
};