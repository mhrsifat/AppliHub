// src/features/auth/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  admin: null,
  employee: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setEmployee: (state, action) => {
      state.employee = action.payload;
      state.isAuthenticated = true;
    },
    setAdmin: (state, action) => {
      state.admin = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.employee = null;
      state.admin = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, setEmployee, setAdmin, clearUser } = authSlice.actions;
export default authSlice.reducer;