import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchInvoicesApi,
  fetchInvoiceApi,
  createInvoiceApi,
  updateInvoiceApi,
  addInvoiceItemApi,
  updateInvoiceItemApi,
  removeInvoiceItemApi,
  recordPaymentApi,
  refundApi,
  createInvoiceFromOrderApi,
} from "../services/invoiceService";

/**
 * Thunks (re-using your existing thunks pattern)
 */
export const fetchInvoices = createAsyncThunk(
  "invoice/fetchInvoices",
  async (params, { rejectWithValue }) => {
    try {
      const res = await fetchInvoicesApi(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchInvoice = createAsyncThunk(
  "invoice/fetchInvoice",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetchInvoiceApi(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createInvoice = createAsyncThunk(
  "invoice/createInvoice",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createInvoiceApi(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateInvoice = createAsyncThunk(
  "invoice/updateInvoice",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateInvoiceApi(id, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addInvoiceItem = createAsyncThunk(
  "invoice/addInvoiceItem",
  async ({ invoiceId, item }, { rejectWithValue }) => {
    try {
      const res = await addInvoiceItemApi(invoiceId, item);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateInvoiceItem = createAsyncThunk(
  "invoice/updateInvoiceItem",
  async ({ invoiceId, itemId, item }, { rejectWithValue }) => {
    try {
      const res = await updateInvoiceItemApi(invoiceId, itemId, item);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const removeInvoiceItem = createAsyncThunk(
  "invoice/removeInvoiceItem",
  async ({ invoiceId, itemId }, { rejectWithValue }) => {
    try {
      const res = await removeInvoiceItemApi(invoiceId, itemId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const recordPayment = createAsyncThunk(
  "invoice/recordPayment",
  async ({ invoiceId, payment }, { rejectWithValue }) => {
    try {
      const res = await recordPaymentApi(invoiceId, payment);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const refund = createAsyncThunk(
  "invoice/refund",
  async ({ invoiceId, payload }, { rejectWithValue }) => {
    try {
      const res = await refundApi(invoiceId, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createFromOrder = createAsyncThunk(
  "invoice/createFromOrder",
  async ({ orderId, payload = {} }, { rejectWithValue }) => {
    try {
      const res = await createInvoiceFromOrderApi(orderId, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Entity adapter for invoices
 */
const invoicesAdapter = createEntityAdapter({
  selectId: (inv) => inv.id,
  sortComparer: (a, b) => b.id - a.id,
});

/**
 * Initial state
 */
const initialState = invoicesAdapter.getInitialState({
  meta: null, // pagination meta (object)
  loadingList: false, // list loading flag
  loadingCurrent: false, // single invoice loading flag
  saving: false, // create/update/add-item etc.
  error: null,
  currentId: null,
});

const invoiceSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {
    clearCurrent(state) {
      state.currentId = null;
      state.error = null;
    },
    setCurrent(state, action) {
      state.currentId = action.payload ?? null;
    },
    // optimistic helpers if you want to use them
    upsertInvoiceLocal(state, action) {
      invoicesAdapter.upsertOne(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchInvoices.pending, (s) => {
        s.loadingList = true;
        s.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (s, a) => {
        s.loadingList = false;
        const payload = a.payload;
        if (Array.isArray(payload)) {
          invoicesAdapter.setAll(
            s,
            payload.map((p) => p?.data ?? p)
          );
          s.meta = null;
        } else if (payload && payload.data) {
          const items = Array.isArray(payload.data)
            ? payload.data.map((p) => p?.data ?? p)
            : [payload.data?.data ?? payload.data];
          invoicesAdapter.setAll(s, items);
          s.meta = payload.meta ?? null;
        } else {
          const item = payload?.data ?? payload;
          invoicesAdapter.setAll(s, [item?.data ?? item]);
          s.meta = null;
        }
      })
      .addCase(fetchInvoices.rejected, (s, a) => {
        s.loadingList = false;
        s.error = a.payload || a.error;
      })

      // Fetch single
      .addCase(fetchInvoice.pending, (s) => {
        s.loadingCurrent = true;
        s.error = null;
      })
      .addCase(fetchInvoice.fulfilled, (s, a) => {
        s.loadingCurrent = false;
        const inv = a.payload?.invoice ?? a.payload?.data ?? a.payload;
        if (inv) {
          invoicesAdapter.upsertOne(s, inv);
          s.currentId = inv.id;
        }
      })
      .addCase(fetchInvoice.rejected, (s, a) => {
        s.loadingCurrent = false;
        s.error = a.payload || a.error;
      })

      // Create
      .addCase(createInvoice.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(createInvoice.fulfilled, (s, a) => {
        s.saving = false;
        const inv = a.payload?.invoice ?? a.payload?.data ?? a.payload;
        if (inv) {
          invoicesAdapter.addOne(s, inv);
          s.currentId = inv.id;
        }
      })
      .addCase(createInvoice.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })

      // Update
      .addCase(updateInvoice.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(updateInvoice.fulfilled, (s, a) => {
        s.saving = false;
        const inv = a.payload?.invoice ?? a.payload?.data ?? a.payload;
        if (inv) {
          invoicesAdapter.upsertOne(s, inv);
          if (s.currentId === inv.id) s.currentId = inv.id; // ensure current points to fresh
        }
      })
      .addCase(updateInvoice.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })

      // Add / Update / Remove item -> server returns { item, invoice } in many implementations
      .addCase(addInvoiceItem.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(addInvoiceItem.fulfilled, (s, a) => {
        s.saving = false;
        const payload = a.payload;
        const inv = payload?.invoice ?? payload?.data ?? payload;
        if (inv && inv.id) {
          invoicesAdapter.upsertOne(s, inv);
          s.currentId = inv.id;
        }
      })
      .addCase(addInvoiceItem.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })

      .addCase(updateInvoiceItem.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(updateInvoiceItem.fulfilled, (s, a) => {
        s.saving = false;
        const payload = a.payload;
        const inv = payload?.invoice ?? payload?.data ?? payload;
        if (inv && inv.id) invoicesAdapter.upsertOne(s, inv);
      })
      .addCase(updateInvoiceItem.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })

      .addCase(removeInvoiceItem.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(removeInvoiceItem.fulfilled, (s, a) => {
        s.saving = false;
        const payload = a.payload;
        // some APIs return updated invoice, some return message. handle both.
        if (payload?.invoice) invoicesAdapter.upsertOne(s, payload.invoice);
        else if (payload?.id || payload?.itemId) {
          // no-op for inventory; we expect invoice recalc return
        }
      })
      .addCase(removeInvoiceItem.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })

      // Payment / Refund
      .addCase(recordPayment.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(recordPayment.fulfilled, (s, a) => {
        s.saving = false;
        const payload = a.payload;
        const inv = payload?.invoice ?? payload?.data ?? payload;
        if (inv) invoicesAdapter.upsertOne(s, inv);
      })
      .addCase(recordPayment.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })

      .addCase(refund.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(refund.fulfilled, (s, a) => {
        s.saving = false;
        const payload = a.payload;
        const inv = payload?.invoice ?? payload?.data ?? payload;
        if (inv) invoicesAdapter.upsertOne(s, inv);
      })
      .addCase(refund.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      })

      // Create from order
      .addCase(createFromOrder.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(createFromOrder.fulfilled, (s, a) => {
        s.saving = false;
        const inv = a.payload?.invoice ?? a.payload?.data ?? a.payload;
        if (inv) {
          invoicesAdapter.addOne(s, inv);
          s.currentId = inv.id;
        }
      })
      .addCase(createFromOrder.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload || a.error;
      });
  },
});

/**
 * Selectors & exports
 */
export const {
  selectAll: selectAllInvoices,
  selectById: selectInvoiceById,
  selectIds: selectInvoiceIds,
  selectEntities: selectInvoiceEntities,
  selectTotal: selectInvoiceTotal,
} = invoicesAdapter.getSelectors((state) => state.invoice);

export const selectInvoiceMeta = (state) => state.invoice.meta;
// memoized loading selector to return a stable reference
export const selectInvoiceLoading = createSelector(
  (state) => state.invoice.loadingList,
  (state) => state.invoice.loadingCurrent,
  (state) => state.invoice.saving,
  (list, current, saving) => ({ list, current, saving })
);
export const selectInvoiceError = (state) => state.invoice.error;
export const selectCurrentInvoiceId = (state) => state.invoice.currentId;
export const selectCurrentInvoice = (state) => {
  const id = state.invoice.currentId;
  return id ? selectInvoiceById(state, id) : null;
};

export const { clearCurrent, setCurrent, upsertInvoiceLocal } =
  invoiceSlice.actions;
export default invoiceSlice.reducer;
