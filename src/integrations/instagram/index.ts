import "server-only";
import type { NormalizedComment, SourceResource } from "@/types/comment";
import { fetchMedia, fetchMediaCommentsPage, isInstagramOAuthConfigured } from "./client";
import { mapInstagramComment } from "./mapper";
import { InstagramApiError } from "./types";

export { InstagramApiError, isInstagramOAuthConfigured };

/**
 * MyCP does not yet implement Instagram account connections (OAuth), so
 * there is never an access token available to call the Graph API with — see
 * `src/integrations/instagram/client.ts` for the calls that are ready to run
 * the moment one exists. This throws a clear, honest error rather than
 * silently failing or faking a result.
 */
function requireConnection(): never {
  throw new InstagramApiError(
    "Connect your Instagram account to access comments from this post.",
    "not-connected",
    401
  );
}

export async function getInstagramResource(_mediaId: string, accessToken?: string): Promise<SourceResource> {
  if (!accessToken) requireConnection();
  const media = await fetchMedia(_mediaId, accessToken);
  return {
    platform: "instagram",
    id: media.id,
    url: media.permalink ?? `https://www.instagram.com/p/${_mediaId}/`,
    title: media.caption,
    authorName: media.username,
    thumbnailUrl: media.thumbnail_url ?? media.media_url,
    commentCount: media.comments_count,
    commentsEnabled: true,
  };
}

export async function getAllInstagramComments(mediaId: string, accessToken?: string): Promise<NormalizedComment[]> {
  if (!accessToken) requireConnection();

  const results: NormalizedComment[] = [];
  let after: string | undefined;

  do {
    const page = await fetchMediaCommentsPage(mediaId, accessToken, after);
    for (const comment of page.data) {
      results.push(mapInstagramComment(comment, mediaId, null));
      for (const reply of comment.replies?.data ?? []) {
        results.push(mapInstagramComment(reply, mediaId, comment.id));
      }
    }
    after = page.paging?.cursors?.after;
  } while (after);

  return results;
}
