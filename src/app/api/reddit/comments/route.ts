import { NextRequest, NextResponse } from "next/server";
import { getAllRedditComments, resolvePostSubreddit } from "@/integrations/reddit";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";

const RATE_LIMIT = 10; // full-thread fetches per window, per IP — this can be an expensive request
const RATE_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`reddit:comments:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're fetching comments too quickly. Please slow down.");
    }

    const postId = req.nextUrl.searchParams.get("postId");
    let subreddit = req.nextUrl.searchParams.get("subreddit");
    if (!postId) throw new ApiError("invalid-request", "A Reddit post ID is required.");
    if (!subreddit) subreddit = await resolvePostSubreddit(postId);

    const comments = await getAllRedditComments(subreddit, postId);
    return NextResponse.json({ comments, totalFetched: comments.length });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
