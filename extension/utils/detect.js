// Minimal, dependency-free mirror of the URL detection logic in
// src/integrations/*/parser.ts — kept intentionally small since the
// extension only offers "Pick with MyCP" for platforms that are actually
// implemented (see planning doc section 32). Update this alongside the
// website's parsers when a new platform ships.

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);
const REDDIT_HOSTS = new Set(["reddit.com", "www.reddit.com", "old.reddit.com", "new.reddit.com", "np.reddit.com"]);

function detectYouTube(url) {
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  let videoId = null;
  if (url.hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/shorts/")) {
    videoId = url.pathname.slice("/shorts/".length).split("/")[0] ?? null;
  }

  if (!videoId || !/^[A-Za-z0-9_-]{10,12}$/.test(videoId)) return null;
  return { platform: "youtube", resourceId: videoId, prefix: "y" };
}

function detectReddit(url) {
  if (!REDDIT_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const rIndex = segments.indexOf("r");
  const commentsIndex = segments.indexOf("comments");
  if (rIndex === -1 || commentsIndex === -1 || commentsIndex < rIndex) return null;

  const postId = segments[commentsIndex + 1];
  if (!postId) return null;
  return { platform: "reddit", resourceId: postId, prefix: "r" };
}

/** Returns `{ platform, resourceId, prefix }` for a supported URL, or null. */
function detectSupportedUrl(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  return detectYouTube(url) || detectReddit(url);
}
