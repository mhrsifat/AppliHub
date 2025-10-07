// src/services/AppThemeProvider.jsx
import React, { useMemo } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "../services/theme";
import useDarkMode from "../hooks/useDarkMode";

export default function AppThemeProvider({ children }) {
  const { darkMode } = useDarkMode(); // use the context

  const theme = useMemo(() => getTheme(darkMode ? "dark" : "light"), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
