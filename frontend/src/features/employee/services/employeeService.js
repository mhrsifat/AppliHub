// src/features/employee/services/employeeService.js
import api from '../../../services/api';

const base = '/employees';

export default {
  list(params) {
    return api.get(base, { params });
  },

  show(id) {
    return api.get(`${base}/${id}`);
  },

  create(formData) {
    return api.post(base, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update(id, formData) {
    return api.put(`${base}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  remove(id) {
    return api.delete(`${base}/${id}`);
  },

  restore(id) {
    return api.post(`${base}/${id}/restore`);
  },

  forceDelete(id) {
    return api.delete(`${base}/${id}/force`);
  },
};
