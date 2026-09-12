import type { VideoDownloadPlatform } from "./types";

export type VideoDownloadStatusKind = "available" | "requires-connection" | "coming-soon";

export interface VideoDownloadStatusInfo {
  status: VideoDownloadStatusKind;
  label: string;
  /** Always the real, current reason — never a placeholder. */
  description: string;
}

/**
 * Ground-truth video-download capability per platform — deliberately
 * separate from PLATFORM_STATUS in src/lib/platform-status.ts, which
 * describes *comment-picking* capability. The two are independent: Reddit
 * supports both, Instagram supports neither without a connected account.
 * Researched against each platform's current official API documentation
 * (Aug 2026) — see the plan this shipped under for sources. Never derived
 * from credential presence; see the same rationale in platform-status.ts.
 *
 * YouTube is the deliberate exception to "official APIs only": YouTube's
 * Data API has no video-file-download endpoint for third-party videos, full
 * stop, so there is no official path to build this feature against. Support
 * here is implemented by parsing YouTube's public player response (the same
 * unofficial technique tools like yt-dlp use), which YouTube's Terms of
 * Service prohibit and can break without notice whenever YouTube changes
 * that response. See src/integrations/youtube/video.ts.
 */
export const VIDEO_DOWNLOAD_STATUS: Record<VideoDownloadPlatform, VideoDownloadStatusInfo> = {
  reddit: {
    status: "available",
    label: "Available",
    description:
      "Reddit's official API returns direct CDN URLs for Reddit-hosted (v.redd.it) videos, including a manifest of every available resolution and the separate audio track.",
  },
  instagram: {
    status: "requires-connection",
    label: "Requires account connection",
    description:
      "Instagram's Graph API only returns a downloadable media URL for video owned by the connected professional account — there is no public/anonymous video-download endpoint.",
  },
  youtube: {
    status: "available",
    label: "Available (unofficial, unreliable)",
    description:
      "Downloads by parsing YouTube's public player response — the same unofficial technique tools like yt-dlp use, since YouTube's official Data API has no video-download endpoint for third-party videos. This violates YouTube's Terms of Service, and as of this build it frequently fails outright (YouTube's current signature cipher isn't fully solved by the extraction library) — it may work for some videos and not others, with no fix possible on our side beyond waiting for an upstream library update. Only download videos you have the right to download.",
  },
  tiktok: {
    status: "coming-soon",
    label: "Coming soon",
    description:
      "TikTok's Content Posting API is upload-only and its Display API is read-only metadata — neither exposes a video file download endpoint, even for your own content.",
  },
  x: {
    status: "coming-soon",
    label: "Coming soon",
    description:
      "X's API moved to pay-per-use with no free tier in 2026 and doesn't document an arbitrary video-download endpoint — cost-prohibitive to build against at this stage.",
  },
  facebook: {
    status: "coming-soon",
    label: "Coming soon",
    description: "No Facebook integration exists yet to build video download on top of.",
  },
  threads: {
    status: "coming-soon",
    label: "Coming soon",
    description: "Threads' current API doesn't have a confirmed video-download capability to build against yet.",
  },
  linkedin: {
    status: "coming-soon",
    label: "Coming soon",
    description: "No LinkedIn integration exists yet to build video download on top of.",
  },
  vimeo: {
    status: "available",
    label: "Available",
    description:
      "Vimeo's official API exposes download links for videos where the creator has enabled downloads. Requires a VIMEO_ACCESS_TOKEN — see the setup guide in .env.example.",
  },
  direct: {
    status: "available",
    label: "Available",
    description:
      "Paste any public HTTPS direct video link (.mp4, .webm, .mov …) and we'll proxy it through a secure download — no third-party platform needed.",
  },
};
