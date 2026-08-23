import "server-only";
import { parseDashManifest } from "./dash";
import { RedditApiError, type RedditPostData, type RedditVideoData } from "./types";
import type { DownloadFormat } from "@/lib/video-download/types";

/**
 * Reddit serves a Reddit-hosted video's picture and sound as two separate
 * DASH tracks — there is no single officially-provided "the video with
 * audio" file. `fallback_url` points at one specific resolution's
 * video-only track; the matching audio track lives at the same directory
 * Reddit's own URL already points to, conventionally named DASH_audio.mp4
 * (confirmed pattern, not a guess at an unrelated host/path — this is
 * always a sibling of a URL Reddit's API itself just returned). Existence
 * is verified with a real HEAD request, never assumed.
 */
function deriveAudioUrl(fallbackUrl: string): string | null {
  try {
    const url = new URL(fallbackUrl);
    const dir = url.pathname.split("/").slice(0, -1).join("/");
    return `${url.origin}${dir}/DASH_audio.mp4`;
  } catch {
    return null;
  }
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Highest-bandwidth representation per resolution, sorted largest first. */
function dedupeByHeight<T extends { height?: number; bandwidth?: number }>(reps: T[]): T[] {
  const byHeight = new Map<number, T>();
  for (const rep of reps) {
    if (!rep.height) continue;
    const existing = byHeight.get(rep.height);
    if (!existing || (rep.bandwidth ?? 0) > (existing.bandwidth ?? 0)) {
      byHeight.set(rep.height, rep);
    }
  }
  return [...byHeight.values()].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
}

export interface RedditVideoFormats {
  formats: DownloadFormat[];
  durationSeconds?: number;
}

export async function getRedditVideoFormats(post: RedditPostData): Promise<RedditVideoFormats> {
  const video: RedditVideoData | undefined = post.secure_media?.reddit_video ?? post.media?.reddit_video;
  if (!video?.fallback_url) {
    throw new RedditApiError("This Reddit post doesn't contain a Reddit-hosted video.", "not-a-video", 400);
  }

  const audioUrl = deriveAudioUrl(video.fallback_url);
  const hasAudio = audioUrl ? await urlExists(audioUrl) : false;

  const formats: DownloadFormat[] = [];
  let resolutions: { height?: number; width?: number; url: string }[] = [];

  // Best-effort: the manifest gives every resolution Reddit actually
  // transcoded. If it's missing, unreachable, or doesn't parse into
  // anything usable, fall back to the one resolution the post JSON
  // already guarantees rather than failing the whole tool.
  if (video.dash_url) {
    try {
      const manifestRes = await fetch(video.dash_url, { cache: "no-store" });
      if (manifestRes.ok) {
        const xml = await manifestRes.text();
        const reps = parseDashManifest(xml, video.dash_url).filter((r) => r.mimeType === "video");
        resolutions = dedupeByHeight(reps);
      }
    } catch {
      // fall through to the guaranteed baseline below
    }
  }

  if (resolutions.length === 0) {
    resolutions = [{ height: video.height, width: video.width, url: video.fallback_url }];
  }

  for (const res of resolutions) {
    const label = res.height ? `${res.height}p` : "Video";
    formats.push({
      id: res.height ? `${res.height}p` : "video",
      kind: "video",
      label,
      width: res.width,
      height: res.height,
      ext: "mp4",
      delivery: hasAudio ? "mux" : "direct",
      url: res.url,
      audioUrl: hasAudio && audioUrl ? audioUrl : undefined,
    });
  }

  if (hasAudio && audioUrl) {
    formats.push({ id: "audio", kind: "audio", label: "Audio only", ext: "m4a", delivery: "direct", url: audioUrl });
  }

  return { formats, durationSeconds: video.duration };
}
