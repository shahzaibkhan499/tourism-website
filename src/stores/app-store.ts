"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  buzurgMode: boolean;
  kidsMode: boolean;
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large" | "xl";
  interfaceLanguage: "urdu" | "english";
  setBuzurgMode: (on: boolean) => void;
  setKidsMode: (on: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setFontSize: (size: "small" | "medium" | "large" | "xl") => void;
  setInterfaceLanguage: (lang: "urdu" | "english") => void;
  kidsPoints: number;
  addKidsPoints: (points: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      buzurgMode: false,
      kidsMode: false,
      theme: "system",
      fontSize: "medium",
      interfaceLanguage: "urdu",
      kidsPoints: 0,
      setBuzurgMode: (on) => set({ buzurgMode: on }),
      setKidsMode: (on) => set({ kidsMode: on }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setInterfaceLanguage: (interfaceLanguage) => set({ interfaceLanguage }),
      addKidsPoints: (points) => set((state) => ({ kidsPoints: state.kidsPoints + points })),
    }),
    { name: "dk-app-store" }
  )
);
