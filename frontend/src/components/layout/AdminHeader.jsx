import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { clearUser } from "../../features/auth/slices/authSlice";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/login");
  };

  return (
    <header className="h-16 bg-surface dark:bg-surface flex items-center justify-between px-4 shadow-sm">
      <h1 className="text-lg font-semibold">Welcome, Admin</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsDark((s) => !s)}
          aria-label="Toggle theme"
          className="p-2 rounded hover:bg-primary/10 dark:hover:bg-primary/20"
        >
          {!isDark ? (
            <MoonIcon className="w-5 h-5" />
          ) : (
            <SunIcon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
