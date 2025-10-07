// src/context/DarkModeProvider.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import DarkModeContext from "./DarkModeContext";

const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // load saved preference (runs only on client)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("darkMode");
      if (saved !== null) {
        // use explicit check / parse
        setDarkMode(saved === "dark" || saved === "true");
      }
    } catch (e) {
      // ignore localStorage errors (privacy mode, etc.)
      console.warn("localStorage not available", e);
    }
  }, []);

  // apply theme to <html> and persist
  useEffect(() => {
    const root = typeof document !== "undefined" ? document.documentElement : null;
    if (root) {
      root.classList.toggle("dark", darkMode);
    }
    try {
      // store as string 'dark'/'light' for clarity
      localStorage.setItem("darkMode", darkMode ? "dark" : "light");
    } catch (e) {
      // ignore persist errors
      console.error("localStorage not available", e);
    }
  }, [darkMode]);

  // stable toggle function (useCallback -> memoized function)
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  // memoize value object so consumers only re-render when actual values change
  const value = useMemo(
    () => ({ darkMode, toggleDarkMode }),
    [darkMode, toggleDarkMode]
  );

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

export default DarkModeProvider;
