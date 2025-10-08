// src/app/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slices/authSlice';
import employeeReducer from '../features/employee/slices/employeeSlice';
import invoiceReducer from '../features/invoice/slices/invoiceSlice'; 
import orderReducer from '../features/order/slices/orderSlice'; 
import serviceReducer from '../features/service/slices/serviceSlice'; 

const rootReducer = combineReducers({
  auth: authReducer,
  employee: employeeReducer,
  invoice: invoiceReducer,
  order: orderReducer,
  service: serviceReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // allow non-serializable items like cookies
    }),
});

export default store;
