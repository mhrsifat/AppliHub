// src/features/order/services/orderService.js
import api from '@/services/api';

/**
 * Fetch list of orders
 * @param {object} options { page, per_page, q }
 */
export const fetchOrdersApi = ({ page = 1, per_page = 15, q = '' } = {}) =>
  api.get('/orders', { params: { page, per_page, q } });

/**
 * Fetch single order
 */
export const fetchOrderApi = (id) => api.get(`/orders/${id}`);

/**
 * Create a new order (auto-create invoice included)
 */
export const createOrderApi = (payload) => api.post('/orders', payload);

/**
 * Update order
 */
export const updateOrderApi = (id, payload) => api.put(`/orders/${id}`, payload);

/**
 * Delete order
 */
export const deleteOrderApi = (id) => api.delete(`/orders/${id}`);

/**
 * Add item to order
 */
export const addOrderItemApi = (orderId, payload) =>
  api.post(`/orders/${orderId}/items`, payload);

/**
 * Update item in order
 */
export const updateOrderItemApi = (orderId, itemId, payload) =>
  api.put(`/orders/${orderId}/items/${itemId}`, payload);

/**
 * Delete item from order
 */
export const deleteOrderItemApi = (orderId, itemId) =>
  api.delete(`/orders/${orderId}/items/${itemId}`);

/**
 * Create invoice from order
 */
export const createInvoiceFromOrderApi = (orderId, payload = {}) =>
  api.post(`/orders/${orderId}/invoices`, payload);

/**
 * Assign order to employee
 * payload: { employee_id: number }
 */
export const assignOrderApi = (orderId, payload) =>
  api.post(`/orders/${orderId}/assign`, payload);

/**
 * Unassign order
 */
export const unassignOrderApi = (orderId) =>
  api.post(`/orders/${orderId}/unassign`);