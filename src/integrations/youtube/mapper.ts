import type { NormalizedComment } from "@/types/comment";
import type { YouTubeCommentResource, YouTubeCommentThreadResource } from "./types";

function mapComment(
  comment: YouTubeCommentResource,
  videoId: string,
  isReply: boolean,
  parentId: string | null
): NormalizedComment {
  const s = comment.snippet;
  return {
    id: comment.id,
    platform: "youtube",
    postId: videoId,
    authorId: s?.authorChannelId?.value,
    // YouTube's comment API doesn't expose a separate @handle — authorDisplayName
    // (e.g. "@SomeChannel") is already the human-readable identity. authorUsername
    // is deliberately left unset rather than filled with the raw channel ID, which
    // would misrepresent it as a handle (see the display bug this caused: a
    // second "@UCxxxxxxxx..." line duplicating the name above it).
    authorName: s?.authorDisplayName,
    authorAvatarUrl: s?.authorProfileImageUrl,
    text: s?.textOriginal ?? s?.textDisplay ?? "",
    createdAt: s?.publishedAt,
    updatedAt: s?.updatedAt,
    likeCount: s?.likeCount,
    replyCount: undefined,
    parentId,
    isReply,
    permalink: `https://www.youtube.com/watch?v=${videoId}&lc=${comment.id}`,
  };
}

/** Maps a top-level comment thread's own comment (not its replies) into the normalized shape. */
export function mapTopLevelComment(thread: YouTubeCommentThreadResource, videoId: string): NormalizedComment | null {
  const top = thread.snippet?.topLevelComment;
  if (!top) return null;
  const normalized = mapComment(top, videoId, false, null);
  normalized.replyCount = thread.snippet?.totalReplyCount ?? 0;
  return normalized;
}

/** Maps the replies inlined on (or separately fetched for) a thread. */
export function mapReplies(
  replies: YouTubeCommentResource[],
  videoId: string,
  parentId: string
): NormalizedComment[] {
  return replies.map((r) => mapComment(r, videoId, true, parentId));
}
