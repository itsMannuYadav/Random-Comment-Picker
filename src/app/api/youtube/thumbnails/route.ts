import { NextRequest, NextResponse } from "next/server";
import { isValidYouTubeVideoId } from "@/integrations/youtube/parser";
import { getYouTubeThumbnails } from "@/integrations/youtube";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get("videoId");
    if (!videoId || !isValidYouTubeVideoId(videoId)) {
      throw new ApiError("invalid-request", "A valid YouTube video ID is required.");
    }

    const info = await getYouTubeThumbnails(videoId);
    return NextResponse.json(info);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
