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
// 'wasm-unsafe-eval' (narrower than 'unsafe-eval' — only permits WebAssembly
// compilation, not general eval()) and blob: are both required by
// ffmpeg.wasm: it self-hosts its core from /ffmpeg/ (same-origin, copied
// from the @ffmpeg/core package by scripts/copy-ffmpeg-core.mjs) but loads
// it through a blob: URL internally, which is the officially documented
// loading pattern regardless of hosting origin.
const scriptSrc = `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`;

const CSP = [
  "default-src 'self'",
  "img-src 'self' https: data: blob:",
  // Client-side video tools preview an uploaded file via URL.createObjectURL()
  // on a <video> element before any processing happens — same rationale as
  // img-src's blob: addition above, just for the media-src fallback.
  "media-src 'self' blob:",
  scriptSrc,
  // ffmpeg.wasm's worker is instantiated from a blob: URL.
  "worker-src 'self' blob:",
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
      // Allow the browser extension (chrome-extension:// / extension:// origin)
      // to call API routes directly from extension pages. Host permissions in
      // manifest.json should bypass CORS automatically, but Edge and some
      // Chromium builds still enforce it for cross-domain redirects and certain
      // preflight scenarios — explicit headers ensure it works everywhere.
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
