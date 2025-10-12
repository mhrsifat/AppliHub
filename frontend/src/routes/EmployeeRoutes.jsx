// src/routes/EmployeeRoutes.js
import React, { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import EmployeeSidebar from "../components/layout/EmployeeSidebar";
import EmployeeHeader from "../components/layout/EmployeeHeader";
import { Outlet } from "react-router-dom";

import OrderRoutes from "@/features/order/Routes";
import InvoiceRoutes from "@/features/invoice/Routes";
import ServiceRoutes from "@/features/service/Routes";

const Dashboard = lazy(() => import("../pages/employee/Dashboard"));
const Orders = lazy(() => import("../features/order/pages/OrderListPage"));
const Invoices = lazy(() => import("../features/invoice/pages/InvoiceListPage"));
const Messages = lazy(() => import("../pages/AdminConversations"));
const Reports = lazy(() => import("../pages/employee/Reports"));
const Settings = lazy(() => import("../pages/employee/Settings"));


function EmployeeLayout() {
  return (
    <div className="flex h-screen bg-background text-text dark:bg-background dark:text-text">
      <EmployeeSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <EmployeeHeader />
        <main className="flex-1 overflow-auto p-4">
          <Suspense fallback={<Loader size="medium"  />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function EmployeeRoutes() {
  return (
    <Routes>
      {/* parent path is "/" because this whole Routes is mounted at /employee/* in App.jsx */}
      <Route path="/" element={<EmployeeLayout />}>
        <Route index element={<Dashboard />} />
         {OrderRoutes}
         {InvoiceRoutes}
        <Route path="messages" element={<Messages />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        {/* add other child routes similarly */}
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Route>
    </Routes>
  );
}

