import "server-only";
import { appConfig } from "@/lib/env";
import { RedditApiError, type RedditListing, type RedditMoreChildrenResponse } from "./types";
import type { RedditCommentData, RedditPostData } from "./types";

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE = "https://oauth.reddit.com";
const MAX_MORE_CHILDREN_PER_CALL = 100;

function getUserAgent(): string {
  return process.env.REDDIT_USER_AGENT || `web:${appConfig.name.toLowerCase()}:v1 (by /u/mycp-app)`;
}

// Cached per warm serverless instance — a fresh token is fetched automatically
// on cold start or after expiry. Never persisted anywhere.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new RedditApiError(
      "Reddit integration is not configured on this server (missing REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET).",
      "invalid-request",
      503
    );
  }
  return { clientId, clientSecret };
}

/** Application-only (client_credentials) OAuth — appropriate for read-only access to public data. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret } = getCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getUserAgent(),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new RedditApiError("Failed to authenticate with Reddit's API.", "unknown", 502);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.accessToken;
}

async function redditFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": getUserAgent() },
    cache: "no-store",
  });

  if (res.status === 404) {
    throw new RedditApiError(
      "We couldn't find this post. It may have been deleted or made private.",
      "not-found",
      404
    );
  }
  if (res.status === 403) {
    throw new RedditApiError("This post is private or restricted.", "forbidden", 403);
  }
  if (res.status === 429) {
    throw new RedditApiError(
      "This service is temporarily unavailable because the Reddit API limit was reached. Please try again later.",
      "rate-limited",
      429
    );
  }
  if (!res.ok) {
    throw new RedditApiError(`Reddit API request failed (${res.status})`, "unknown", res.status);
  }

  return (await res.json()) as T;
}

/**
 * Fetches a post and its comment tree in one call. `subreddit` is required by
 * Reddit's URL scheme but any value works if you don't have it — Reddit
 * redirects internally, so we resolve it via search when unknown.
 */
export async function fetchPostWithComments(
  subreddit: string,
  postId: string
): Promise<{ post: RedditPostData; comments: RedditListing<RedditCommentData> }> {
  const [postListing, commentListing] = await redditFetch<
    [RedditListing<RedditPostData>, RedditListing<RedditCommentData>]
  >(`/r/${subreddit}/comments/${postId}`, { limit: "500", depth: "12", sort: "new", raw_json: "1" });

  const post = postListing.data.children[0]?.data;
  if (!post) {
    throw new RedditApiError(
      "We couldn't find this post. It may have been deleted or made private.",
      "not-found",
      404
    );
  }

  return { post, comments: commentListing };
}

/** Resolves the subreddit for a bare post ID (e.g. from a `redd.it/ID` share link). */
export async function resolvePostSubreddit(postId: string): Promise<string> {
  const data = await redditFetch<RedditListing<RedditPostData>>("/api/info", { id: `t3_${postId}` });
  const subreddit = data.data.children[0]?.data.subreddit;
  if (!subreddit) {
    throw new RedditApiError(
      "We couldn't find this post. It may have been deleted or made private.",
      "not-found",
      404
    );
  }
  return subreddit;
}

/** Expands a batch of "more comments" stub IDs into real comments. */
export async function fetchMoreChildren(
  linkId: string,
  childrenIds: string[]
): Promise<RedditMoreChildrenResponse["json"]> {
  const batch = childrenIds.slice(0, MAX_MORE_CHILDREN_PER_CALL);
  const data = await redditFetch<RedditMoreChildrenResponse>("/api/morechildren", {
    api_type: "json",
    link_id: linkId.startsWith("t3_") ? linkId : `t3_${linkId}`,
    children: batch.join(","),
    limit_children: "false",
    raw_json: "1",
  });
  return data.json;
}

export { MAX_MORE_CHILDREN_PER_CALL };
