import "server-only";
import type {
  YouTubeApiErrorBody,
  YouTubeCommentListResponse,
  YouTubeCommentResource,
  YouTubeCommentThreadListResponse,
  YouTubeVideoListResponse,
  YouTubeVideoResource,
} from "./types";
import { YouTubeApiError } from "./types";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const THREADS_PAGE_SIZE = 100;
const REPLIES_PAGE_SIZE = 100;

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new YouTubeApiError(
      "YouTube integration is not configured on this server (missing YOUTUBE_API_KEY).",
      "invalid-request",
      503
    );
  }
  return key;
}

async function youtubeFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("key", getApiKey());

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    let body: YouTubeApiErrorBody | null = null;
    try {
      body = (await res.json()) as YouTubeApiErrorBody;
    } catch {
      // ignore — non-JSON error body
    }
    const reason = body?.error?.errors?.[0]?.reason;
    const message = body?.error?.message || `YouTube API request failed (${res.status})`;

    if (reason === "commentsDisabled") {
      throw new YouTubeApiError("Comments are disabled on this video.", "comments-disabled", 403);
    }
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded" || reason === "rateLimitExceeded") {
      throw new YouTubeApiError(
        "This service is temporarily unavailable because the YouTube API limit was reached. Please try again later.",
        "quota-exceeded",
        429
      );
    }
    if (reason === "videoNotFound" || res.status === 404) {
      throw new YouTubeApiError(
        "We couldn't find this video. It may have been deleted or made private.",
        "not-found",
        404
      );
    }
    if (res.status === 403) {
      throw new YouTubeApiError(message, "forbidden", 403);
    }
    throw new YouTubeApiError(message, "unknown", res.status);
  }

  return (await res.json()) as T;
}

export async function fetchVideoResource(videoId: string): Promise<YouTubeVideoResource> {
  const data = await youtubeFetch<YouTubeVideoListResponse>("videos", {
    part: "snippet,statistics,status",
    id: videoId,
  });
  const video = data.items?.[0];
  if (!video) {
    throw new YouTubeApiError(
      "We couldn't find this video. It may have been deleted or made private.",
      "not-found",
      404
    );
  }
  return video;
}

export interface CommentThreadsPage {
  raw: YouTubeCommentThreadListResponse;
}

/** Fetches one page of top-level comment threads (with their inline replies, up to 5 each). */
export async function fetchCommentThreadsPage(
  videoId: string,
  pageToken?: string
): Promise<CommentThreadsPage> {
  const raw = await youtubeFetch<YouTubeCommentThreadListResponse>("commentThreads", {
    part: "snippet,replies",
    videoId,
    maxResults: String(THREADS_PAGE_SIZE),
    order: "time",
    textFormat: "plainText",
    ...(pageToken ? { pageToken } : {}),
  });
  return { raw };
}

/**
 * Fetches every reply for a thread whose `totalReplyCount` exceeds the
 * replies already inlined on the thread response (YouTube only inlines the
 * first ~5 per the API's stated behavior).
 */
export async function fetchAllRepliesForThread(commentId: string): Promise<YouTubeCommentResource[]> {
  const replies: YouTubeCommentResource[] = [];
  let pageToken: string | undefined;

  do {
    const data = await youtubeFetch<YouTubeCommentListResponse>("comments", {
      part: "snippet",
      parentId: commentId,
      maxResults: String(REPLIES_PAGE_SIZE),
      textFormat: "plainText",
      ...(pageToken ? { pageToken } : {}),
    });
    replies.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return replies;
}
