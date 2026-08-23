const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "vm.tiktok.com"]);

export interface ParsedTikTokUrl {
  videoId: string;
}

export function parseTikTokUrl(input: string): ParsedTikTokUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!TIKTOK_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const videoIndex = segments.indexOf("video");
  const videoId = videoIndex !== -1 ? segments[videoIndex + 1] : undefined;
  if (!videoId || !/^\d+$/.test(videoId)) return null;
  return { videoId };
}
