import type { NextConfig } from "next";

// Avatar/thumbnail images are embedded directly from whichever platform a
// comment came from (YouTube, Reddit, ...) rather than proxied, so img-src
// allows any https host. `blob:` is required for client-side image tools
// (compressor/converter/resizer) that preview a File/canvas result via
// URL.createObjectURL() before it's ever uploaded anywhere. Everything else
// stays scoped to our own origin — there's no legitimate reason for this
// app to load scripts, styles, or connect out to anywhere else.
// 'unsafe-eval' is dev-only: React's dev-mode debugging (stack trace
// reconstruction) uses eval() and never runs in production builds.
const scriptSrc = `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`;

const CSP = [
  "default-src 'self'",
  "img-src 'self' https: data: blob:",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
