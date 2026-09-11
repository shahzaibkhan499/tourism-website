/** @type {import('next').NextConfig} */

const securityHeaders = [
  // NOTE: X-Frame-Options and CSP frame-ancestors are intentionally NOT
  // restricted here so the app renders inside the Arena live-preview iframe
  // (and any local dev embedding). Re-add clickjacking protection per
  // deployment domain in production (R8).
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com; media-src 'self' data: blob: https://res.cloudinary.com; font-src 'self' data:; connect-src 'self' https://*.googleapis.com",
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  eslint: {
    // Lint is run separately in CI (npm run lint)
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
