// src/features/employee/slices/employeeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import employeeService from '../services/employeeService';

// --- Async Thunks ---

// 1️⃣ Fetch employees with optional filters
export const fetchEmployees = createAsyncThunk(
  'employee/fetchEmployees',
  async (params, { rejectWithValue }) => {
    try {
      const res = await employeeService.list(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 2️⃣ Create employee
export const createEmployee = createAsyncThunk(
  'employee/createEmployee',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await employeeService.create(formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 3️⃣ Update employee
export const updateEmployee = createAsyncThunk(
  'employee/updateEmployee',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await employeeService.update(id, formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4️⃣ Delete employee (soft)
export const deleteEmployee = createAsyncThunk(
  'employee/deleteEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.remove(id);
      return { id, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 5️⃣ Restore employee
export const restoreEmployee = createAsyncThunk(
  'employee/restoreEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.restore(id);
      return { id, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 6️⃣ Force delete employee (hard delete)
export const forceDeleteEmployee = createAsyncThunk(
  'employee/forceDeleteEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeService.forceDelete(id);
      return { id, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 7️⃣ Add salary / promotion
export const addSalary = createAsyncThunk(
  'employee/addSalary',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await employeeService.addSalary(id, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 8️⃣ List salary history
export const listSalaries = createAsyncThunk(
  'employee/listSalaries',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const res = await employeeService.listSalaries(id, params);
      return { employeeId: id, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 9️⃣ Delete salary record
export const deleteSalary = createAsyncThunk(
  'employee/deleteSalary',
  async ({ id, salaryId }, { rejectWithValue }) => {
    try {
      const res = await employeeService.removeSalary(id, salaryId);
      return { id, salaryId, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// --- Slice ---
const employeeSlice = createSlice({
  name: 'employee',
  initialState: {
    list: [],
    meta: {},
    item: null,
    salaries: {},
    loading: false,
    error: null,
  },
  reducers: {
    setItem(state, action) {
      state.item = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch employees
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.meta = {
          current_page: action.payload.current_page,
          last_page: action.payload.last_page,
          per_page: action.payload.per_page,
          total: action.payload.total,
        };
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create employee
    builder
      .addCase(createEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload.employee);
      })
      .addCase(createEmployee.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // Update employee
    builder
      .addCase(updateEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.map((e) => (e.id === action.payload.employee.id ? action.payload.employee : e));
      })
      .addCase(updateEmployee.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // Delete employee
    builder
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.list = state.list.map((e) => (e.id === action.payload.id ? { ...e, status: 'inactive' } : e));
      });

    // Restore employee
    builder
      .addCase(restoreEmployee.fulfilled, (state, action) => {
        state.list = state.list.map((e) => (e.id === action.payload.id ? { ...e, status: 'active' } : e));
      });

    // Force delete employee
    builder
      .addCase(forceDeleteEmployee.fulfilled, (state, action) => {
        state.list = state.list.filter((e) => e.id !== action.payload.id);
      });

    // Add salary
    builder
      .addCase(addSalary.fulfilled, (state, action) => {
        const empId = action.payload.salary.employee_id;
        if (!state.salaries[empId]) state.salaries[empId] = [];
        state.salaries[empId].push(action.payload.salary);
      });

    // List salaries
    builder
      .addCase(listSalaries.fulfilled, (state, action) => {
        state.salaries[action.payload.employeeId] = action.payload.data;
      });

    // Delete salary
    builder
      .addCase(deleteSalary.fulfilled, (state, action) => {
        const empSalaries = state.salaries[action.payload.id] || [];
        state.salaries[action.payload.id] = empSalaries.filter(s => s.id !== action.payload.salaryId);
      });
  },
});

export const { setItem, clearError } = employeeSlice.actions;
export default employeeSlice.reducer;