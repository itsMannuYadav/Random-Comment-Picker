const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

export interface ParsedInstagramUrl {
  mediaCode: string;
  mediaType: "p" | "reel" | "tv";
}

/** Parses an Instagram post/reel URL into its shortcode. */
export function parseInstagramUrl(input: string): ParsedInstagramUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const [type, code] = segments;
  if ((type === "p" || type === "reel" || type === "tv") && code && /^[A-Za-z0-9_-]+$/.test(code)) {
    return { mediaCode: code, mediaType: type };
  }
  return null;
}
