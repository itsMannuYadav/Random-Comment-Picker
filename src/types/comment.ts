import type { Platform } from "./platform";

/**
 * The normalized shape every platform adapter maps its raw API response into.
 * Nothing outside `src/integrations/**` should ever touch a provider's raw
 * response shape — the rest of the app only ever sees this.
 */
export interface NormalizedComment {
  id: string;
  platform: Platform;
  postId: string;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  likeCount?: number;
  score?: number;
  replyCount?: number;
  parentId?: string | null;
  isReply: boolean;
  permalink?: string;
}

export interface SourceResource {
  platform: Platform;
  id: string;
  url: string;
  title?: string;
  authorName?: string;
  authorUsername?: string;
  thumbnailUrl?: string;
  commentCount?: number;
  commentsEnabled?: boolean;
}

export interface FetchCommentsPage {
  comments: NormalizedComment[];
  nextPageToken?: string | null;
  /** Running total of comments fetched so far across all pages in this request chain. */
  totalFetched: number;
}
