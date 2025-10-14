// filepath: src/features/dashboard/dashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

// Thunks (async actions)
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/stats/dashboard');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const fetchOrderStats = createAsyncThunk(
  'dashboard/fetchOrderStats',
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/stats/order/${orderId}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const fetchInvoiceDetails = createAsyncThunk(
  'dashboard/fetchInvoiceDetails',
  async (invoiceId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/stats/invoice/${invoiceId}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const fetchInvoicesReport = createAsyncThunk(
  'dashboard/fetchInvoicesReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/reports/invoices', { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  stats: null,            // dashboard stats
  order: null,            // order stats result
  invoice: null,          // invoice detail result
  report: null,           // invoices report result
};

const slice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardState(state) {
      state.loading = false;
      state.error = null;
      state.stats = null;
      state.order = null;
      state.invoice = null;
      state.report = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // dashboard
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // order
      .addCase(fetchOrderStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrderStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // invoice
      .addCase(fetchInvoiceDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.invoice = action.payload;
      })
      .addCase(fetchInvoiceDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // report
      .addCase(fetchInvoicesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoicesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.report = action.payload;
      })
      .addCase(fetchInvoicesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardState } = slice.actions;
export default slice.reducer;