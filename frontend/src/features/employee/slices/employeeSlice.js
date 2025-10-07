// src/features/employee/slices/employeeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import employeeService from '../services/employeeService';

// Thunks
export const fetchEmployees = createAsyncThunk(
  'employee/fetchList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await employeeService.list(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employee/create',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await employeeService.create(formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employee/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await employeeService.update(id, formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employee/delete',
  async (id, { rejectWithValue }) => {
    try {
      await employeeService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const restoreEmployee = createAsyncThunk(
  'employee/restore',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.restore(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const forceDeleteEmployee = createAsyncThunk(
  'employee/forceDelete',
  async (id, { rejectWithValue }) => {
    try {
      await employeeService.forceDelete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Slice
const employeeSlice = createSlice({
  name: 'employee',
  initialState: {
    list: [],
    meta: { current_page: 1, last_page: 1, total: 0 },
    loading: false,
    error: null,
    item: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setItem(state, action) {
      state.item = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchEmployees
      .addCase(fetchEmployees.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (s, a) => {
        s.loading = false;
        const payload = a.payload;
        if (payload?.data) {
          s.list = payload.data;
          s.meta = payload.meta || {
            current_page: payload.current_page,
            last_page: payload.last_page,
            total: payload.total,
          };
        } else {
          s.list = Array.isArray(payload) ? payload : [];
          s.meta = { current_page: 1, last_page: 1, total: s.list.length };
        }
      })
      .addCase(fetchEmployees.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // createEmployee
      .addCase(createEmployee.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createEmployee.fulfilled, (s, a) => {
        s.loading = false;
        // backend may return created resource; ensure shape
        if (a.payload?.id) {
          s.list.unshift(a.payload);
        }
      })
      .addCase(createEmployee.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // updateEmployee
      .addCase(updateEmployee.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(updateEmployee.fulfilled, (s, a) => {
        s.loading = false;
        const idx = s.list.findIndex((i) => i.id === a.payload.id);
        if (idx >= 0) s.list[idx] = a.payload;
      })
      .addCase(updateEmployee.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // deleteEmployee
      .addCase(deleteEmployee.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (s, a) => {
        s.loading = false;
        const idx = s.list.findIndex((i) => i.id === a.payload);
        if (idx >= 0) s.list.splice(idx, 1);
      })
      .addCase(deleteEmployee.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // restoreEmployee
      .addCase(restoreEmployee.fulfilled, (s, a) => {
        const returned = a.payload;
        if (returned?.id) {
          const idx = s.list.findIndex((i) => i.id === returned.id);
          if (idx >= 0) s.list[idx] = returned;
          else s.list.unshift(returned);
        }
      })

      // forceDeleteEmployee
      .addCase(forceDeleteEmployee.fulfilled, (s, a) => {
        const idx = s.list.findIndex((i) => i.id === a.payload);
        if (idx >= 0) s.list.splice(idx, 1);
      });
  },
});

export const { clearError, setItem } = employeeSlice.actions;
export default employeeSlice.reducer;
