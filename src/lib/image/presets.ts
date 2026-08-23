export interface ResizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

// Long-standing, still-current dimensions as of this writing. Kept in one
// place (doc §21 — "make preset definitions configurable") so they're easy
// to revisit if a platform changes its recommendation.
export const RESIZE_PRESETS: ResizePreset[] = [
  { id: "instagram-square", label: "Instagram Square", width: 1080, height: 1080 },
  { id: "instagram-portrait", label: "Instagram Portrait", width: 1080, height: 1350 },
  { id: "instagram-story", label: "Instagram Story/Reel", width: 1080, height: 1920 },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { id: "facebook-post", label: "Facebook Post", width: 1200, height: 630 },
  { id: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627 },
  { id: "x-post", label: "X Post", width: 1600, height: 900 },
];
