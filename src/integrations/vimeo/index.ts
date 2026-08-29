import "server-only";
import { fetchVimeoOEmbed, fetchVimeoDownloads } from "./client";
import { VimeoError } from "./types";
import type { VideoDownloadInfo, DownloadFormat } from "@/lib/video-download/types";

export { VimeoError };

const QUALITY_ORDER: Record<string, number> = { source: 0, hd: 1, sd: 2, mobile: 3 };

function qualityLabel(quality: string, height?: number): string {
  if (height) return `${height}p`;
  switch (quality) {
    case "source": return "Source quality";
    case "hd": return "HD";
    case "sd": return "SD";
    case "mobile": return "Mobile";
    default: return quality;
  }
}

export async function getVimeoVideoInfo(videoId: string): Promise<VideoDownloadInfo> {
  const accessToken = process.env.VIMEO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new VimeoError(
      "Vimeo downloads require a VIMEO_ACCESS_TOKEN — add it to your environment and redeploy.",
      "not-configured",
      503,
    );
  }

  const [oembed, downloads] = await Promise.all([
    fetchVimeoOEmbed(videoId),
    fetchVimeoDownloads(videoId, accessToken),
  ]);

  const sorted = [...(downloads ?? [])].sort(
    (a, b) => (QUALITY_ORDER[a.quality] ?? 9) - (QUALITY_ORDER[b.quality] ?? 9),
  );

  const formats: DownloadFormat[] = sorted.map((item, i) => ({
    id: `${item.quality}-${i}`,
    kind: "video",
    label: qualityLabel(item.quality, item.height),
    width: item.width,
    height: item.height,
    ext: "mp4",
    sizeBytes: item.size,
    delivery: "direct",
    skipProxy: true,
    url: item.link,
  }));

  return {
    platform: "vimeo",
    resourceId: videoId,
    sourceUrl: `https://vimeo.com/${videoId}`,
    title: oembed.title,
    creatorName: oembed.author_name,
    thumbnailUrl: oembed.thumbnail_url,
    durationSeconds: oembed.duration,
    formats,
  };
}
