// Offscreen document (has a DOM + can host Workers, which the background
// service worker cannot) -- combines a captured video-only track and a
// captured audio-only track into one playable file via ffmpeg.wasm, then
// triggers the actual download itself (chrome.downloads.download must be
// called from the same context that created the blob: URL it downloads).

import { FFmpeg } from "./vendor/ffmpeg/index.js";

let ffmpegInstance = null;
async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: chrome.runtime.getURL("offscreen/vendor/core/ffmpeg-core.js"),
    wasmURL: chrome.runtime.getURL("offscreen/vendor/core/ffmpeg-core.wasm"),
  });
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't fetch that stream (${res.status}). It may have expired -- reload the video and try again.`);
  return new Uint8Array(await res.arrayBuffer());
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "MUX") return;

  (async () => {
    const suffix = Date.now();
    const videoName = `v_${suffix}.mp4`;
    const audioName = `a_${suffix}.mp4`;
    const outputName = `out_${suffix}.mp4`;
    const ffmpeg = await getFFmpeg();

    try {
      const [videoBytes, audioBytes] = await Promise.all([
        fetchBytes(message.videoUrl),
        fetchBytes(message.audioUrl),
      ]);
      await ffmpeg.writeFile(videoName, videoBytes);
      await ffmpeg.writeFile(audioName, audioBytes);

      const code = await ffmpeg.exec(["-i", videoName, "-i", audioName, "-c", "copy", "-map", "0:v:0", "-map", "1:a:0", outputName]);
      if (code !== 0) throw new Error("ffmpeg couldn't combine the video and audio tracks.");

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: "video/mp4" });
      const blobUrl = URL.createObjectURL(blob);

      await chrome.downloads.download({ url: blobUrl, filename: message.filename });
      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      await ffmpeg.deleteFile(videoName).catch(() => {});
      await ffmpeg.deleteFile(audioName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  })();

  return true; // async sendResponse
});
