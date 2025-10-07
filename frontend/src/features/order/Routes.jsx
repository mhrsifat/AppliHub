// src/features/order/Routes.jsx
import React, { lazy } from "react";
import { Route } from "react-router-dom";

const OrderListPage = lazy(() => import("./pages/OrderListPage"));
const OrderCreatePage = lazy(() => import("./pages/OrderCreatePage"));
const OrderDetailsPage = lazy(() => import("./pages/OrderDetailsPage"));

const orderRoutes = [
  <Route key="order-list" path="orders" element={<OrderListPage />} />,
  <Route key="order-create" path="orders/create" element={<OrderCreatePage />} />,
  <Route key="order-details" path="orders/:id" element={<OrderDetailsPage />} />
];

export default orderRoutes;
