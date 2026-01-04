"use client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ReactNode } from "react";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#111417",
      paper: "#111417",
    },
    text: {
      primary: "#ffffff",
    },
  },
});

interface ClientThemeProviderProps {
  children: ReactNode;
}

export default function ClientThemeProvider({
  children,
}: ClientThemeProviderProps) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
