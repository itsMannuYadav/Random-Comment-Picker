import { appConfig } from "@/lib/env";
import { parseYouTubeUrl } from "@/integrations/youtube/parser";
import { parseRedditUrl } from "@/integrations/reddit/parser";
import { parseInstagramUrl } from "@/integrations/instagram/parser";
import { parseThreadsUrl } from "@/integrations/threads/parser";
import { parseFacebookUrl } from "@/integrations/facebook/parser";
import { parseLinkedInUrl } from "@/integrations/linkedin/parser";
import { parseTikTokUrl } from "@/integrations/tiktok/parser";
import { parseXUrl } from "@/integrations/x/parser";
import { PREFIX_TO_PLATFORM, type Platform } from "@/types/platform";

export interface DetectedResource {
  platform: Platform;
  /** The primary resource identifier (video ID, post ID, media shortcode, ...). */
  resourceId: string;
  /** Extra platform-specific context, e.g. `{ subreddit: "aww" }`. */
  meta?: Record<string, string>;
}

export type DetectionResult = DetectedResource | { platform: "unknown" };

/**
 * Recognizes MyCP's own short links (`/y/[id]`, `/r/[id]`, `/watch?v=[id]`, ...)
 * so pasting a link you copied from MyCP itself works too.
 */
function detectOwnLink(url: URL): DetectedResource | null {
  let appOrigin: string;
  try {
    appOrigin = new URL(appConfig.url).origin;
  } catch {
    return null;
  }
  if (url.origin !== appOrigin) return null;

  if (url.pathname === "/watch") {
    const videoId = url.searchParams.get("v");
    if (videoId) return { platform: "youtube", resourceId: videoId };
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const [prefix, id] = segments;
  const platform = prefix ? PREFIX_TO_PLATFORM[prefix] : undefined;
  if (platform && id) return { platform, resourceId: id };

  return null;
}

/**
 * Detects the platform + resource ID for any pasted URL. Only known,
 * allow-listed domains are ever recognized — everything else comes back as
 * `unknown` rather than attempting a generic fetch (see planning doc section 38).
 */
export function detectPlatformFromUrl(input: string): DetectionResult {
  const trimmed = input.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { platform: "unknown" };
  }

  const ownLink = detectOwnLink(url);
  if (ownLink) return ownLink;

  const youtube = parseYouTubeUrl(trimmed);
  if (youtube) return { platform: "youtube", resourceId: youtube.videoId };

  const reddit = parseRedditUrl(trimmed);
  if (reddit) {
    return {
      platform: "reddit",
      resourceId: reddit.postId,
      meta: reddit.subreddit ? { subreddit: reddit.subreddit } : undefined,
    };
  }

  const instagram = parseInstagramUrl(trimmed);
  if (instagram) {
    return {
      platform: "instagram",
      resourceId: instagram.mediaCode,
      meta: { mediaType: instagram.mediaType },
    };
  }

  const threads = parseThreadsUrl(trimmed);
  if (threads) return { platform: "threads", resourceId: threads.postId };

  const facebook = parseFacebookUrl(trimmed);
  if (facebook) return { platform: "facebook", resourceId: facebook.resourceId };

  const linkedin = parseLinkedInUrl(trimmed);
  if (linkedin) return { platform: "linkedin", resourceId: linkedin.resourceId };

  const tiktok = parseTikTokUrl(trimmed);
  if (tiktok) return { platform: "tiktok", resourceId: tiktok.videoId };

  const x = parseXUrl(trimmed);
  if (x) return { platform: "x", resourceId: x.statusId };

  return { platform: "unknown" };
}
