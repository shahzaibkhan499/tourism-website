"use client";

import { useEffect } from "react";
import { initAudioOnFirstInteraction } from "@/lib/audio";

// ============================================================
// AUDIO INITIALIZER — mounted once in the root layout.
// Unlocks the AudioContext on the first user interaction
// anywhere in the app (autoplay policy compliance).
// ============================================================
export function AudioInitializer() {
  useEffect(() => {
    initAudioOnFirstInteraction();
  }, []);

  return null;
}
