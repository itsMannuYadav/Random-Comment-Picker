const LINKEDIN_HOSTS = new Set(["linkedin.com", "www.linkedin.com"]);

export interface ParsedLinkedInUrl {
  resourceId: string;
}

export function parseLinkedInUrl(input: string): ParsedLinkedInUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!LINKEDIN_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const activityIndex = segments.findIndex((s) => s === "posts" || s === "feed");
  const id = activityIndex !== -1 ? segments[segments.length - 1] : undefined;
  if (!id) return null;
  return { resourceId: id };
}
