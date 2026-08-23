import type { Platform } from "@/types/platform";

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
 * supports both, YouTube supports comment-picking but not video download,
 * Instagram supports neither without a connected account. Researched
 * against each platform's current official API documentation (Aug 2026) —
 * see the plan this shipped under for sources. Never derived from
 * credential presence; see the same rationale in platform-status.ts.
 */
export const VIDEO_DOWNLOAD_STATUS: Record<Platform, VideoDownloadStatusInfo> = {
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
    status: "coming-soon",
    label: "Not available",
    description:
      "YouTube's official Data API does not provide video file downloads for any channel other than your own, and downloading otherwise violates YouTube's Terms of Service. No official mechanism exists to build this against.",
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
};
