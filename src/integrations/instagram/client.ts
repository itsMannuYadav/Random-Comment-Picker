import "server-only";
import type { InstagramCommentsResponse, InstagramMediaResource } from "./types";
import { InstagramApiError } from "./types";

const GRAPH_BASE = "https://graph.instagram.com";

/**
 * Real Instagram Graph API calls, ready to use the moment a per-user access
 * token exists. Comments are only readable for media owned by the connected
 * professional account — there is no public/anonymous comment-read
 * endpoint, so every call here requires `accessToken` from a completed
 * OAuth connection (planning doc section 6). MyCP does not yet implement
 * account connections, so nothing calls these functions without a token in
 * hand — see `src/integrations/instagram/index.ts`.
 */

export function isInstagramOAuthConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET);
}

async function graphFetch<T>(path: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) {
    throw new InstagramApiError("We couldn't find this post. It may have been deleted or made private.", "not-found", 404);
  }
  if (res.status === 401 || res.status === 403) {
    throw new InstagramApiError(
      "This account's authorization has expired or doesn't have access to this media.",
      "forbidden",
      403
    );
  }
  if (!res.ok) {
    throw new InstagramApiError(`Instagram API request failed (${res.status})`, "unknown", res.status);
  }
  return (await res.json()) as T;
}

export async function fetchMedia(mediaId: string, accessToken: string): Promise<InstagramMediaResource> {
  return graphFetch<InstagramMediaResource>(`/${mediaId}`, accessToken, {
    fields: "id,caption,media_type,permalink,thumbnail_url,media_url,comments_count,username,timestamp",
  });
}

export async function fetchMediaCommentsPage(
  mediaId: string,
  accessToken: string,
  after?: string
): Promise<InstagramCommentsResponse> {
  return graphFetch<InstagramCommentsResponse>(`/${mediaId}/comments`, accessToken, {
    fields: "id,text,username,timestamp,like_count,replies{id,text,username,timestamp,like_count}",
    ...(after ? { after } : {}),
  });
}
