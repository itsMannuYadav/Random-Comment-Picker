/**
 * The full set of platforms MyCP knows about. Not all are implemented yet —
 * see `PLATFORM_STATUS` in `src/lib/platform-status.ts` for what's actually live.
 */
export type Platform =
  | "youtube"
  | "reddit"
  | "instagram"
  | "threads"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "x";

export const ALL_PLATFORMS: Platform[] = [
  "youtube",
  "reddit",
  "instagram",
  "threads",
  "facebook",
  "linkedin",
  "tiktok",
  "x",
];

/** Short path prefixes used by the MyCP link system (see planning doc section 9). */
export const PLATFORM_PREFIX: Record<Platform, string> = {
  youtube: "y",
  reddit: "r",
  instagram: "i",
  tiktok: "t",
  threads: "th",
  facebook: "f",
  linkedin: "li",
  x: "x",
};

export const PREFIX_TO_PLATFORM: Record<string, Platform> = Object.fromEntries(
  Object.entries(PLATFORM_PREFIX).map(([platform, prefix]) => [prefix, platform as Platform])
) as Record<string, Platform>;

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  instagram: "Instagram",
  threads: "Threads",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
};
