// Shared by every extension page that needs to resolve an arbitrary pasted
// URL into { platform, resourceId } for /api/video-download/info -- mirrors
// the client-side detection in src/app/tools/video-downloader/page.tsx.
// Loaded as a plain <script> (not a module) so it shares global scope with
// its caller, same convention as utils/detect.js.

const DIRECT_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]);
const VIMEO_RE = /^https?:\/\/(?:(?:www\.|player\.)?vimeo\.com)\//;
const WEB_PAGE_PATH_SEGMENTS = ["/wiki/", "/watch/", "/video/", "/videos/", "/posts/", "/articles/", "/article/", "/news/"];

function parseVimeoIdFromUrl(url) {
  if (!VIMEO_RE.test(url)) return null;
  const match = /\/(\d+)(?:[/?#]|$)/.exec(new URL(url).pathname);
  return match ? match[1] : null;
}

function isDirectVideoUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const filename = parsed.pathname.split("/").pop() ?? "";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (!DIRECT_VIDEO_EXTENSIONS.has(ext)) return false;
    if (filename.includes(":")) return false;
    if (WEB_PAGE_PATH_SEGMENTS.some((seg) => parsed.pathname.includes(seg))) return false;
    return true;
  } catch {
    return false;
  }
}

async function detectVideoPlatform(raw) {
  const vimeoId = parseVimeoIdFromUrl(raw);
  if (vimeoId) return { platform: "vimeo", resourceId: vimeoId };
  if (isDirectVideoUrl(raw)) return { platform: "direct", resourceId: raw };

  const res = await fetch(`${MYSOCIAL_APP_URL}/api/platform/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: raw }),
  });
  const det = await res.json().catch(() => null);
  if (det?.platform && det.platform !== "unknown" && det.resourceId) {
    return { platform: det.platform, resourceId: det.resourceId };
  }
  return { platform: "webpage", resourceId: raw };
}
