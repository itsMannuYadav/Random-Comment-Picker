export interface InstagramMediaResource {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  comments_count?: number;
  username?: string;
  timestamp?: string;
}

export interface InstagramCommentResource {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
  like_count?: number;
  replies?: { data: InstagramCommentResource[] };
}

export interface InstagramCommentsResponse {
  data: InstagramCommentResource[];
  paging?: { cursors?: { after?: string }; next?: string };
}

export class InstagramApiError extends Error {
  constructor(
    message: string,
    public readonly kind: "not-connected" | "forbidden" | "not-found" | "invalid-request" | "unknown",
    public readonly status: number
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}
