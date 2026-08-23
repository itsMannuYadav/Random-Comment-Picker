import "server-only";
import type { FetchCommentsPage, SourceResource } from "@/types/comment";
import { fetchAllRepliesForThread, fetchCommentThreadsPage, fetchVideoResource } from "./client";
import { mapReplies, mapTopLevelComment } from "./mapper";
import { YouTubeApiError } from "./types";

export { YouTubeApiError };

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
