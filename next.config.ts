import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Default build runs with `next start` (Hostinger, most Node hosts). Docker/self-contained
  // deploys set NEXT_OUTPUT=standalone and run `node .next/standalone/server.js`.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
  // PDF exports embed Geist (Turkish glyphs) from node_modules at runtime — make sure standalone ships it.
  outputFileTracingIncludes: {
    "/api/admin/exports": ["./node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf", "./node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf"],
    "/api/certificates/[code]": [
      "./node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf",
      "./node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf",
      "./public/logo.png",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "motion"],
    // Assignment uploads go through server actions (20 MB file limit + multipart overhead).
    serverActions: { bodySizeLimit: "21mb" },
    // Shared hosting (Hostinger/CloudLinux) caps processes per account: the default one-worker-per-CPU
    // static generation fails with "spawn EAGAIN". A single build worker stays under the limit.
    cpus: Number(process.env.NEXT_BUILD_CPUS) || 1,
    webpackBuildWorker: false,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.r2.cloudflarestorage.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
