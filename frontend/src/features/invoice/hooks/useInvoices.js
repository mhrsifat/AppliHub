// src/features/invoice/hooks/useInvoices.js
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInvoices, fetchInvoice, createInvoice, updateInvoice,
  addInvoiceItem, removeInvoiceItem, recordPayment, refundInvoice, clearCurrent
} from "../slices/invoiceSlice";
import { useEffect } from "react";

export default function useInvoices(autoFetch = false) {
  const dispatch = useDispatch();
  const { list, current, loading, error } = useSelector((s) => s.invoices);

  useEffect(() => {
    if (autoFetch) dispatch(fetchInvoices());
  }, [autoFetch, dispatch]);

  return {
    list,
    current,
    loading,
    error,
    fetchInvoices: (params) => dispatch(fetchInvoices(params)),
    fetchInvoice: (id) => dispatch(fetchInvoice(id)),
    createInvoice: (payload) => dispatch(createInvoice(payload)),
    updateInvoice: (id, payload) => dispatch(updateInvoice({ id, payload })),
    addInvoiceItem: (invoiceId, payload) => dispatch(addInvoiceItem({ invoiceId, payload })),
    removeInvoiceItem: (invoiceId, itemId) => dispatch(removeInvoiceItem({ invoiceId, itemId })),
    recordPayment: (invoiceId, payload) => dispatch(recordPayment({ invoiceId, payload })),
    refundInvoice: (invoiceId, payload) => dispatch(refundInvoice({ invoiceId, payload })),
    clearCurrent: () => dispatch(clearCurrent()),
  };
}
