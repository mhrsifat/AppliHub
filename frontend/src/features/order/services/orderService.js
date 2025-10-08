import api from '@/services/api';

export const fetchOrdersApi = ({ page = 1, per_page = 15, q = '' } = {}) =>
  api.get('/orders', { params: { page, per_page, q } });
export const fetchOrderApi = (id) => api.get(`/orders/${id}`);
export const createOrderApi = (payload) => api.post('/orders', payload);
export const updateOrderApi = (id, payload) => api.put(`/orders/${id}`, payload);
export const addOrderItemApi = (orderId, payload) =>
  api.post(`/orders/${orderId}/items`, payload);
export const updateOrderItemApi = (orderId, itemId, payload) =>
  api.put(`/orders/${orderId}/items/${itemId}`, payload);
export const deleteOrderItemApi = (orderId, itemId) =>
  api.delete(`/orders/${orderId}/items/${itemId}`);
export const createInvoiceFromOrderApi = (orderId) =>
  api.post(`/invoices/from-order/${orderId}`);
