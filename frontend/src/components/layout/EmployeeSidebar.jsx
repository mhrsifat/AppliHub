// src/components/layout/EmployeeSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BellIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { name: "Dashboard", path: "/employee", icon: HomeIcon },
  { name: "Salary", path: "/employee/salary", icon: CurrencyDollarIcon },
  { name: "Orders", path: "/employee/orders", icon: ClipboardDocumentListIcon },
  { name: "Invoices", path: "/employee/invoices", icon: DocumentTextIcon },
  { name: "Notifications", path: "/employee/notifications", icon: BellIcon },
  { name: "Reports", path: "/employee/reports", icon: ChartBarIcon },
];

export default function EmployeeSidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-900 h-screen shadow-lg fixed">
      <div className="px-4 py-6 text-xl font-semibold text-primary">Employee</div>
      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors 
              ${isActive ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}