import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  BellIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

const navItems = [
  { name: "Dashboard", path: "/admin", icon: HomeIcon },
  { name: "Employees", path: "/admin/employees", icon: UsersIcon },
  { name: "Services", path: "/admin/services", icon: ClipboardDocumentListIcon },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCartIcon },
  { name: "Invoices", path: "/admin/invoices", icon: DocumentTextIcon },
  { name: "Messages", path: "/admin/messages", icon: BellIcon },
  { name: "Permissions", path: "/admin/permissions", icon: ShieldCheckIcon },
  { name: "Reports", path: "/admin/reports", icon: ChartBarIcon },
  { name: "Settings", path: "/admin/settings", icon: CogIcon },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebarCollapsed", collapsed ? "true" : "false");
    } catch {}
  }, [collapsed]);

  return (
    <aside
      aria-expanded={!collapsed}
      className={`${collapsed ? "w-20" : "w-64"} bg-background dark:bg-surface text-text h-screen shadow-md flex flex-col transition-all duration-300`}
    >
      {/* Top / Logo & Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border relative">
        {!collapsed && <span className="text-xl font-bold">Admin Panel</span>}

        {/* Improved Toggle button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
          title={collapsed ? "Open sidebar" : "Collapse sidebar"}
          className={`p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/50
            ${collapsed ? "rotate-180" : "rotate-0"}`}
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `relative group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150
               hover:bg-primary/10 dark:hover:bg-primary/20
               ${isActive ? "bg-primary/20 dark:bg-primary/30 font-semibold text-primary" : "text-muted-foreground"}`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}

            {/* Tooltip for collapsed mode */}
            {collapsed && (
              <span
                className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50"
                role="tooltip"
              >
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
