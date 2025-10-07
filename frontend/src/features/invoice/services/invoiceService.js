// src/features/invoice/services/invoiceService.js
import api from "@/services/api";

const base = "/invoices";

export default {
  list(params) {
    return api.get(base, { params });
  },
  show(id) {
    return api.get(`${base}/${id}`);
  },
  create(payload) {
    return api.post(base, payload);
  },
  update(id, payload) {
    return api.put(`${base}/${id}`, payload);
  },
  addItem(invoiceId, payload) {
    return api.post(`${base}/${invoiceId}/items`, payload);
  },
  updateItem(invoiceId, itemId, payload) {
    return api.put(`${base}/${invoiceId}/items/${itemId}`, payload);
  },
  removeItem(invoiceId, itemId) {
    return api.delete(`${base}/${invoiceId}/items/${itemId}`);
  },
  recordPayment(invoiceId, payload) {
    return api.post(`${base}/${invoiceId}/payments`, payload);
  },
  refund(invoiceId, payload) {
    return api.post(`${base}/${invoiceId}/refunds`, payload);
  },
  createFromOrder(orderId) {
    return api.post(`${base}/from-order/${orderId}`);
  },
};
