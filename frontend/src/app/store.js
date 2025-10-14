import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/slices/authSlice";
import employeeReducer from "../features/employee/slices/employeeSlice";
import invoiceReducer from "../features/invoice/slices/invoiceSlice";
import orderReducer from "../features/order/slices/orderSlice";
import serviceReducer from "../features/service/slices/serviceSlice";
import blogsReducer from "../features/blog/slices/blogSlice";
import clientBlogsReducer from "../features/client/slices/clientBlogSlice";
import dashboardReducer from "../features/dashboard/dashboardReducer";

// Create store instance
export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    employee: employeeReducer,
    invoice: invoiceReducer,
    order: orderReducer,
    service: serviceReducer,
    blogs: blogsReducer,
    clientBlog: clientBlogsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // allow non-serializable items like cookies
    }),
});

export default store;
