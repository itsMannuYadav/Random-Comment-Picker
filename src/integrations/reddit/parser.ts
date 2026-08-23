const REDDIT_HOSTS = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "new.reddit.com",
  "np.reddit.com",
  "redd.it",
]);

const ID_RE = /^[a-z0-9]+$/i;
const SUBREDDIT_RE = /^[A-Za-z0-9_]+$/;

export interface ParsedRedditUrl {
  subreddit: string | null;
  postId: string;
}

/**
 * Parses a Reddit post URL into a subreddit + post ID (the "fullname" base36
 * ID, without the `t3_` prefix). Returns null for anything that isn't a
 * recognized post URL — comment permalinks, user profiles, etc. don't count.
 */
export function parseRedditUrl(input: string): ParsedRedditUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!REDDIT_HOSTS.has(host)) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  if (host === "redd.it") {
    // https://redd.it/POST_ID
    const postId = url.pathname.split("/").filter(Boolean)[0];
    if (!postId || !ID_RE.test(postId)) return null;
    return { subreddit: null, postId };
  }

  // https://www.reddit.com/r/subreddit/comments/POST_ID/optional-slug/
  const segments = url.pathname.split("/").filter(Boolean);
  const rIndex = segments.indexOf("r");
  const commentsIndex = segments.indexOf("comments");
  if (rIndex === -1 || commentsIndex === -1 || commentsIndex < rIndex) return null;

  const subreddit = segments[rIndex + 1];
  const postId = segments[commentsIndex + 1];

  if (!subreddit || !SUBREDDIT_RE.test(subreddit)) return null;
  if (!postId || !ID_RE.test(postId)) return null;

  return { subreddit, postId };
}
