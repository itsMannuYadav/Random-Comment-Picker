import type { NormalizedComment } from "@/types/comment";
import type { RedditCommentData } from "./types";

export function mapRedditComment(comment: RedditCommentData, postId: string): NormalizedComment {
  const parentId = comment.parent_id?.startsWith("t1_")
    ? comment.parent_id.slice("t1_".length)
    : null;

  return {
    id: comment.id,
    platform: "reddit",
    postId,
    authorId: comment.author,
    authorName: comment.author,
    authorUsername: comment.author,
    text: comment.body ?? "",
    createdAt: comment.created_utc ? new Date(comment.created_utc * 1000).toISOString() : undefined,
    likeCount: comment.score,
    score: comment.score,
    parentId,
    isReply: parentId !== null,
    permalink: comment.permalink ? `https://www.reddit.com${comment.permalink}` : undefined,
  };
}
