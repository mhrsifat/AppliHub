// src/components/layout/EmployeeLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import EmployeeSidebar from "./EmployeeSidebar";

export default function EmployeeLayout() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <EmployeeSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  );
}