"use client";

import { useEffect } from "react";

/**
 * Client-side JSON-LD injection for dynamic (client-rendered) pages.
 * Mounts/updates a <script type="application/ld+json" id={id}> in <head>.
 */
export function useInjectJsonLd(id: string, data: Record<string, unknown> | null | undefined) {
  useEffect(() => {
    if (!data) return;
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
    return () => {
      const node = document.getElementById(id);
      if (node) node.remove();
    };
  }, [id, data]);
}
