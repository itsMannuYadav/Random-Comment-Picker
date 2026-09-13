import { NextRequest, NextResponse } from "next/server";
import { isValidYouTubeVideoId } from "@/integrations/youtube/parser";
import { getYouTubeCommentsPage } from "@/integrations/youtube";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";

// A single video's comment pagination is one continuous back-to-back burst
// from the same client (no user-paced delay between pages), so this needs
// to comfortably cover a large video's full page count, not just cap abuse
// across separate videos. ~100 comment threads per page, so 180/min covers
// videos with tens of thousands of comments while still bounding a script
// hammering this endpoint indefinitely.
const RATE_LIMIT = 180; // page requests per window, per IP
const RATE_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`youtube:comments:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're fetching comments too quickly. Please slow down.");
    }

    const videoId = req.nextUrl.searchParams.get("videoId");
    if (!videoId || !isValidYouTubeVideoId(videoId)) {
      throw new ApiError("invalid-request", "A valid YouTube video ID is required.");
    }

    const pageToken = req.nextUrl.searchParams.get("pageToken") ?? undefined;
    const runningTotal = Number(req.nextUrl.searchParams.get("runningTotal") ?? "0") || 0;

    const page = await getYouTubeCommentsPage(videoId, pageToken, runningTotal);
    return NextResponse.json(page);
  } catch (error) {
    if (!(error instanceof Error && "kind" in error)) {
      console.error("[youtube/comments] Unexpected error:", error);
    }
    return apiErrorResponse(error);
  }
}
