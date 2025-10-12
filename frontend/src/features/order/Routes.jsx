// src/features/order/Routes.jsx
import React, { lazy } from "react";
import { Route } from "react-router-dom";

// Lazy load pages for performance boost ⚡
const OrderListPage = lazy(() => import("./pages/OrderListPage"));
const OrderCreatePage = lazy(() => import("./pages/OrderCreatePage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));

const orderRoutes = (
  <>
    <Route path="orders" element={<OrderListPage />} />
    <Route path="orders/create" element={<OrderCreatePage />} />
    <Route path="orders/:id" element={<OrderDetailPage />} />
  </>
);

export default orderRoutes;