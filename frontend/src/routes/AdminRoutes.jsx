// src/routes/AdminRoutes.jsx
import React, { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminHeader from "../components/layout/AdminHeader";
import { Outlet } from "react-router-dom";

import OrderRoutes from "@/features/order/Routes";
import InvoiceRoutes from "@/features/invoice/Routes";
import ServiceRoutes from "@/features/service/Routes";
import BlogRoutes from "@/features/blog/Routes";

const Dashboard = lazy(() => import("@/features/dashboard/DashboardRouter"));
const Employees = lazy(() => import("../features/employee/pages/EmployeeListPage"));
const Services = lazy(() => import("../features/service/pages/ServicesPage"));
const Orders = lazy(() => import("../features/order/pages/OrderListPage"));
const Invoices = lazy(() => import("../features/invoice/pages/InvoiceListPage"));
const Permissions = lazy(() => import("../pages/admin/Permissions"));
const Reports = lazy(() => import("../pages/admin/Reports"));
const Settings = lazy(() => import("../pages/admin/Settings"));

// Chat Admin Components
const AdminChat = lazy(() => import('../features/chat/pages/AdminChat'));
const AdminDashboard = lazy(() => import('../features/chat/pages/AdminDashboard'));

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

// Chat Layout for full-page chat interface
function ChatLayout() {
  return (
    <div className="h-screen bg-gray-50">
      <Suspense fallback={<Loader size="medium" />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Main admin routes with sidebar */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        {ServiceRoutes}
        {OrderRoutes}
        {InvoiceRoutes}
        {BlogRoutes}
        <Route path="messages" element={<Navigate to="/admin/chat" replace />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        {/* add other child routes similarly */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Full-page chat routes without sidebar */}
      <Route path="/chat" element={<ChatLayout />}>
        <Route index element={<AdminChat />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}