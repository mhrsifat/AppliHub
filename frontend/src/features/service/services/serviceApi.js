// serviceApi.js
import api from '../../../services/api';

const BASE = '/admin/services';

export default {
  list(params) {
    return api.get(BASE, { params }).then(res => res.data);
  },
  show(id) {
    return api.get(`${BASE}/${id}`).then(res => res.data);
  },
  create(payload) {
    return api.post(BASE, payload).then(res => res.data);
  },
  update(id, payload) {
    return api.put(`${BASE}/${id}`, payload).then(res => res.data);
  },
  remove(id) {
    return api.delete(`${BASE}/${id}`).then(res => res.data);
  },
  import(file) {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`${BASE}/import`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  exportCsv() {
    return api.get(`${BASE}/export`, { responseType: 'blob' });
  },
  priceHistory(id) {
    return api.get(`${BASE}/${id}/price-history`).then(res => res.data);
  },
  restore(id) {
    return api.post(`${BASE}/${id}/restore`).then(res => res.data);
  }
};
