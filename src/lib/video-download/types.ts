import type { Platform } from "@/types/platform";

export type DownloadFormatKind = "video" | "audio";

export interface DownloadFormat {
  /** Stable key within one VideoDownloadInfo, e.g. "1080p", "720p", "audio". */
  id: string;
  kind: DownloadFormatKind;
  label: string;
  width?: number;
  height?: number;
  ext: "mp4" | "m4a";
  /**
   * How the client should fetch this format:
   * - "direct": a single file at `url`, downloadable/muxable as-is.
   * - "mux": `url` is the video-only track; `audioUrl` is a separate audio
   *   track the client must combine (via ffmpeg.wasm) before it's a normal
   *   playable file.
   */
  delivery: "direct" | "mux";
  url: string;
  audioUrl?: string;
}

export interface VideoDownloadInfo {
  platform: Platform;
  resourceId: string;
  sourceUrl: string;
  title?: string;
  creatorName?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  formats: DownloadFormat[];
}
