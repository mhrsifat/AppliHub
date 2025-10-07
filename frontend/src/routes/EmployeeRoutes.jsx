// src/routes/EmployeeRoutes.js
import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import EmployeeLayout from "../components/layout/EmployeeLayout";

const Dashboard = lazy(() => import("../pages/employee/Dashboard"));
const Salary = lazy(() => import("../pages/employee/Salary"));
const Orders = lazy(() => import("../pages/employee/Orders"));
const Invoices = lazy(() => import("../pages/employee/Invoices"));
const Notifications = lazy(() => import("../pages/employee/Notifications"));
const Reports = lazy(() => import("../pages/employee/Reports"));

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route path="/employee" element={<EmployeeLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="salary" element={<Salary />} />
        <Route path="orders" element={<Orders />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}