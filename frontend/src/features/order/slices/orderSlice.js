import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchOrdersApi, fetchOrderApi, createOrderApi, updateOrderApi,
  addOrderItemApi, updateOrderItemApi, deleteOrderItemApi, createInvoiceFromOrderApi
} from '../services/orderService';

export const fetchOrders = createAsyncThunk('order/fetchOrders', async (params, { rejectWithValue }) => {
  try { const res = await fetchOrdersApi(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const fetchOrder = createAsyncThunk('order/fetchOrder', async (id, { rejectWithValue }) => {
  try { const res = await fetchOrderApi(id); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const createOrder = createAsyncThunk('order/createOrder', async (payload, { rejectWithValue }) => {
  try { const res = await createOrderApi(payload); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const updateOrder = createAsyncThunk('order/updateOrder', async ({ id, payload }, { rejectWithValue }) => {
  try { const res = await updateOrderApi(id, payload); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const addOrderItem = createAsyncThunk('order/addOrderItem', async ({ orderId, item }, { rejectWithValue }) => {
  try { const res = await addOrderItemApi(orderId, item); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const updateOrderItem = createAsyncThunk('order/updateOrderItem', async ({ orderId, itemId, item }, { rejectWithValue }) => {
  try { const res = await updateOrderItemApi(orderId, itemId, item); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const deleteOrderItem = createAsyncThunk('order/deleteOrderItem', async ({ orderId, itemId }, { rejectWithValue }) => {
  try { const res = await deleteOrderItemApi(orderId, itemId); return { orderId, itemId, data: res.data }; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

export const createInvoiceFromOrder = createAsyncThunk('order/createInvoiceFromOrder', async (orderId, { rejectWithValue }) => {
  try { const res = await createInvoiceFromOrderApi(orderId); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data || err.message); }
});

const orderSlice = createSlice({
  name: 'order',
  initialState: { list: [], meta: null, loading: false, error: null, current: null },
  reducers: { clearCurrent: (s) => { s.current = null; s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchOrders.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchOrders.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data || a.payload; s.meta = a.payload.meta || null; })
     .addCase(fetchOrders.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error; })
     .addCase(fetchOrder.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
     .addCase(createOrder.fulfilled, (s, a) => { const o = a.payload.order ?? a.payload; if (o) { s.list.unshift(o); s.current = o; } })
     .addCase(updateOrder.fulfilled, (s, a) => { const u = a.payload; s.list = s.list.map(o => o.id === u.id ? u : o); if (s.current?.id === u.id) s.current = u; });
  }
});

export const { clearCurrent } = orderSlice.actions;
export default orderSlice.reducer;
