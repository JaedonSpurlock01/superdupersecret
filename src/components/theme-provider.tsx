"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>("light");

  useEffect(() => {
    const theme = getInitialTheme();
    setCurrentTheme(theme);
    applyTheme(theme);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }, [currentTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ currentTheme, setTheme, toggleTheme }),
    [currentTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider />");
  return ctx;
}
