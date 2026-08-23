import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRedditVideoInfo } from "@/integrations/reddit";
import { getInstagramVideoInfo } from "@/integrations/instagram/video";
import { VIDEO_DOWNLOAD_STATUS } from "@/lib/video-download/platform-status";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";
import type { Platform } from "@/types/platform";

const querySchema = z.object({
  platform: z.enum(["youtube", "reddit", "instagram", "tiktok", "facebook", "x", "threads", "linkedin"]),
  resourceId: z.string().min(1).max(100),
});

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`video-download:info:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're checking too quickly. Please slow down.");
    }

    const parsed = querySchema.safeParse({
      platform: req.nextUrl.searchParams.get("platform"),
      resourceId: req.nextUrl.searchParams.get("resourceId"),
    });
    if (!parsed.success) {
      throw new ApiError("invalid-request", "A valid platform and resource ID are required.");
    }
    const { platform, resourceId } = parsed.data as { platform: Platform; resourceId: string };

    switch (platform) {
      case "reddit":
        return NextResponse.json(await getRedditVideoInfo(resourceId));
      case "instagram":
        // No account-connection flow exists yet — this always throws the
        // honest "connect your account" error, never a fake result.
        return NextResponse.json(await getInstagramVideoInfo(resourceId, undefined));
      default:
        throw new ApiError("unsupported-platform", VIDEO_DOWNLOAD_STATUS[platform].description);
    }
  } catch (error) {
    return apiErrorResponse(error);
  }
}
