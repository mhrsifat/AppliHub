// serviceApi.js
import api from "../../../services/api";

const BASE = "/admin/services";

export default {
  async list(params) {
    const res = await api.get(BASE, { params });
    return res.data;
  },
  async show(id) {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  },
  async create(payload) {
    const config =
      payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
    const res = await api.post(BASE, payload, config);
    return res.data;
  },
  async update(id, payload) {
    const config =
      payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
    const res = await api.put(`${BASE}/${id}`, payload, config);
    return res.data;
  },
  async remove(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  },
  async import(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post(`${BASE}/import`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  exportCsv() {
    return api.get(`${BASE}/export`, { responseType: "blob" });
  },
  async priceHistory(id) {
    const res = await api.get(`${BASE}/${id}/price-history`);
    return res.data;
  },
  async restore(id) {
    const res = await api.post(`${BASE}/${id}/restore`);
    return res.data;
  },
};
