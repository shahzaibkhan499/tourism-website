"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

// ============================================================
// THEME APPLIER — keeps the site in its original LIGHT look by
// default. The `dark` class is applied ONLY when the user has
// explicitly chosen "Dark" in Settings > Theme. "system" and
// "light" both keep the site exactly as it looked before.
// ============================================================
function resolveDark(theme: "light" | "dark" | "system"): boolean {
  return theme === "dark";
}

export function ThemeApplier() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const dark = resolveDark(useAppStore.getState().theme);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [theme]);

  return null;
}
