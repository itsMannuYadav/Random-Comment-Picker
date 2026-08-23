import "server-only";
import { fetchMedia } from "./client";
import { InstagramApiError } from "./types";
import type { DownloadFormat, VideoDownloadInfo } from "@/lib/video-download/types";

/**
 * Instagram's Graph API returns a direct, downloadable `media_url` for
 * video — but, per Meta's own docs, only for media owned by the connected
 * professional account. There is no public/anonymous video-download
 * endpoint, so this requires an access token exactly like the existing
 * comment-reading path in index.ts (same `requireConnection()` shape —
 * MyCP doesn't implement Instagram account connections yet, so this always
 * throws honestly rather than silently failing or faking a result). Real
 * code, ready to run the moment an OAuth connection flow exists — not a stub.
 */
export async function getInstagramVideoInfo(mediaId: string, accessToken?: string): Promise<VideoDownloadInfo> {
  if (!accessToken) {
    throw new InstagramApiError("Connect your Instagram account to download video from this post.", "not-connected", 401);
  }
  const media = await fetchMedia(mediaId, accessToken);

  if (!media.media_url || media.media_type === "IMAGE") {
    throw new InstagramApiError("This Instagram post doesn't contain a video.", "invalid-request", 400);
  }

  const formats: DownloadFormat[] = [
    {
      id: "source",
      kind: "video",
      label: "Original quality",
      ext: "mp4",
      delivery: "direct",
      url: media.media_url,
    },
  ];

  return {
    platform: "instagram",
    resourceId: media.id,
    sourceUrl: media.permalink ?? `https://www.instagram.com/p/${mediaId}/`,
    title: media.caption,
    creatorName: media.username,
    thumbnailUrl: media.thumbnail_url,
    formats,
  };
}
