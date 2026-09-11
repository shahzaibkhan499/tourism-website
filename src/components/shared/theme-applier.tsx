"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

// ============================================================
// THEME APPLIER — syncs the app theme (light/dark/system)
// from the persisted app store onto <html>, toggling the
// Tailwind `dark` class used across all pages (incl. tree SVG).
// ============================================================
function resolveDark(theme: "light" | "dark" | "system"): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

export function ThemeApplier() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const apply = () => {
      const dark = resolveDark(useAppStore.getState().theme);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, [theme]);

  return null;
}
