import "server-only";
import ytdl from "@distube/ytdl-core";
import type { VideoDownloadInfo, DownloadFormat } from "@/lib/video-download/types";

export class YouTubeVideoError extends Error {
  constructor(
    message: string,
    public readonly kind: "not-found" | "not-a-video" | "forbidden" | "invalid-request",
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "YouTubeVideoError";
  }
}

function containerToExt(container: string): DownloadFormat["ext"] {
  return container === "webm" ? "webm" : "mp4";
}

/** Best-bitrate representation per resolution, sorted largest first. */
function dedupeByHeight(formats: ytdl.videoFormat[]): ytdl.videoFormat[] {
  const byHeight = new Map<number, ytdl.videoFormat>();
  for (const f of formats) {
    if (!f.height) continue;
    const existing = byHeight.get(f.height);
    if (!existing || (f.bitrate ?? 0) > (existing.bitrate ?? 0)) {
      byHeight.set(f.height, f);
    }
  }
  return [...byHeight.values()].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
}

/**
 * Extracts downloadable formats by parsing YouTube's public video player
 * response — the same unofficial technique tools like yt-dlp use. YouTube's
 * Data API does not expose file downloads for third-party videos, so there
 * is no official mechanism for this; this relies on an undocumented,
 * unstable surface that YouTube can change at any time, and downloading
 * this way is against YouTube's Terms of Service. See the platform-status
 * entry for the same disclosure surfaced in the UI.
 */
export async function getYoutubeVideoInfo(videoId: string): Promise<VideoDownloadInfo> {
  if (!ytdl.validateID(videoId)) {
    throw new YouTubeVideoError("That doesn't look like a valid YouTube video ID.", "invalid-request", 400);
  }

  let info: ytdl.videoInfo;
  try {
    info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/private/i.test(message)) {
      throw new YouTubeVideoError("This video is private.", "forbidden", 403);
    }
    if (/sign in|age/i.test(message)) {
      throw new YouTubeVideoError("This video is age-restricted and can't be downloaded without sign-in.", "forbidden", 403);
    }
    if (/unavailable|not found|no longer available/i.test(message)) {
      throw new YouTubeVideoError("We couldn't find this video. It may have been deleted or made private.", "not-found", 404);
    }
    throw new YouTubeVideoError(
      "Couldn't read this video's info right now — YouTube may have changed something on their end.",
      "not-found",
      502,
    );
  }

  if (info.videoDetails.isLiveContent) {
    throw new YouTubeVideoError("Live streams can't be downloaded.", "not-a-video", 400);
  }

  const allFormats = info.formats;
  const progressive = dedupeByHeight(allFormats.filter((f) => f.hasVideo && f.hasAudio));
  const videoOnly = dedupeByHeight(allFormats.filter((f) => f.hasVideo && !f.hasAudio));
  const audioOnly = [...allFormats.filter((f) => f.hasAudio && !f.hasVideo)].sort(
    (a, b) => (b.audioBitrate ?? 0) - (a.audioBitrate ?? 0),
  );
  const bestAudio = audioOnly[0];

  const formats: DownloadFormat[] = [];

  for (const f of progressive) {
    formats.push({
      id: `${f.height}p`,
      kind: "video",
      label: `${f.height}p`,
      width: f.width,
      height: f.height,
      ext: containerToExt(f.container),
      sizeBytes: f.contentLength ? Number(f.contentLength) : undefined,
      delivery: "direct",
      url: f.url,
    });
  }

  // Adaptive video-only tracks unlock resolutions above what progressive
  // streams offer (often capped at 720p), at the cost of a client-side mux.
  for (const f of videoOnly) {
    if (progressive.some((p) => p.height === f.height)) continue;
    if (!bestAudio) continue;
    formats.push({
      id: `${f.height}p-mux`,
      kind: "video",
      label: `${f.height}p`,
      width: f.width,
      height: f.height,
      ext: "mp4",
      sizeBytes: f.contentLength ? Number(f.contentLength) : undefined,
      delivery: "mux",
      url: f.url,
      audioUrl: bestAudio.url,
    });
  }

  formats.sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  if (bestAudio) {
    formats.push({
      id: "audio",
      kind: "audio",
      label: "Audio only",
      ext: containerToExt(bestAudio.container) === "webm" ? "webm" : "m4a",
      sizeBytes: bestAudio.contentLength ? Number(bestAudio.contentLength) : undefined,
      delivery: "direct",
      url: bestAudio.url,
    });
  }

  if (formats.length === 0) {
    throw new YouTubeVideoError("No downloadable formats were found for this video.", "not-a-video", 404);
  }

  return {
    platform: "youtube",
    resourceId: videoId,
    sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: info.videoDetails.title,
    creatorName: info.videoDetails.author?.name,
    thumbnailUrl: info.videoDetails.thumbnails?.at(-1)?.url,
    durationSeconds: Number(info.videoDetails.lengthSeconds) || undefined,
    formats,
  };
}
