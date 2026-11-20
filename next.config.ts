import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/**
 * What the browser may load and where it may send data. Everything comes from
 * this site, except the live data and photos, which come from Convex.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js adds small inline scripts to start the page; dev also needs eval for fast refresh.
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.convex.cloud",
  "font-src 'self' data:",
  `connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site${dev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
  "media-src 'self' blob: https://*.convex.cloud",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Never let another site show this one in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let the browser guess a file's type from its contents.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites see only that a visitor came from here, never which page.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app never needs these devices.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Always use HTTPS from now on (only meaningful on the live site).
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
