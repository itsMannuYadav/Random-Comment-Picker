export interface ProfileLinkTemplate {
  id: string;
  label: string;
  buildUrl: (username: string) => string;
}

// Only platforms with a stable, well-documented public profile URL pattern.
// No existence/availability check is performed — see the tool page copy.
export const PROFILE_LINK_TEMPLATES: ProfileLinkTemplate[] = [
  { id: "instagram", label: "Instagram", buildUrl: (u) => `https://instagram.com/${u}` },
  { id: "youtube", label: "YouTube", buildUrl: (u) => `https://youtube.com/@${u}` },
  { id: "x", label: "X", buildUrl: (u) => `https://x.com/${u}` },
  { id: "tiktok", label: "TikTok", buildUrl: (u) => `https://tiktok.com/@${u}` },
  { id: "linkedin", label: "LinkedIn", buildUrl: (u) => `https://linkedin.com/in/${u}` },
  { id: "reddit", label: "Reddit", buildUrl: (u) => `https://reddit.com/user/${u}` },
  { id: "threads", label: "Threads", buildUrl: (u) => `https://threads.net/@${u}` },
  { id: "facebook", label: "Facebook", buildUrl: (u) => `https://facebook.com/${u}` },
];

export function sanitizeUsername(input: string): string | null {
  const trimmed = input.trim().replace(/^@/, "");
  if (!trimmed || /\s|\//.test(trimmed)) return null;
  return trimmed;
}

export function generateProfileLinks(username: string): { id: string; label: string; url: string }[] {
  return PROFILE_LINK_TEMPLATES.map((t) => ({ id: t.id, label: t.label, url: t.buildUrl(username) }));
}
