const X_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);

export interface ParsedXUrl {
  statusId: string;
}

export function parseXUrl(input: string): ParsedXUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!X_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const statusIndex = segments.indexOf("status");
  const statusId = statusIndex !== -1 ? segments[statusIndex + 1] : undefined;
  if (!statusId || !/^\d+$/.test(statusId)) return null;
  return { statusId };
}
