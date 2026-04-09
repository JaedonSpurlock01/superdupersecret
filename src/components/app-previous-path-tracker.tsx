"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Session key for the last in-app route before the current one (SPA navigations only). */
export const APP_PREVIOUS_PATH_KEY = "__appPreviousPath";

function shouldPersistPreviousPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("/api/")) return false;
  return true;
}

/**
 * Records the previous pathname on each client-side route change so "back" UIs can
 * use {@link APP_PREVIOUS_PATH_KEY} instead of `history.back()` (which can hit OAuth redirects).
 */
export function AppPreviousPathTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const previous = prevPathRef.current;
    prevPathRef.current = pathname;

    // First paint in this document: drop any stale value from a prior session.
    if (previous === null) {
      try {
        sessionStorage.removeItem(APP_PREVIOUS_PATH_KEY);
      } catch {
        // ignore
      }
      return;
    }

    if (previous !== pathname && shouldPersistPreviousPath(previous)) {
      try {
        sessionStorage.setItem(APP_PREVIOUS_PATH_KEY, previous);
      } catch {
        // ignore quota / private mode
      }
    }
  }, [pathname]);

  return null;
}
