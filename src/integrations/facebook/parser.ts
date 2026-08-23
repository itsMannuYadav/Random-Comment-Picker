const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"]);

export interface ParsedFacebookUrl {
  /** Best-effort identifier — Facebook's URL shapes vary widely by surface. */
  resourceId: string;
}

export function parseFacebookUrl(input: string): ParsedFacebookUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!FACEBOOK_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const postsIndex = segments.indexOf("posts");
  const videosIndex = segments.indexOf("videos");
  const id =
    (postsIndex !== -1 ? segments[postsIndex + 1] : undefined) ??
    (videosIndex !== -1 ? segments[videosIndex + 1] : undefined) ??
    url.searchParams.get("story_fbid") ??
    (segments.length > 0 ? segments[segments.length - 1] : undefined);

  if (!id) return null;
  return { resourceId: id };
}
