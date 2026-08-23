import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";

// Every hostname a video-download format's `url`/`audioUrl` is allowed to
// point at. The info endpoint only ever returns URLs from these hosts
// (Reddit's own official API responses), but this route re-validates
// independently rather than trusting that invariant blindly — the fetch
// target is always resolved from this fixed allowlist, never an arbitrary
// client-supplied host, so this can't become an open fetch/SSRF proxy
// (doc §49/§50 — same reasoning as the YouTube thumbnail-file route).
const ALLOWED_HOSTS = new Set(["v.redd.it"]);

const RATE_LIMIT = 30; // downloads per window, per IP — this relays real video bandwidth
const RATE_WINDOW_MS = 60_000;

/**
 * Same-origin relay for CDN bytes a download format points at. Two reasons
 * this exists instead of the browser fetching the CDN directly:
 * 1. Forces a real file save via Content-Disposition — cross-origin <a
 *    download> is silently ignored by browsers without it (the same issue
 *    the YouTube thumbnail-file route works around).
 * 2. Sidesteps depending on the CDN sending permissive CORS headers for
 *    the client-side ffmpeg.wasm muxing step to read the bytes at all —
 *    a same-origin fetch always works regardless of the CDN's own CORS
 *    posture.
 */
export async function GET(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`video-download:file:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're downloading too quickly. Please slow down.");
    }

    const target = req.nextUrl.searchParams.get("url");
    if (!target) {
      throw new ApiError("invalid-request", "A file URL is required.");
    }

    let url: URL;
    try {
      url = new URL(target);
    } catch {
      throw new ApiError("invalid-request", "That's not a valid URL.");
    }
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
      throw new ApiError("invalid-request", "That file host isn't supported.");
    }

    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      throw new ApiError("not-found", "That file couldn't be downloaded.");
    }

    const filename = url.pathname.split("/").pop() || "download.mp4";
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
