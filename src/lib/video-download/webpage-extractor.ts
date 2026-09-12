import "server-only";
import { ApiError } from "@/lib/api-error";
import type { DownloadFormat, VideoDownloadInfo } from "./types";

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv", "flv", "f4v", "ts"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "ogg", "opus", "wav", "flac"]);

function isPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1") return true;
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function isValidPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !isPrivateHost(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function guessExt(url: string): DownloadFormat["ext"] {
  try {
    const path = new URL(url).pathname;
    const ext = path.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
    if (VIDEO_EXTENSIONS.has(ext)) return ext as DownloadFormat["ext"];
  } catch {
    /* ignore */
  }
  return "mp4";
}

function guessKind(url: string): DownloadFormat["kind"] {
  try {
    const path = new URL(url).pathname;
    const ext = path.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
    if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  } catch {
    /* ignore */
  }
  return "video";
}

/**
 * Extract the content attribute of an HTML meta tag by property/name.
 * Handles both `property="..."` and `name="..."` attribute orderings.
 */
function extractMeta(html: string, key: string): string | null {
  // Match <meta property="KEY" content="VALUE"> and reversed attribute order
  const p1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m1 = p1.exec(html);
  if (m1) return m1[1];

  const p2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
    "i",
  );
  const m2 = p2.exec(html);
  return m2 ? m2[1] : null;
}

/** Walk a JSON-LD graph and collect all VideoObject nodes. */
function collectVideoObjects(node: unknown): Record<string, unknown>[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(collectVideoObjects);
  const obj = node as Record<string, unknown>;
  const results: Record<string, unknown>[] = [];
  if (obj["@type"] === "VideoObject") results.push(obj);
  // Recurse into @graph and known container fields
  for (const key of ["@graph", "video", "subjectOf", "associatedMedia"]) {
    if (obj[key]) results.push(...collectVideoObjects(obj[key]));
  }
  return results;
}

/**
 * Fetches any public webpage and extracts every video URL it can find from:
 * - Open Graph meta tags (og:video, og:video:url, og:video:secure_url)
 * - Twitter card meta (twitter:player:stream)
 * - JSON-LD VideoObject contentUrl / encodingObject
 * - <video src> and <source src> attributes
 * - HLS (.m3u8) and DASH (.mpd) manifest URLs embedded in page source
 *
 * Works for the majority of public video-hosting sites, news sites, and
 * any page that embeds its video URL in standard structured data. Sites
 * that load videos purely via JavaScript after page load won't be detected.
 */
