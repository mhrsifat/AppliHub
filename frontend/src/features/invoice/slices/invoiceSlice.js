import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchInvoicesApi, fetchInvoiceApi, createInvoiceApi, updateInvoiceApi,
  addInvoiceItemApi, updateInvoiceItemApi, removeInvoiceItemApi,
  recordPaymentApi, refundApi, createFromOrderApi
} from '../services/invoiceService';

export const fetchInvoices = createAsyncThunk('invoice/fetchInvoices', async (params, { rejectWithValue }) => {
  try { const res = await fetchInvoicesApi(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const fetchInvoice = createAsyncThunk('invoice/fetchInvoice', async (id, { rejectWithValue }) => {
  try { const res = await fetchInvoiceApi(id); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const createInvoice = createAsyncThunk('invoice/createInvoice', async (payload, { rejectWithValue }) => {
  try { const res = await createInvoiceApi(payload); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const updateInvoice = createAsyncThunk('invoice/updateInvoice', async ({ id, payload }, { rejectWithValue }) => {
  try { const res = await updateInvoiceApi(id, payload); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const addInvoiceItem = createAsyncThunk('invoice/addInvoiceItem', async ({ invoiceId, item }, { rejectWithValue }) => {
  try { const res = await addInvoiceItemApi(invoiceId, item); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const updateInvoiceItem = createAsyncThunk('invoice/updateInvoiceItem', async ({ invoiceId, itemId, item }, { rejectWithValue }) => {
  try { const res = await updateInvoiceItemApi(invoiceId, itemId, item); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const removeInvoiceItem = createAsyncThunk('invoice/removeInvoiceItem', async ({ invoiceId, itemId }, { rejectWithValue }) => {
  try { const res = await removeInvoiceItemApi(invoiceId, itemId); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const recordPayment = createAsyncThunk('invoice/recordPayment', async ({ invoiceId, payment }, { rejectWithValue }) => {
  try { const res = await recordPaymentApi(invoiceId, payment); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const refund = createAsyncThunk('invoice/refund', async ({ invoiceId, payload }, { rejectWithValue }) => {
  try { const res = await refundApi(invoiceId, payload); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const createFromOrder = createAsyncThunk('invoice/createFromOrder', async (orderId, { rejectWithValue }) => {
  try { const res = await createFromOrderApi(orderId); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

const initialState = { list: [], meta: null, loading: false, error: null, current: null };

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: { clearCurrent: (s) => { s.current = null; s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchInvoices.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchInvoices.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data || a.payload; s.meta = a.payload.meta || null; })
     .addCase(fetchInvoices.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error; })
     .addCase(fetchInvoice.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
     .addCase(createInvoice.fulfilled, (s, a) => { const inv = a.payload.invoice ?? a.payload; if (inv) { s.list.unshift(inv); s.current = inv; } })
     .addCase(updateInvoice.fulfilled, (s, a) => { const u = a.payload; s.list = s.list.map(i => i.id === u.id ? u : i); if (s.current?.id === u.id) s.current = u; });
  }
});

export const { clearCurrent } = invoiceSlice.actions;
export default invoiceSlice.reducer;
