import { NextRequest, NextResponse } from "next/server";
import { getRedditResource, resolvePostSubreddit } from "@/integrations/reddit";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get("postId");
    let subreddit = req.nextUrl.searchParams.get("subreddit");
    if (!postId) throw new ApiError("invalid-request", "A Reddit post ID is required.");

    if (!subreddit) subreddit = await resolvePostSubreddit(postId);

    const resource = await getRedditResource(subreddit, postId);
    return NextResponse.json(resource);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
