// src/services/theme.js
import { createTheme } from "@mui/material/styles";
import { colorTokens } from "./colors";

export const getTheme = (mode = "light") =>
  createTheme({
    palette: {
      mode,
      primary: { main: colorTokens[mode].primary },
      secondary: { main: colorTokens[mode].secondary },
      background: {
        default: colorTokens[mode].background,
        paper: colorTokens[mode].surface,
      },
      text: {
        primary: colorTokens[mode].text,
        secondary: colorTokens[mode].mutedText, // muted text যোগ করা হলো
      },
      error: { main: colorTokens[mode].error },
      warning: { main: colorTokens[mode].warning },
      success: { main: colorTokens[mode].success },
      info: { main: colorTokens[mode].info },
      divider: colorTokens[mode].border, // border কে divider এ map করা
    },
    typography: {
      fontFamily: "Inter, Roboto, sans-serif",
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none", // Capital letter disable
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: `1px solid ${colorTokens[mode].border}`,
          },
        },
      },
    },
  });
