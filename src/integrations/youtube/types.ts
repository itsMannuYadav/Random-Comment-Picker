/** Minimal shapes for the subset of the YouTube Data API v3 responses we use. */

export interface YouTubeVideoListResponse {
  items: YouTubeVideoResource[];
}

export interface YouTubeVideoResource {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
  statistics?: {
    commentCount?: string;
  };
  status?: {
    privacyStatus?: string;
  };
}

export interface YouTubeCommentSnippet {
  authorDisplayName?: string;
  authorProfileImageUrl?: string;
  authorChannelId?: { value?: string };
  textDisplay?: string;
  textOriginal?: string;
  likeCount?: number;
  publishedAt?: string;
  updatedAt?: string;
  parentId?: string;
  videoId?: string;
}

export interface YouTubeCommentResource {
  id: string;
  snippet?: YouTubeCommentSnippet;
}

export interface YouTubeCommentThreadResource {
  id: string;
  snippet?: {
    videoId?: string;
    topLevelComment?: YouTubeCommentResource;
    totalReplyCount?: number;
  };
  replies?: {
    comments?: YouTubeCommentResource[];
  };
}

export interface YouTubeCommentThreadListResponse {
  items: YouTubeCommentThreadResource[];
  nextPageToken?: string;
  pageInfo?: { totalResults?: number };
}

export interface YouTubeCommentListResponse {
  items: YouTubeCommentResource[];
  nextPageToken?: string;
}

export interface YouTubeApiErrorBody {
  error?: {
    code?: number;
    message?: string;
    errors?: { reason?: string; message?: string }[];
  };
}

/** Normalized error thrown by the YouTube client so API routes can map it to a clean HTTP response. */
export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "not-found"
      | "comments-disabled"
      | "quota-exceeded"
      | "forbidden"
      | "invalid-request"
      | "unknown",
    public readonly status: number
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}
