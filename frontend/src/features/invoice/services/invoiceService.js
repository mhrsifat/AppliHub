import api from '../../../services/api';

export const fetchInvoicesApi = ({ page = 1, per_page = 15, order_id = null } = {}) =>
  api.get('/invoices', { params: { page, per_page, order_id } });

export const fetchInvoiceApi = (id) => api.get(`/invoices/${id}`);

export const createInvoiceApi = (payload) => api.post('/invoices', payload);

export const updateInvoiceApi = (id, payload) => api.put(`/invoices/${id}`, payload);

export const addInvoiceItemApi = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/items`, payload);

export const updateInvoiceItemApi = (invoiceId, itemId, payload) =>
  api.put(`/invoices/${invoiceId}/items/${itemId}`, payload);

export const removeInvoiceItemApi = (invoiceId, itemId) =>
  api.delete(`/invoices/${invoiceId}/items/${itemId}`);

export const recordPaymentApi = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/payments`, payload);

export const refundApi = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/refunds`, payload);

export const createFromOrderApi = (orderId) =>
  api.post(`/invoices/from-order/${orderId}`);
