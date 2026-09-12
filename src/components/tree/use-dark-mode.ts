"use client";

import { useEffect, useState } from "react";

// ============================================================
// DARK MODE HOOK — observes the app's `dark` class on <html>
// (tailwind darkMode: ["class"]) and returns the current mode.
// ============================================================

export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const check = () => setDark(root.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

/** Colors for SVG-based tree rendering, light/dark variants. */
export const TREE_THEME = {
  light: {
    canvasBg: "#fafafa",
    dot: "#e5e7eb",
    nodeFill: "#ffffff",
    nameFill: "#111827",
    dateFill: "#6b7280",
    genBadgeFill: "#f3f4f6",
    genBadgeText: "#4b5563",
    deceasedCircle: "#f3f4f6",
  },
  dark: {
    canvasBg: "#030712",
    dot: "#1e293b",
    nodeFill: "#111827",
    nameFill: "#e5e7eb",
    dateFill: "#9ca3af",
    genBadgeFill: "#1f2937",
    genBadgeText: "#d1d5db",
    deceasedCircle: "#1f2937",
  },
};
