// src/features/order/slices/orderSlice.js
import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import {
  fetchOrdersApi,
  fetchOrderApi,
  createOrderApi,
  updateOrderApi,
  addOrderItemApi,
  updateOrderItemApi,
  deleteOrderItemApi,
  createInvoiceFromOrderApi,
  assignOrderApi,
  unassignOrderApi,
} from "../services/orderService";

export const fetchOrders = createAsyncThunk(
  "order/fetchOrders",
  async (params, { rejectWithValue }) => {
    try {
      const res = await fetchOrdersApi(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchOrder = createAsyncThunk(
  "order/fetchOrder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetchOrderApi(id);
      const payload = res.data;
      return payload?.order ?? payload?.data ?? payload;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createOrderApi(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateOrder = createAsyncThunk(
  "order/updateOrder",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateOrderApi(id, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addOrderItem = createAsyncThunk(
  "order/addOrderItem",
  async ({ orderId, item }, { rejectWithValue }) => {
    try {
      const res = await addOrderItemApi(orderId, item);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateOrderItem = createAsyncThunk(
  "order/updateOrderItem",
  async ({ orderId, itemId, item }, { rejectWithValue }) => {
    try {
      const res = await updateOrderItemApi(orderId, itemId, item);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteOrderItem = createAsyncThunk(
  "order/deleteOrderItem",
  async ({ orderId, itemId }, { rejectWithValue }) => {
    try {
      const res = await deleteOrderItemApi(orderId, itemId);
      return { orderId, itemId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createInvoiceFromOrder = createAsyncThunk(
  "order/createInvoiceFromOrder",
  async ({ orderId, payload = {} }, { rejectWithValue }) => {
    try {
      const res = await createInvoiceFromOrderApi(orderId, payload);
      const p = res.data;
      return p?.invoice ?? p?.data ?? p;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const assignOrder = createAsyncThunk(
  "order/assignOrder",
  async (
    { orderId, employeeId, employeeType = "employee" },
    { rejectWithValue }
  ) => {
    try {
      const res = await assignOrderApi(orderId, {
        employee_id: employeeId,
        employee_type: employeeType,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const unassignOrder = createAsyncThunk(
  "order/unassignOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await unassignOrderApi(orderId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const ordersAdapter = createEntityAdapter({
  selectId: (o) => o.id,
  sortComparer: (a, b) => b.id - a.id,
});

const initialState = ordersAdapter.getInitialState({
  meta: null,
  loadingList: false,
  loadingCurrent: false,
  saving: false,
  error: null,
  currentId: null,
});

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrent(state) {
      state.currentId = null;
      state.error = null;
    },
    setCurrent(state, action) {
      state.currentId = action.payload ?? null;
    },
    upsertOrderLocal(state, action) {
      ordersAdapter.upsertOne(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (s) => {
        s.loadingList = true;
        s.error = null;
      })
      .addCase(fetchOrders.fulfilled, (s, a) => {
        s.loadingList = false;
        const payload = a.payload;
        if (Array.isArray(payload)) {
          ordersAdapter.setAll(s, payload.map((p) => p?.data ?? p));
          s.meta = null;
        } else if (payload && payload.data) {
          const items = Array.isArray(payload.data)
            ? payload.data.map((p) => p?.data ?? p)
            : [payload.data?.data ?? payload.data];
          ordersAdapter.setAll(s, items);
          s.meta = payload.meta ?? null;
        } else {
          const item = payload?.data ?? payload;
          ordersAdapter.setAll(s, [item?.data ?? item]);
          s.meta = null;
        }
      })
      .addCase(fetchOrders.rejected, (s, a) => {
        s.loadingList = false;
        s.error = a.payload || a.error;
      })
      .addCase(fetchOrder.pending, (s) => {
        s.loadingCurrent = true;
        s.error = null;
      })
      .addCase(fetchOrder.fulfilled, (s, a) => {
        s.loadingCurrent = false;
        const o = a.payload?.order ?? a.payload?.data ?? a.payload;
        if (o) {
          ordersAdapter.upsertOne(s, o);
          s.currentId = o.id;
        }
      })
      .addCase(fetchOrder.rejected, (s, a) => {
        s.loadingCurrent = false;
        s.error = a.payload || a.error;
      })
      .addCase(createOrder.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(createOrder.fulfilled, (s, a) => {
        s.saving = false;
        const o = a.payload?.order ?? a.payload?.data ?? a.payload;
        if (o) {
          ordersAdapter.addOne(s, o);
          s.currentId = o.id;
        }
      })
      .addCase(createOrder.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })
      .addCase(updateOrder.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(updateOrder.fulfilled, (s, a) => {
        s.saving = false;
        const o = a.payload?.order ?? a.payload?.data ?? a.payload;
        if (o) {
          ordersAdapter.upsertOne(s, o);
          if (s.currentId === o.id) s.currentId = o.id;
        }
      })
      .addCase(updateOrder.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })
      .addCase(addOrderItem.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(addOrderItem.fulfilled, (s, a) => {
        s.saving = false;
        const payload = a.payload;
        if (payload?.order) ordersAdapter.upsertOne(s, payload.order);
        if (payload?.data) {
          if (payload.data.order)
            ordersAdapter.upsertOne(s, payload.data.order);
          else if (payload.data.id) ordersAdapter.upsertOne(s, payload.data);
        }
      })
      .addCase(addOrderItem.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })
      .addCase(updateOrderItem.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(updateOrderItem.fulfilled, (s, a) => {
        s.saving = false;
        const payload = a.payload;
        if (payload?.order) ordersAdapter.upsertOne(s, payload.order);
        else if (payload?.data) {
          if (payload.data.order)
            ordersAdapter.upsertOne(s, payload.data.order);
          else if (payload.data.id) ordersAdapter.upsertOne(s, payload.data);
        }
      })
      .addCase(updateOrderItem.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })
      .addCase(deleteOrderItem.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(deleteOrderItem.fulfilled, (s, a) => {
        s.saving = false;
        if (a.payload?.data?.order)
          ordersAdapter.upsertOne(s, a.payload.data.order);
      })
      .addCase(deleteOrderItem.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })
      .addCase(createInvoiceFromOrder.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(createInvoiceFromOrder.fulfilled, (s, a) => {
        s.saving = false;
        const order = a.payload?.order ?? a.payload?.data ?? a.payload;
        if (order && order.id) ordersAdapter.upsertOne(s, order);
      })
      .addCase(createInvoiceFromOrder.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })
      .addCase(assignOrder.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(assignOrder.fulfilled, (s, a) => {
        s.saving = false;
        const o = a.payload?.order ?? a.payload;
        if (o) {
          ordersAdapter.upsertOne(s, o);
          s.currentId = o.id;
        }
      })
      .addCase(assignOrder.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })
      .addCase(unassignOrder.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(unassignOrder.fulfilled, (s, a) => {
        s.saving = false;
        const o = a.payload?.order ?? a.payload;
        if (o) {
          ordersAdapter.upsertOne(s, o);
          s.currentId = o.id;
        }
      })
      .addCase(unassignOrder.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      });
  },
});

export const {
  selectAll: selectAllOrders,
  selectById: selectOrderById,
  selectIds: selectOrderIds,
  selectEntities: selectOrderEntities,
  selectTotal: selectOrderTotal,
} = ordersAdapter.getSelectors((state) => state.order);

export const selectOrderMeta = (state) => state.order.meta;
export const selectOrderLoading = createSelector(
  (state) => state.order.loadingList,
  (state) => state.order.loadingCurrent,
  (state) => state.order.saving,
  (list, current, saving) => ({ list, current, saving })
);
export const selectOrderError = (state) => state.order.error;
export const selectCurrentOrderId = (state) => state.order.currentId;
export const selectCurrentOrder = createSelector(
  selectCurrentOrderId,
  (state) => state.order,
  (id, orderState) => {
    return id ? orderState.entities?.[id] ?? null : null;
  }
);

export const { clearCurrent, setCurrent, upsertOrderLocal } =
  orderSlice.actions;
export default orderSlice.reducer;