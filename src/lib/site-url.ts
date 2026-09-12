// ============================================================
// SITE URL RESOLVER — single source of truth for canonical/OG
// URLs across the app (metadata, sitemap, robots, emails).
// Handles polluted env values gracefully: extra quotes, stray
// notes ("← apna actual URL"), placeholder domains (XXXX /
// YOUR-PROJECT) are all rejected, and Vercel's auto-injected
// production URL is preferred when the env value is unusable.
// ============================================================

const PLACEHOLDER_HOST = /(XXXX|YOUR-PROJECT|your-project|example\.com|localhost)/i;

function extractUrl(raw: string | undefined): string {
  if (!raw) return "";
  // The env value may be wrapped in quotes or carry trailing notes —
  // pull out the first well-formed http(s) URL it contains.
  const match = raw.match(/https?:\/\/[^\s"'<>\u0600-\u06FF]+/);
  if (!match) return "";
  try {
    const u = new URL(match[0]);
    return u.origin;
  } catch {
    return "";
  }
}

export function getSiteUrl(): string {
  const fromEnv = extractUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv && !PLACEHOLDER_HOST.test(fromEnv)) {
    return fromEnv;
  }
  // Vercel injects these automatically at build/runtime — the real
  // production origin, immune to misconfigured NEXT_PUBLIC_APP_URL.
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd && !PLACEHOLDER_HOST.test(vercelProd)) {
    return `https://${vercelProd}`;
  }
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && !PLACEHOLDER_HOST.test(vercelUrl)) {
    return `https://${vercelUrl}`;
  }
  return "http://localhost:3000";
}
