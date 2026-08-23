/** Minimal shapes for the subset of the Reddit API responses we use. */

export interface RedditListing<T> {
  kind: "Listing";
  data: {
    children: RedditThing<T>[];
    after?: string | null;
  };
}

export interface RedditThing<T> {
  kind: string;
  data: T;
}

export interface RedditVideoData {
  fallback_url?: string;
  dash_url?: string;
  hls_url?: string;
  height?: number;
  width?: number;
  duration?: number;
  is_gif?: boolean;
  bitrate_kbps?: number;
}

export interface RedditPostData {
  id: string;
  title?: string;
  author?: string;
  permalink?: string;
  num_comments?: number;
  thumbnail?: string;
  created_utc?: number;
  subreddit?: string;
  is_video?: boolean;
  // `secure_media` is the HTTPS-safe field Reddit's API prefers; `media` is
  // the legacy fallback some older/edge-case responses still only populate.
  secure_media?: { reddit_video?: RedditVideoData } | null;
  media?: { reddit_video?: RedditVideoData } | null;
}

export interface RedditCommentData {
  id: string;
  author?: string;
  body?: string;
  score?: number;
  created_utc?: number;
  permalink?: string;
  parent_id?: string;
  link_id?: string;
  depth?: number;
  replies?: "" | RedditListing<RedditCommentData>;
}

export interface RedditMoreData {
  id: string;
  parent_id?: string;
  children: string[];
}

export interface RedditMoreChildrenResponse {
  json?: {
    data?: {
      things?: RedditThing<RedditCommentData | RedditMoreData>[];
    };
    errors?: unknown[];
  };
}

export class RedditApiError extends Error {
  constructor(
    message: string,
    public readonly kind: "not-found" | "forbidden" | "rate-limited" | "invalid-request" | "not-a-video" | "unknown",
    public readonly status: number
  ) {
    super(message);
    this.name = "RedditApiError";
  }
}
