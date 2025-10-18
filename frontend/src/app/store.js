// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/slices/authSlice";
import employeeReducer from "../features/employee/slices/employeeSlice";
import invoiceReducer from "../features/invoice/slices/invoiceSlice";
import orderReducer from "../features/order/slices/orderSlice";
import serviceReducer from "../features/service/slices/serviceSlice";
import blogsReducer from "../features/blog/slices/blogSlice";
import clientBlogsReducer from "../features/client/slices/clientBlogSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import chatReducer from "../features/chat/slices/chatSlice";

// ✅ Unified Redux Store
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
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["chat/setUserInfo", "chat/setWidgetState"],
        ignoredPaths: ["chat.userInfo", "chat.widgetState"],
      },
    }),
});

export default store;
