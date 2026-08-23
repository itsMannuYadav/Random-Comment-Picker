import "server-only";
import type { FetchCommentsPage, SourceResource } from "@/types/comment";
import { fetchAllRepliesForThread, fetchCommentThreadsPage, fetchVideoResource } from "./client";
import { mapReplies, mapTopLevelComment } from "./mapper";
import { YouTubeApiError, type YouTubeThumbnails } from "./types";

export { YouTubeApiError };

export type ThumbnailKey = "default" | "medium" | "high" | "standard" | "maxres";

export interface ThumbnailOption {
  key: ThumbnailKey;
  label: string;
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnailInfo {
  videoId: string;
  title?: string;
  thumbnails: ThumbnailOption[];
}

const THUMBNAIL_LABELS: Record<ThumbnailKey, string> = {
  default: "Default",
  medium: "Medium",
  high: "High",
  standard: "Standard",
  maxres: "Maximum available",
};

/**
 * The stable, publicly documented filenames behind `i.ytimg.com/vi/{id}/...`
 * — the same host+path convention the Data API's own thumbnail URLs use.
 * Only used to re-fetch a resolution the API has already confirmed exists
 * for this video; never used to guess at availability (the CDN silently
 * serves a placeholder for a missing resolution instead of 404ing).
 */
const THUMBNAIL_FILENAMES: Record<ThumbnailKey, string> = {
  default: "default.jpg",
  medium: "mqdefault.jpg",
  high: "hqdefault.jpg",
  standard: "sddefault.jpg",
  maxres: "maxresdefault.jpg",
};

export function youtubeThumbnailCdnUrl(videoId: string, key: ThumbnailKey): string {
  return `https://i.ytimg.com/vi/${videoId}/${THUMBNAIL_FILENAMES[key]}`;
}

// Largest first, so callers can treat thumbnails[0] as "the" preview image.
const THUMBNAIL_KEY_ORDER: ThumbnailKey[] = ["maxres", "standard", "high", "medium", "default"];

export async function getYouTubeThumbnails(videoId: string): Promise<YouTubeThumbnailInfo> {
  const video = await fetchVideoResource(videoId);

  if (video.status?.privacyStatus === "private") {
    throw new YouTubeApiError(
      "We couldn't find this video. It may have been deleted or made private.",
      "not-found",
      404
    );
  }

  const raw: YouTubeThumbnails = video.snippet?.thumbnails ?? {};
  const thumbnails: ThumbnailOption[] = [];
  for (const key of THUMBNAIL_KEY_ORDER) {
    const t = raw[key];
    if (t?.url && t.width && t.height) {
      thumbnails.push({ key, label: THUMBNAIL_LABELS[key], url: t.url, width: t.width, height: t.height });
    }
  }

  if (thumbnails.length === 0) {
    throw new YouTubeApiError("No thumbnail is available for this video.", "not-found", 404);
  }

  return { videoId, title: video.snippet?.title, thumbnails };
}

export async function getYouTubeResource(videoId: string): Promise<SourceResource> {
  const video = await fetchVideoResource(videoId);

  if (video.status?.privacyStatus === "private") {
    throw new YouTubeApiError(
      "We couldn't find this video. It may have been deleted or made private.",
      "not-found",
      404
    );
  }

  return {
    platform: "youtube",
    id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: video.snippet?.title,
    authorName: video.snippet?.channelTitle,
    thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? video.snippet?.thumbnails?.default?.url,
    commentCount: video.statistics?.commentCount ? Number(video.statistics.commentCount) : undefined,
    commentsEnabled: video.statistics?.commentCount !== undefined,
  };
}

/**
 * Fetches one page of top-level threads for a video, resolving every reply
 * (including ones beyond the ~5 YouTube inlines per thread) along the way.
 * `totalFetched` lets the UI show a running "N comments collected" counter
 * without the caller needing to track state across requests.
 */
export async function getYouTubeCommentsPage(
  videoId: string,
  pageToken: string | undefined,
  runningTotal: number
): Promise<FetchCommentsPage> {
  const { raw } = await fetchCommentThreadsPage(videoId, pageToken);

  const comments = [];
  for (const thread of raw.items ?? []) {
    const topLevel = mapTopLevelComment(thread, videoId);
    if (!topLevel) continue;
    comments.push(topLevel);

    const inlineReplies = thread.replies?.comments ?? [];
    const totalReplyCount = thread.snippet?.totalReplyCount ?? 0;

    if (totalReplyCount === 0) continue;

    if (totalReplyCount <= inlineReplies.length) {
      comments.push(...mapReplies(inlineReplies, videoId, topLevel.id));
    } else {
      // YouTube only inlines a handful of replies per thread — fetch the rest.
      const allReplies = await fetchAllRepliesForThread(topLevel.id);
      comments.push(...mapReplies(allReplies, videoId, topLevel.id));
    }
  }

  return {
    comments,
    nextPageToken: raw.nextPageToken ?? null,
    totalFetched: runningTotal + comments.length,
  };
}