export async function getWebpageVideoInfo(pageUrl: string): Promise<VideoDownloadInfo> {
  let parsed: URL;
  try {
    parsed = new URL(pageUrl);
  } catch {
    throw new ApiError("invalid-request", "That doesn't look like a valid URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new ApiError("invalid-request", "Only HTTP/HTTPS URLs are supported.");
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new ApiError("invalid-request", "That URL points to a private or reserved address.");
  }

  let html: string;
  let finalUrl = pageUrl;

  try {
    const resp = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
      cache: "no-store",
    });

    finalUrl = resp.url ?? pageUrl;

    if (!resp.ok) {
      throw new ApiError(
        "not-found",
        `That page returned ${resp.status} — make sure the link is correct and publicly accessible.`,
      );
    }

    const ct = resp.headers.get("content-type") ?? "";
    if (ct.startsWith("video/") || ct.startsWith("audio/")) {
      throw new ApiError(
        "invalid-request",
        "That link points directly to a video/audio file — paste it as a direct link instead of using the webpage extractor.",
      );
    }
    if (!ct.includes("html") && !ct.includes("xml") && !ct.includes("text")) {
      throw new ApiError("invalid-request", "That URL doesn't appear to be a webpage.");
    }

    html = await resp.text();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      "not-found",
      "We couldn't reach that page. Check that the URL is correct and publicly accessible.",
    );
  }

  const foundUrls: string[] = [];
  let title: string | undefined;
  let thumbnailUrl: string | undefined;

  // Page title
  const titleTag = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  if (titleTag) {
    title = titleTag[1]
      .trim()
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
  }

  // OG title overrides <title>
  const ogTitle = extractMeta(html, "og:title");
  if (ogTitle) title = ogTitle;

  // OG image → thumbnail
  const ogImage = extractMeta(html, "og:image");
  if (ogImage) thumbnailUrl = resolveUrl(ogImage, finalUrl);

  // ── OG video tags ─────────────────────────────────────────────────────────
  for (const key of ["og:video:secure_url", "og:video:url", "og:video"]) {
    const v = extractMeta(html, key);
    if (v) foundUrls.push(resolveUrl(v, finalUrl));
  }

  // ── Twitter card ──────────────────────────────────────────────────────────
  const twitterStream = extractMeta(html, "twitter:player:stream");
  if (twitterStream) foundUrls.push(resolveUrl(twitterStream, finalUrl));

  // ── JSON-LD VideoObject ───────────────────────────────────────────────────
  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      for (const vo of collectVideoObjects(data)) {
        if (typeof vo.contentUrl === "string") foundUrls.push(resolveUrl(vo.contentUrl, finalUrl));
        if (typeof vo.embedUrl === "string") {
          // Skip embed URLs (iframes, not raw files) — but record them for messaging
        }
        const encodings = Array.isArray(vo.encoding) ? vo.encoding : vo.encoding ? [vo.encoding] : [];
        for (const enc of encodings) {
          if (enc && typeof enc === "object" && typeof (enc as Record<string, unknown>).contentUrl === "string") {
            foundUrls.push(resolveUrl((enc as Record<string, unknown>).contentUrl as string, finalUrl));
          }
        }
        if (!thumbnailUrl) {
          const thumb = vo.thumbnailUrl ?? vo.thumbnail;
          if (typeof thumb === "string") thumbnailUrl = thumb;
          else if (Array.isArray(thumb) && typeof thumb[0] === "string") thumbnailUrl = thumb[0];
        }
        if (!title && typeof vo.name === "string") title = vo.name;
      }
    } catch {
      /* malformed JSON-LD — skip */
    }
  }

  // ── <video> and <source> tags ─────────────────────────────────────────────
  const videoTagSources = [
    ...html.matchAll(/<(?:video|source)[^>]+src=["']([^"']+)["'][^>]*/gi),
  ];
  for (const m of videoTagSources) {
    const url = resolveUrl(m[1], finalUrl);
    if (isValidPublicUrl(url)) foundUrls.push(url);
  }

  // ── HLS / DASH manifest URLs in page source ───────────────────────────────
  // Many players expose the manifest URL in a data attribute or JS variable
  const hlsMatches = [...html.matchAll(/["'](https?:\/\/[^"']+\.m3u8[^"']*?)["']/g)];
  for (const m of hlsMatches) {
    if (isValidPublicUrl(m[1])) foundUrls.push(m[1]);
  }

  const dashMatches = [...html.matchAll(/["'](https?:\/\/[^"']+\.mpd[^"']*?)["']/g)];
  for (const m of dashMatches) {
    if (isValidPublicUrl(m[1])) foundUrls.push(m[1]);
  }

  // ── Decode HTML entities and deduplicate ─────────────────────────────────
  // URLs extracted from HTML attributes may contain `&amp;` instead of `&`.
  const decoded = foundUrls.map((u) => u.replace(/&amp;/g, "&").replace(/&#38;/g, "&"));
  const seen = new Set<string>();
  const unique = decoded.filter((u) => {
    // Normalise by stripping query string for dedup purposes only
    const key = u.split("?")[0];
    if (!isValidPublicUrl(u) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0) {
    throw new ApiError(
      "not-found",
      "We couldn't find a downloadable video on that page. The video may load dynamically via JavaScript, be behind a login, or use DRM — none of which we can bypass.",
    );
  }

  /** Extract a human-readable resolution label from URL filenames like `.720p.vp9.webm`. */
  function resolutionLabel(url: string): string | null {
    const m = /[._](\d{3,4})[pP]/.exec(url.split("?")[0]);
    return m ? `${m[1]}p` : null;
  }

  // Build format list — HLS/DASH manifests get a special label, others get
  // resolution extracted from the filename when available.
  const formats: DownloadFormat[] = unique.slice(0, 8).map((url, i) => {
    const lowerUrl = url.toLowerCase().split("?")[0];
    const isHls = lowerUrl.endsWith(".m3u8");
    const isDash = lowerUrl.endsWith(".mpd");
    const ext = guessExt(url);
    const kind = guessKind(url);
    const res = resolutionLabel(url);

    let label: string;
    if (isHls) label = "HLS stream";
    else if (isDash) label = "DASH stream";
    else if (res) label = res;
    else label = i === 0 ? "Video" : `Video ${i + 1}`;

    return {
      id: `web-${i}`,
      kind,
      label,
      ext,
      delivery: "direct",
      url,
    };
  });

  return {
    platform: "webpage",
    resourceId: pageUrl,
    sourceUrl: finalUrl,
    title,
    thumbnailUrl,
    formats,
  };
}
