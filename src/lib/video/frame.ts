export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

export function loadVideoMetadata(video: HTMLVideoElement): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    function onLoaded() {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
    }
    function onError() {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      reject(new Error("We couldn't read that as a video. Try a different file."));
    }
    if (video.readyState >= 1 && video.videoWidth > 0) {
      resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
      return;
    }
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
  });
}

export function formatTimestamp(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
