const THREADS_HOSTS = new Set(["threads.net", "www.threads.net", "threads.com", "www.threads.com"]);

export interface ParsedThreadsUrl {
  postId: string;
}

export function parseThreadsUrl(input: string): ParsedThreadsUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!THREADS_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const postIndex = segments.indexOf("post");
  const postId = postIndex !== -1 ? segments[postIndex + 1] : undefined;
  if (!postId) return null;
  return { postId };
}
