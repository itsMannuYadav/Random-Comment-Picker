import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectPlatformFromUrl } from "@/core/url-detection/detect";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { PLATFORM_STATUS } from "@/lib/platform-status";

const bodySchema = z.object({ url: z.string().min(1).max(2048) });

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError("invalid-request", "Please provide a URL to check.");
    }
    const result = detectPlatformFromUrl(parsed.data.url);

    if (result.platform === "unknown") {
      return NextResponse.json({
        platform: "unknown",
        message: "That doesn't look like a supported social-media URL.",
      });
    }

    return NextResponse.json({
      platform: result.platform,
      resourceId: result.resourceId,
      meta: "meta" in result ? result.meta : undefined,
      status: PLATFORM_STATUS[result.platform],
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
