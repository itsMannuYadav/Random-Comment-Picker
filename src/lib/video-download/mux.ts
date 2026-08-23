import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "@/lib/ffmpeg/client";
import type { DownloadFormat } from "./types";

/**
 * Every byte fetch for a download format — whether it's the final file or
 * one half of a mux pair — goes through this same-origin proxy rather than
 * hitting the source CDN directly from the browser. That forces a real
 * file save via Content-Disposition (a cross-origin `<a download>` is
 * silently ignored) and means the client-side muxing step below never
 * depends on the CDN sending permissive CORS headers.
 */
export function downloadHref(url: string): string {
  return `/api/video-download/file?url=${encodeURIComponent(url)}`;
}

/** Combines a video-only + audio-only format into one playable file via ffmpeg.wasm — no re-encode, just a stream copy. */
export async function muxFormat(format: DownloadFormat, onProgress?: (ratio: number) => void): Promise<Blob> {
  if (format.delivery !== "mux" || !format.audioUrl) {
    throw new Error("This format doesn't need muxing.");
  }

  const ffmpeg = await getFFmpeg();
  const onFfmpegProgress = ({ progress }: { progress: number }) => onProgress?.(Math.min(1, Math.max(0, progress)));
  ffmpeg.on("progress", onFfmpegProgress);

  const suffix = Date.now();
  const videoName = `video_${suffix}.mp4`;
  const audioName = `audio_${suffix}.mp4`;
  const outputName = `output_${suffix}.mp4`;

  try {
    await ffmpeg.writeFile(videoName, await fetchFile(downloadHref(format.url)));
    await ffmpeg.writeFile(audioName, await fetchFile(downloadHref(format.audioUrl)));

    const code = await ffmpeg.exec([
      "-i",
      videoName,
      "-i",
      audioName,
      "-c",
      "copy",
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      outputName,
    ]);
    if (code !== 0) throw new Error("Couldn't combine the video and audio tracks.");

    const data = await ffmpeg.readFile(outputName);
    return new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onFfmpegProgress);
    await ffmpeg.deleteFile(videoName).catch(() => {});
    await ffmpeg.deleteFile(audioName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
