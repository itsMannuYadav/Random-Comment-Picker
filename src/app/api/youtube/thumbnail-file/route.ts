import { NextRequest, NextResponse } from "next/server";
import { isValidYouTubeVideoId } from "@/integrations/youtube/parser";
import { youtubeThumbnailCdnUrl, type ThumbnailKey } from "@/integrations/youtube";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";

const RATE_LIMIT = 30; // downloads per window, per IP — this relays bandwidth, unlike the metadata lookup
const RATE_WINDOW_MS = 60_000;

const VALID_KEYS = new Set<ThumbnailKey>(["default", "medium", "high", "standard", "maxres"]);

function isThumbnailKey(value: string | null): value is ThumbnailKey {
  return value !== null && VALID_KEYS.has(value as ThumbnailKey);
}

/**
 * Streams a YouTube thumbnail back with a Content-Disposition that forces an
 * actual file save (the <img> tag's cross-origin `download` attribute is
 * silently ignored by browsers). The fetch target is always constructed
 * server-side from a regex-validated video ID and a fixed key enum — never
 * from a client-supplied URL — so this can't be turned into an open fetch
 * proxy (planning doc §49/§50).
 */
export async function GET(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`youtube:thumbnail-file:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're downloading too quickly. Please slow down.");
    }

    const videoId = req.nextUrl.searchParams.get("videoId");
    const key = req.nextUrl.searchParams.get("key");
    if (!videoId || !isValidYouTubeVideoId(videoId) || !isThumbnailKey(key)) {
      throw new ApiError("invalid-request", "A valid YouTube video ID and thumbnail size are required.");
    }

    const upstream = await fetch(youtubeThumbnailCdnUrl(videoId, key), { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      throw new ApiError("not-found", "That thumbnail couldn't be downloaded.");
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${videoId}-${key}.jpg"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
