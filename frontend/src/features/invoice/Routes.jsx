// src/features/invoice/Routes.jsx
import React, { lazy } from "react";
import { Route } from "react-router-dom";

// Lazy load pages for performance
const InvoiceListPage = lazy(() => import("./pages/InvoiceListPage"));
const InvoiceCreatePage = lazy(() => import("./pages/InvoiceCreatePage"));
const InvoiceDetailPage = lazy(() => import("./pages/InvoiceDetailPage"));
const InvoiceEditPage = lazy(() => import("./pages/InvoiceEditPage"));
const InvoiceQuickPayPage = lazy(() => import("./pages/InvoiceQuickPayPage"));

const invoiceRoutes = (
  <>
    <Route path="invoices" element={<InvoiceListPage />} />
    <Route path="invoices/create" element={<InvoiceCreatePage />} />
    <Route path="invoices/:id" element={<InvoiceDetailPage />} />
    <Route path="invoices/:id/edit" element={<InvoiceEditPage />} />
    <Route path="invoices/:id/quick-pay" element={<InvoiceQuickPayPage />} />
  </>
);

export default invoiceRoutes;