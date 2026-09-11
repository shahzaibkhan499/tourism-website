import type { MetadataRoute } from "next";

// ============================================================
// SITEMAP.XML — all public pages of the platform.
// Authenticated module pages are intentionally excluded.
// ============================================================
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();

  const publicPages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, freq: "daily" },
    { path: "/login", priority: 0.6, freq: "monthly" },
    { path: "/register", priority: 0.6, freq: "monthly" },
    { path: "/forgot-password", priority: 0.3, freq: "yearly" },
    { path: "/reset-password", priority: 0.3, freq: "yearly" },
  ];

  return publicPages.map((p) => ({
    url: `${siteUrl}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
