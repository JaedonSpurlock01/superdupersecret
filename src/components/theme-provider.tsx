"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { primeSpaceAudio } from "@/lib/space-audio";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  /** The theme on screen. Always "dark" while space mode is on. */
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Hidden space background (see SpaceMode). Not persisted. */
  space: boolean;
  toggleSpace: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyClasses(theme: Theme, space: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark" || space);
  root.classList.toggle("space-mode", space);
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;

  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return prefersDark ? "dark" : "light";
}

// Crossfade between themes where the browser supports it (see globals.css).
function withViewTransition(apply: () => void) {
  if (!document.startViewTransition) {
    apply();
    return;
  }
  const transition = document.startViewTransition(() => flushSync(apply));
  // Toggling again mid-crossfade skips the first one; that's expected.
  transition.ready.catch(() => {});
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Fixed initial value so server and first client render match (avoids hydration mismatch).
  // The inline script in layout sets <html class="dark"> before paint; useEffect syncs React state.
  const [theme, setThemeState] = useState<Theme>("light");
  const [space, setSpace] = useState(false);

  useLayoutEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    applyClasses(initial, false);
  }, []);

  // Picking a theme always leaves space mode.
  const setTheme = useCallback((next: Theme) => {
    withViewTransition(() => {
      setThemeState(next);
      setSpace(false);
      applyClasses(next, false);
      localStorage.setItem("theme", next);
    });
  }, []);

  const currentTheme: Theme = space ? "dark" : theme;

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }, [currentTheme, setTheme]);

  const toggleSpace = useCallback(() => {
    // Browsers only unlock audio inside the user's click or key press, so
    // this can't wait for SpaceMode to mount.
    if (!space) primeSpaceAudio();
    withViewTransition(() => {
      const next = !space;
      setSpace(next);
      applyClasses(theme, next);
    });
  }, [space, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ currentTheme, setTheme, toggleTheme, space, toggleSpace }),
    [currentTheme, setTheme, toggleTheme, space, toggleSpace],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider />");
  return ctx;
}
