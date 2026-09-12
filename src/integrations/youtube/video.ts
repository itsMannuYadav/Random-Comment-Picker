import "server-only";

export class YouTubeVideoError extends Error {
  constructor(
    message: string,
    public readonly kind: "not-found" | "not-a-video" | "forbidden" | "invalid-request",
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "YouTubeVideoError";
  }
}

/**
 * YouTube has no official download endpoint for third-party videos. The
 * unofficial path (parsing the player response, deciphering the signature
 * cipher) can be made to work, but the deciphered CDN URL is then rejected
 * with a 403 by YouTube's separate PoToken/BotGuard anti-bot check — the
 * actual file is never served to a script. Defeating that would mean
 * emulating YouTube's bot-detection challenge, which we don't do. See the
 * platform-status entry for the same disclosure in the UI.
 */
export async function getYoutubeVideoInfo(videoId: string): Promise<never> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new YouTubeVideoError("That doesn't look like a valid YouTube video ID.", "invalid-request", 400);
  }
  throw new YouTubeVideoError(
    "YouTube downloads aren't supported. YouTube has no official download endpoint, and even the unofficial signature-cipher workaround gets blocked by YouTube's separate anti-bot check (PoToken/BotGuard) at the actual file request — we don't attempt to defeat that.",
    "forbidden",
    403,
  );
}
