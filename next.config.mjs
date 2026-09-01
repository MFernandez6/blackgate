const baseline = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const staffLock = [
  ...baseline,
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, private",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const embeddable = [
  ...baseline,
  { key: "Content-Security-Policy", value: "frame-ancestors *" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: baseline },
      { source: "/login", headers: staffLock },
      { source: "/queue", headers: staffLock },
      { source: "/queue/:path*", headers: staffLock },
      { source: "/intakes/:path*", headers: staffLock },
      { source: "/sources", headers: staffLock },
      { source: "/sources/:path*", headers: staffLock },
      { source: "/checklists", headers: staffLock },
      { source: "/checklists/:path*", headers: staffLock },
      { source: "/embed/:path*", headers: embeddable },
      { source: "/intake/:path*", headers: embeddable },
      { source: "/r/:path*", headers: embeddable },
    ];
  },
};

export default nextConfig;
