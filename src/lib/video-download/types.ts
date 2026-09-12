import type { Platform } from "@/types/platform";

/** Platforms that the video-downloader supports beyond the comment-picker set. */
export type VideoDownloadPlatform = Platform | "vimeo" | "direct" | "webpage";

export type DownloadFormatKind = "video" | "audio";

export interface DownloadFormat {
  /** Stable key within one VideoDownloadInfo, e.g. "1080p", "720p", "audio". */
  id: string;
  kind: DownloadFormatKind;
  label: string;
  width?: number;
  height?: number;
  ext: "mp4" | "m4a" | "webm" | "mov" | "avi" | "mkv" | "m4v";
  sizeBytes?: number;
  /**
   * How the client should fetch this format:
   * - "direct": a single file at `url`, downloadable/muxable as-is.
   * - "mux": `url` is the video-only track; `audioUrl` is a separate audio
   *   track the client must combine (via ffmpeg.wasm) before it's a normal
   *   playable file.
   */
  delivery: "direct" | "mux";
  /**
   * When true the client routes the download through the /api/video-download/file
   * proxy (forces Content-Disposition, sidesteps CDN CORS). When false the raw
   * `url` is used directly — only set by integrations whose CDN already sends
   * the correct headers (e.g. Vimeo signed download links).
   */
  skipProxy?: boolean;
  url: string;
  audioUrl?: string;
}

export interface VideoDownloadInfo {
  platform: VideoDownloadPlatform;
  resourceId: string;
  sourceUrl: string;
  title?: string;
  creatorName?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  formats: DownloadFormat[];
}
