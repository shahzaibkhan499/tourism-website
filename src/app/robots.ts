import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// ============================================================
// ROBOTS.TXT — public pages crawlable; auth/admin/API excluded.
// ============================================================
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
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
