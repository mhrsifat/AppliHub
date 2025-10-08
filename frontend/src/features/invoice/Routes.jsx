// src/features/invoice/Routes.jsx
import React, { lazy } from "react";
import { Route } from "react-router-dom";

// Lazy load pages for performance
const InvoiceListPage = lazy(() => import("./pages/InvoiceListPage"));
const InvoiceCreatePage = lazy(() => import("./pages/InvoiceCreatePage"));
const InvoiceDetailPage = lazy(() => import("./pages/InvoiceDetailPage"));

const invoiceRoutes = (
  <>
    <Route path="invoices" element={<InvoiceListPage />} />
    <Route path="invoices/create" element={<InvoiceCreatePage />} />
    <Route path="invoices/:id" element={<InvoiceDetailPage />} />
  </>
);

export default invoiceRoutes;