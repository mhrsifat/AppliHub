// src/features/order/services/orderService.js
import api from '@/services/api';

export const fetchOrdersApi = ({ page = 1, per_page = 15, q = '' } = {}) =>
  api.get('/orders', { params: { page, per_page, q } });

export const fetchOrderApi = (id) => api.get(`/orders/${id}`);
export const createOrderApi = (payload) => api.post('/orders', payload);


export const updateOrderApi = (id, payload) => api.put(`/orders/${id}`, payload);
export const deleteOrderApi = (id) => api.delete(`/orders/${id}`);
export const addOrderItemApi = (orderId, payload) =>
  api.post(`/orders/${orderId}/items`, payload);
export const updateOrderItemApi = (orderId, itemId, payload) =>
  api.put(`/orders/${orderId}/items/${itemId}`, payload);
export const deleteOrderItemApi = (orderId, itemId) =>
  api.delete(`/orders/${orderId}/items/${itemId}`);
export const createInvoiceFromOrderApi = (orderId, payload = {}) =>
  api.post(`/orders/${orderId}/invoices`, payload);

 
export const assignOrderApi = (orderId, payload) =>
  api.post(`/orders/${orderId}/assign`, payload);

// Unassign order
export const unassignOrderApi = (orderId) =>
  api.post(`/orders/${orderId}/unassign`);
  
  
export const changeStatus = (orderId, status) =>
  api.post(`/orders/${orderId}/status`, status);
  