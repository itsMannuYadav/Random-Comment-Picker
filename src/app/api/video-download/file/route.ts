import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";

/**
 * Hosts whose URLs come exclusively from our own server-side API responses
 * (Reddit's official API, Vimeo's official API) — fast-pathed through without
 * an extra HEAD request. Adding a host here is a deliberate trust decision,
 * not a convenience; every host must be a CDN we control the upstream of.
 */
const TRUSTED_CDN_HOSTS = new Set([
  // Reddit
  "v.redd.it",
  // Vimeo progressive download CDN (Akamai)
  "vod-progressive.akamaized.net",
  "vod.akamaized.net",
  // Vimeo fallback CDN
  "player.vimeo.com",
  "fresnel.vimeocdn.com",
]);

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

// "video-download" file proxy also relays thumbnail images (same trust
// model: HTTPS, non-private host, content-type validated) rather than a
// second near-duplicate endpoint just for images.
const ALLOWED_CONTENT_TYPES = ["video/", "audio/", "image/", "application/octet-stream"];

function isPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1") return true;
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

/**
 * Same-origin relay for CDN bytes a download format points at.
 *
 * Two trust tiers:
 * 1. TRUSTED_CDN_HOSTS — fast path; URLs come from our own server API calls
 *    so host membership is sufficient.
 * 2. Direct video links — any HTTPS non-private host that returns a video or
 *    audio Content-Type. An extra HEAD is done to confirm before streaming.
 *    This exists so users can paste raw .mp4 / .webm URLs. It is NOT an open
 *    proxy: private/loopback addresses are rejected, and the content-type gate
 *    means arbitrary HTML pages can't be fetched through it.
 */
export async function GET(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`video-download:file:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're downloading too quickly. Please slow down.");
    }

    const target = req.nextUrl.searchParams.get("url");
    if (!target) throw new ApiError("invalid-request", "A file URL is required.");

    let url: URL;
    try {
      url = new URL(target);
    } catch {
      throw new ApiError("invalid-request", "That's not a valid URL.");
    }

    if (url.protocol !== "https:") {
      throw new ApiError("invalid-request", "Only HTTPS URLs are supported.");
    }
    if (isPrivateHost(url.hostname)) {
      throw new ApiError("invalid-request", "That file host isn't supported.");
    }

    const isTrusted = TRUSTED_CDN_HOSTS.has(url.hostname);

    if (!isTrusted) {
      // Secondary path: validate Content-Type is actually video/audio before streaming
      let headContentType = "";
      try {
        const head = await fetch(url, { method: "HEAD", cache: "no-store" });
        headContentType = head.headers.get("content-type") ?? "";
        if (!head.ok) throw new ApiError("not-found", "That file couldn't be reached.");
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError("not-found", "That file couldn't be downloaded.");
      }

      const isAllowed = ALLOWED_CONTENT_TYPES.some((t) => headContentType.startsWith(t));
      if (!isAllowed) {
        throw new ApiError("invalid-request", "That URL doesn't point to a video, audio, or image file.");
      }
    }

    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      throw new ApiError("not-found", "That file couldn't be downloaded.");
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const filename = url.pathname.split("/").pop() || "download";
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
