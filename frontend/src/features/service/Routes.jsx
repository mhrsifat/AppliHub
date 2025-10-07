//src/features/service/Routes
import React, { lazy } from "react";
import { Route } from "react-router-dom";

const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ServiceCreatePage = lazy(() => import("./pages/ServiceCreatePage"));
const ServiceEditPage = lazy(() => import("./pages/ServiceEditPage"));
const ServiceDetailsPage = lazy(() => import("./pages/ServiceDetailsPage"));
const NotFound = lazy(() => import("@/components/common/NotFound"));

const serviceRoutes = (
  <>
    <Route path="services" element={<ServicesPage />} />
    <Route path="services/create" element={<ServiceCreatePage />} />
    <Route path="services/:id" element={<ServiceDetailsPage />} />
    <Route path="services/:id/edit" element={<ServiceEditPage />} />
    <Route path="services/*" element={<NotFound />} />
  </>
);

export default serviceRoutes;