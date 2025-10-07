// src/features/order/slices/orderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import orderService from "../services/orderService";

export const fetchOrders = createAsyncThunk("orders/fetchAll", async (params) => {
  const res = await orderService.list(params);
  return res.data.data || res.data;
});

export const fetchOrder = createAsyncThunk("orders/fetchOne", async (id) => {
  const res = await orderService.show(id);
  return res.data;
});

export const createOrder = createAsyncThunk("orders/create", async (data) => {
  const res = await orderService.create(data);
  return res.data;
});

export const updateOrder = createAsyncThunk("orders/update", async ({ id, data }) => {
  const res = await orderService.update(id, data);
  return res.data;
});

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearOrder(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (s) => { s.loading = true; })
      .addCase(fetchOrders.fulfilled, (s, a) => {
        s.loading = false; s.list = a.payload;
      })
      .addCase(fetchOrders.rejected, (s, a) => {
        s.loading = false; s.error = a.error.message;
      })
      .addCase(fetchOrder.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createOrder.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateOrder.fulfilled, (s, a) => {
        const idx = s.list.findIndex((o) => o.id === a.payload.id);
        if (idx >= 0) s.list[idx] = a.payload;
        if (s.current?.id === a.payload.id) s.current = a.payload;
      });
  },
});

export const { clearOrder } = orderSlice.actions;
export default orderSlice.reducer;
