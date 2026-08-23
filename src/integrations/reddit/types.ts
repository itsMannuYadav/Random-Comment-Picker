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

export interface RedditPostData {
  id: string;
  title?: string;
  author?: string;
  permalink?: string;
  num_comments?: number;
  thumbnail?: string;
  created_utc?: number;
  subreddit?: string;
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
    public readonly kind: "not-found" | "forbidden" | "rate-limited" | "invalid-request" | "unknown",
    public readonly status: number
  ) {
    super(message);
    this.name = "RedditApiError";
  }
}
