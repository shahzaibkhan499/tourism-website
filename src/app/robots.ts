import type { MetadataRoute } from "next";

// ============================================================
// ROBOTS.TXT — public pages crawlable; auth/admin/API excluded.
// ============================================================
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/forgot-password", "/reset-password", "/public/"],
        disallow: ["/admin/", "/api/", "/dashboard", "/settings", "/profile", "/tree", "/notifications"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
