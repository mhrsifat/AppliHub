// src/features/invoice/Routes
import React, { lazy } from "react";
import { Route } from "react-router-dom";

const InvoiceListPage = lazy(() => import("./pages/InvoiceListPage"));
const InvoiceCreatePage = lazy(() => import("./pages/InvoiceCreatePage"));
const InvoiceDetailsPage = lazy(() => import("./pages/InvoiceDetailsPage"));
const NotFound = lazy(() => import("@/components/common/NotFound"));

const InvoiceRoutes = (
  <>
    <Route path="invoices" element={<InvoiceListPage />} />
    <Route path="invoices/create" element={<InvoiceCreatePage />} />
    <Route path="invoices/:id" element={<InvoiceDetailsPage />} />
    <Route path="invoices/*" element={<NotFound />} />
  </>
);

export default InvoiceRoutes;