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
 * YouTube: investigated and confirmed not viable (2026-09-12). YouTube's
 * Data API has no video-file-download endpoint for third-party videos. The
 * unofficial path (youtubei.js parsing the player response) can decipher the
 * signature cipher with a custom JS sandbox, but the resulting CDN URL is
 * then rejected with 403 by YouTube's separate PoToken/BotGuard anti-bot
 * check at the actual file request — confirmed with a real deciphered URL,
 * correct headers, and matching IP. Bypassing that means emulating YouTube's
 * bot-detection challenge, which is out of scope. See
 * src/integrations/youtube/video.ts.
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
    status: "coming-soon",
    label: "Not supported",
    description:
      "YouTube's official Data API has no video-download endpoint for third-party videos. The unofficial workaround (deciphering YouTube's signature cipher) is solvable, but the resulting URL is then blocked by a separate YouTube anti-bot check (PoToken/BotGuard) before the file is ever served — bypassing that would mean emulating YouTube's bot-detection challenge, which we don't do.",
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
  webpage: {
    status: "available",
    label: "Available",
    description:
      "Paste any public webpage URL and we'll extract the video from its Open Graph metadata, JSON-LD structured data, or <video> tags. Works for most news sites and video-sharing pages that publish their video URL in the page source.",
  },
};
