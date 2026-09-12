// Client-side detection for platforms /api/platform/detect doesn't know
// about (Vimeo, direct file links) — shared by the Video Downloader and
// Thumbnail Downloader tools so the two never drift out of sync.

const DIRECT_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]);
const VIMEO_RE = /^https?:\/\/(?:(?:www\.|player\.)?vimeo\.com)\//;
// Path segments that signal a web page rather than a raw video file
const WEB_PAGE_PATH_SEGMENTS = ["/wiki/", "/watch/", "/video/", "/videos/", "/posts/", "/articles/", "/article/", "/news/"];

export function parseVimeoIdFromUrl(url: string): string | null {
  if (!VIMEO_RE.test(url)) return null;
  const match = /\/(\d+)(?:[/?#]|$)/.exec(new URL(url).pathname);
  return match ? match[1] : null;
}

/** Detect direct video file URLs client-side. */
export function isDirectVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const filename = parsed.pathname.split("/").pop() ?? "";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (!DIRECT_VIDEO_EXTENSIONS.has(ext)) return false;
    // Filenames with colons are wiki-style page references, not real files
    if (filename.includes(":")) return false;
    // Known web-page path patterns — the URL is a page embedding a video, not the video itself
    if (WEB_PAGE_PATH_SEGMENTS.some((seg) => parsed.pathname.includes(seg))) return false;
    return true;
  } catch {
    return false;
  }
}

interface DetectResponse {
  platform: string;
  resourceId?: string;
  message?: string;
}

/** Resolves a pasted URL to { platform, resourceId } for /api/video-download/info. */
export async function detectVideoPlatform(
  raw: string,
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>,
): Promise<{ platform: string; resourceId: string }> {
  const vimeoId = parseVimeoIdFromUrl(raw);
  if (vimeoId) return { platform: "vimeo", resourceId: vimeoId };
  if (isDirectVideoUrl(raw)) return { platform: "direct", resourceId: raw };

  const det = await apiFetch<DetectResponse>("/api/platform/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: raw }),
  });
  if (det.platform !== "unknown" && det.resourceId) {
    return { platform: det.platform, resourceId: det.resourceId };
  }
  return { platform: "webpage", resourceId: raw };
}
