import "server-only";
import type { NormalizedComment, SourceResource } from "@/types/comment";
import type { VideoDownloadInfo } from "@/lib/video-download/types";
import { fetchMoreChildren, fetchPost, fetchPostWithComments, resolvePostSubreddit } from "./client";
import { mapRedditComment } from "./mapper";
import { getRedditVideoFormats } from "./video";
import type { RedditCommentData, RedditListing, RedditMoreData } from "./types";
import { RedditApiError } from "./types";

export { RedditApiError, resolvePostSubreddit };

export async function getRedditVideoInfo(postId: string): Promise<VideoDownloadInfo> {
  const post = await fetchPost(postId);
  const { formats, durationSeconds } = await getRedditVideoFormats(post);

  return {
    platform: "reddit",
    resourceId: postId,
    sourceUrl: `https://www.reddit.com${post.permalink ?? `/comments/${postId}`}`,
    title: post.title,
    creatorName: post.author,
    thumbnailUrl: post.thumbnail?.startsWith("http") ? post.thumbnail : undefined,
    durationSeconds,
    formats,
  };
}

export async function getRedditResource(subreddit: string, postId: string): Promise<SourceResource> {
  const { post } = await fetchPostWithComments(subreddit, postId);
  return {
    platform: "reddit",
    id: postId,
    url: `https://www.reddit.com${post.permalink ?? `/r/${subreddit}/comments/${postId}`}`,
    title: post.title,
    authorName: post.author,
    thumbnailUrl: post.thumbnail?.startsWith("http") ? post.thumbnail : undefined,
    commentCount: post.num_comments,
    commentsEnabled: true,
  };
}

interface MoreStub {
  linkId: string;
  children: string[];
}

const MAX_MORE_ROUNDS = 40;
const MAX_TOTAL_COMMENTS = 20_000;

function walkListing(
  listing: RedditListing<RedditCommentData> | "" | undefined,
  postId: string,
  results: NormalizedComment[],
  moreStubs: MoreStub[]
) {
  if (!listing) return;
  for (const child of listing.data.children) {
    if (results.length >= MAX_TOTAL_COMMENTS) return;

    if (child.kind === "t1") {
      const comment = child.data as RedditCommentData;
      results.push(mapRedditComment(comment, postId));
      walkListing(comment.replies, postId, results, moreStubs);
    } else if (child.kind === "more") {
      const more = child.data as unknown as RedditMoreData;
      if (more.children && more.children.length > 0) {
        moreStubs.push({ linkId: more.parent_id ?? `t3_${postId}`, children: more.children });
      }
    }
  }
}

/**
 * Fetches the full comment tree for a Reddit post, expanding every "more
 * comments" stub Reddit truncates the initial response with. Reddit's API
 * doesn't offer true incremental pagination for nested comment trees the way
 * YouTube does, so this resolves the whole tree in one request chain rather
 * than faking a page-by-page experience.
 */
export async function getAllRedditComments(subreddit: string, postId: string): Promise<NormalizedComment[]> {
  const { comments } = await fetchPostWithComments(subreddit, postId);

  const results: NormalizedComment[] = [];
  let moreStubs: MoreStub[] = [];
  walkListing(comments, postId, results, moreStubs);

  let round = 0;
  while (moreStubs.length > 0 && round < MAX_MORE_ROUNDS && results.length < MAX_TOTAL_COMMENTS) {
    round++;
    const stub = moreStubs.shift()!;
    const remainingChildren = [...stub.children];
    const nextStubs: MoreStub[] = [];

    while (remainingChildren.length > 0 && results.length < MAX_TOTAL_COMMENTS) {
      const batch = remainingChildren.splice(0, 100);
      const expanded = await fetchMoreChildren(stub.linkId, batch);
      for (const thing of expanded?.data?.things ?? []) {
        if (thing.kind === "t1") {
          results.push(mapRedditComment(thing.data as RedditCommentData, postId));
        } else if (thing.kind === "more") {
          const more = thing.data as unknown as RedditMoreData;
          if (more.children?.length) nextStubs.push({ linkId: stub.linkId, children: more.children });
        }
      }
    }

    moreStubs = [...moreStubs, ...nextStubs];
  }

  return results;
}
