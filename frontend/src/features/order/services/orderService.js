// src/features/order/services/orderService.js
import api from "@/services/api";

const base = "/orders";

export default {
  list(params) {
    return api.get(base, { params });
  },
  show(id) {
    return api.get(`${base}/${id}`);
  },
  create(data) {
    return api.post(base, data);
  },
  update(id, data) {
    return api.put(`${base}/${id}`, data);
  },
  destroy(id) {
    return api.delete(`${base}/${id}`);
  },
  addService(orderId, data) {
    return api.post(`${base}/${orderId}/items`, data);
  },
  removeService(orderId, itemId) {
    return api.delete(`${base}/${orderId}/items/${itemId}`);
  },
  pay(orderId, data) {
    return api.post(`${base}/${orderId}/payments`, data);
  },
};
