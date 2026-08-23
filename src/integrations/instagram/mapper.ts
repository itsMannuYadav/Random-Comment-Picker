import type { NormalizedComment } from "@/types/comment";
import type { InstagramCommentResource } from "./types";

export function mapInstagramComment(
  comment: InstagramCommentResource,
  mediaId: string,
  parentId: string | null
): NormalizedComment {
  return {
    id: comment.id,
    platform: "instagram",
    postId: mediaId,
    authorName: comment.username,
    authorUsername: comment.username,
    text: comment.text ?? "",
    createdAt: comment.timestamp,
    likeCount: comment.like_count,
    parentId,
    isReply: parentId !== null,
  };
}
