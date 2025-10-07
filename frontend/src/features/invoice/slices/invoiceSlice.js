// src/features/invoice/slices/invoiceSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import invoiceService from "../services/invoiceService";

export const fetchInvoices = createAsyncThunk("invoices/fetchAll", async (params = {}) => {
  const res = await invoiceService.list(params);
  return res.data.data || res.data;
});

export const fetchInvoice = createAsyncThunk("invoices/fetchOne", async (id) => {
  const res = await invoiceService.show(id);
  return res.data;
});

export const createInvoice = createAsyncThunk("invoices/create", async (payload) => {
  const res = await invoiceService.create(payload);
  return res.data;
});

export const updateInvoice = createAsyncThunk("invoices/update", async ({ id, payload }) => {
  const res = await invoiceService.update(id, payload);
  return res.data;
});

export const addInvoiceItem = createAsyncThunk("invoices/addItem", async ({ invoiceId, payload }) => {
  const res = await invoiceService.addItem(invoiceId, payload);
  return res.data;
});

export const removeInvoiceItem = createAsyncThunk("invoices/removeItem", async ({ invoiceId, itemId }) => {
  const res = await invoiceService.removeItem(invoiceId, itemId);
  return { invoiceId, itemId, data: res.data };
});

export const recordPayment = createAsyncThunk("invoices/recordPayment", async ({ invoiceId, payload }) => {
  const res = await invoiceService.recordPayment(invoiceId, payload);
  return res.data;
});

export const refundInvoice = createAsyncThunk("invoices/refund", async ({ invoiceId, payload }) => {
  const res = await invoiceService.refund(invoiceId, payload);
  return res.data;
});

const slice = createSlice({
  name: "invoices",
  initialState: {
    list: [],
    meta: null,
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchInvoices.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchInvoices.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })

      .addCase(fetchInvoice.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchInvoice.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchInvoice.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })

      .addCase(createInvoice.fulfilled, (s, a) => { s.list = [a.payload, ...s.list]; s.current = a.payload; })
      .addCase(updateInvoice.fulfilled, (s, a) => {
        s.current = a.payload;
        s.list = s.list.map((it) => (it.id === a.payload.id ? a.payload : it));
      })

      .addCase(addInvoiceItem.fulfilled, (s, a) => {
        if (a.payload.invoice) s.current = a.payload.invoice;
        else s.current = a.payload;
      })

      .addCase(removeInvoiceItem.fulfilled, (s, a) => {
        if (s.current && s.current.id === a.payload.invoiceId) {
          s.current.items = s.current.items.filter((it) => it.id !== a.payload.itemId);
        }
      })

      .addCase(recordPayment.fulfilled, (s, a) => {
        if (a.payload.invoice) s.current = a.payload.invoice;
        else if (s.current && s.current.payments) {
          s.current.payments = [...s.current.payments, a.payload.payment || a.payload];
        }
      })

      .addCase(refundInvoice.fulfilled, (s, a) => {
        if (a.payload.invoice) s.current = a.payload.invoice;
        else if (s.current && s.current.refunds) {
          s.current.refunds = [...(s.current.refunds || []), a.payload.refund || a.payload];
        }
      });
  },
});

export const { clearCurrent } = slice.actions;
export default slice.reducer;
