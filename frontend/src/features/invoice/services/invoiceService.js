// src/features/invoice/services/invoiceService.js
import api from '@/services/api';

/**
 * Fetch invoices list
 */
export const fetchInvoicesApi = ({ page = 1, per_page = 15, order_id = null } = {}) =>
  api.get('/invoices', { params: { page, per_page, order_id } });

/**
 * Fetch single invoice
 */
export const fetchInvoiceApi = (id) => api.get(`/invoices/${id}`);

/**
 * Create invoice (standalone, not from order)
 */
export const createInvoiceApi = (payload) => api.post('/invoices', payload);

/**
 * Update invoice
 */
export const updateInvoiceApi = (id, payload) => api.put(`/invoices/${id}`, payload);

/**
 * Add item to invoice
 */
export const addInvoiceItemApi = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/items`, payload);

/**
 * Update invoice item
 */
export const updateInvoiceItemApi = (invoiceId, itemId, payload) =>
  api.put(`/invoices/${invoiceId}/items/${itemId}`, payload);

/**
 * Delete invoice item
 */
export const removeInvoiceItemApi = (invoiceId, itemId) =>
  api.delete(`/invoices/${invoiceId}/items/${itemId}`);

/**
 * Record payment for invoice
 */
export const recordPaymentApi = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/payments`, payload);

/**
 * Refund payment for invoice
 */
export const refundApi = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/refunds`, payload);

/**
 * Create invoice from order
 * Payload optional: items array, vat_percent, coupon_discount
 */
export const createInvoiceFromOrderApi = (orderId, payload = {}) =>
  api.post(`/invoices/${orderId}/invoices`, payload);