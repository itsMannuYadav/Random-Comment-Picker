const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{10,12}$/;

export interface ParsedYouTubeUrl {
  videoId: string;
}

/**
 * Parses a YouTube URL into a video ID. Returns null for anything that
 * isn't a recognized, well-formed YouTube video/shorts URL — callers must
 * not assume every input is valid.
 */
export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  let videoId: string | null = null;

  if (host === "youtu.be") {
    // https://youtu.be/VIDEO_ID
    const segments = url.pathname.split("/").filter(Boolean);
    videoId = segments[0] ?? null;
  } else if (url.pathname === "/watch") {
    // https://www.youtube.com/watch?v=VIDEO_ID
    videoId = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/shorts/")) {
    // https://www.youtube.com/shorts/VIDEO_ID
    videoId = url.pathname.slice("/shorts/".length).split("/")[0] ?? null;
  } else if (url.pathname.startsWith("/live/")) {
    videoId = url.pathname.slice("/live/".length).split("/")[0] ?? null;
  }

  if (!videoId || !VIDEO_ID_RE.test(videoId)) return null;

  return { videoId };
}

export function isValidYouTubeVideoId(id: string): boolean {
  return VIDEO_ID_RE.test(id);
}
