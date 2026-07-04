import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const realtime = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";
const realtimeWs = realtime.replace(/^http/, "ws");

/**
 * CSP funcional. `unsafe-inline` em script/style é necessário sem infra de nonce
 * (Next injeta scripts inline; Tailwind usa estilos inline) — hardening futuro:
 * CSP baseada em nonce. As demais diretivas já restringem origem de imagens,
 * conexões (realtime), frames e afins.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.r2.dev https://*.cloudflarestorage.com",
  "font-src 'self' data:",
  "media-src 'self' https: blob:",
  `connect-src 'self' ${realtime} ${realtimeWs}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  transpilePackages: [
    "@inkvision/ai",
    "@inkvision/core",
    "@inkvision/db",
    "@inkvision/infra",
    "@inkvision/shared",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
