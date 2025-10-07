// src/features/order/Routes.jsx
import React, { lazy } from "react";
import { Route } from "react-router-dom";

const OrderListPage = lazy(() => import("./pages/OrderListPage"));
const OrderCreatePage = lazy(() => import("./pages/OrderCreatePage"));
const OrderDetailsPage = lazy(() => import("./pages/OrderDetailsPage"));
const NotFound = lazy(() => import("@/components/common/NotFound"));

const orderRoutes = (
  <>
    <Route path="orders" element={<OrderListPage />} />
    <Route path="orders/create" element={<OrderCreatePage />} />
    <Route path="orders/:id" element={<OrderDetailsPage />} />
    <Route path="orders/*" element={<NotFound />} />
  </>
);

export default orderRoutes;
