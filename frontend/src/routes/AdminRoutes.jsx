import React, { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminHeader from "../components/layout/AdminHeader";
import { Outlet } from "react-router-dom";

import OrderRoutes from "@/features/order/Routes";
import InvoiceRoutes from "@/features/invoice/Routes";
import ServiceRoutes from "@/features/service/Routes";

const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const Employees = lazy(() => import("../features/employee/pages/EmployeesPage"));
const Services = lazy(() => import("../features/service/pages/ServicesPage"));
const Orders = lazy(() => import("../features/order/pages/OrderListPage"));
const Invoices = lazy(() => import("../features/invoice/pages/InvoiceListPage"));
const Messages = lazy(() => import("../pages/admin/Messages"));
const Permissions = lazy(() => import("../pages/admin/Permissions"));
const Reports = lazy(() => import("../pages/admin/Reports"));
const Settings = lazy(() => import("../pages/admin/Settings"));


function AdminLayout() {
  return (
    <div className="flex h-screen bg-background text-text dark:bg-background dark:text-text">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-4">
          <Suspense fallback={<Loader size="medium"  />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Routes>
      {/* parent path is "/" because this whole Routes is mounted at /admin/* in App.jsx */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
         {ServiceRoutes}
         {OrderRoutes}
         {InvoiceRoutes}
        <Route path="messages" element={<Messages />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        {/* add other child routes similarly */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
