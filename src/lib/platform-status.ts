import type { Platform } from "@/types/platform";

export type PlatformStatusKind =
  | "available"
  | "beta"
  | "requires-connection"
  | "coming-soon";

export interface PlatformStatusInfo {
  status: PlatformStatusKind;
  label: string;
  /** Short explanation shown in the UI, never a lie about what works. */
  description: string;
}

/**
 * Ground-truth implementation status per platform. This is intentionally a
 * static map, not derived from credential presence — a platform can have an
 * env var set and still be architecturally unimplemented (e.g. Threads).
 * Keep this in sync with `src/integrations/**`.
 */
export const PLATFORM_STATUS: Record<Platform, PlatformStatusInfo> = {
  youtube: {
    status: "available",
    label: "Available",
    description: "Fetches comments via the official YouTube Data API v3.",
  },
  reddit: {
    status: "available",
    label: "Available",
    description: "Fetches comments via the official Reddit API (app-only OAuth).",
  },
  instagram: {
    status: "requires-connection",
    label: "Requires account connection",
    description:
      "Instagram's Graph API only returns comments on media owned by the connected professional account.",
  },
  threads: {
    status: "coming-soon",
    label: "Coming soon",
    description: "Waiting on suitable public comment-read access in the Threads API.",
  },
  facebook: {
    status: "coming-soon",
    label: "Coming soon",
    description: "Requires Page connection and Meta app review before comments can be read.",
  },
  linkedin: {
    status: "coming-soon",
    label: "Coming soon",
    description: "LinkedIn's API does not currently expose public comment retrieval.",
  },
  tiktok: {
    status: "coming-soon",
    label: "Coming soon",
    description: "Waiting on official TikTok API access for comment retrieval.",
  },
  x: {
    status: "coming-soon",
    label: "Coming soon",
    description: "X API access for this use case is cost-prohibitive at this stage.",
  },
};
