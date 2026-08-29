import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRedditVideoInfo } from "@/integrations/reddit";
import { getInstagramVideoInfo } from "@/integrations/instagram/video";
import { getVimeoVideoInfo, VimeoError } from "@/integrations/vimeo";
import { VIDEO_DOWNLOAD_STATUS } from "@/lib/video-download/platform-status";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";
import type { VideoDownloadInfo, DownloadFormat } from "@/lib/video-download/types";

const SOCIAL_PLATFORMS = [
  "youtube",
  "reddit",
  "instagram",
  "tiktok",
  "facebook",
  "x",
  "threads",
  "linkedin",
] as const;

const querySchema = z.object({
  platform: z.enum([...SOCIAL_PLATFORMS, "vimeo", "direct"]),
  resourceId: z.string().min(1).max(2048),
});

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

const DIRECT_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]);
const DIRECT_VIDEO_CONTENT_TYPES = ["video/", "audio/"];

function isPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1") return true;
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

async function getDirectVideoInfo(rawUrl: string): Promise<VideoDownloadInfo> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ApiError("invalid-request", "That doesn't look like a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new ApiError("invalid-request", "Only HTTPS direct video links are supported.");
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new ApiError("invalid-request", "That URL points to a private or reserved address.");
  }

  const ext = parsed.pathname.split(".").pop()?.toLowerCase() ?? "";

  // Confirm it's actually a video via HEAD before committing to a download
  let contentType = "";
  let sizeBytes: number | undefined;
  try {
    const head = await fetch(rawUrl, { method: "HEAD", cache: "no-store" });
    contentType = head.headers.get("content-type") ?? "";
    const cl = head.headers.get("content-length");
    if (cl) sizeBytes = parseInt(cl, 10);
    if (!head.ok) throw new ApiError("not-found", "That URL returned an error — make sure the link is publicly accessible.");
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("not-found", "We couldn't reach that URL. Make sure it's public and HTTPS.");
  }

  const isVideoByContentType = DIRECT_VIDEO_CONTENT_TYPES.some((t) => contentType.startsWith(t));
  const isVideoByExtension = DIRECT_VIDEO_EXTENSIONS.has(ext);

  if (!isVideoByContentType && !isVideoByExtension) {
    throw new ApiError(
      "invalid-request",
      "That URL doesn't appear to be a video file. We support direct links to .mp4, .webm, .mov and similar formats.",
    );
  }

  const resolvedExt =
    contentType.includes("webm") ? "webm" :
    contentType.includes("quicktime") || ext === "mov" ? "mov" :
    DIRECT_VIDEO_EXTENSIONS.has(ext) ? (ext as DownloadFormat["ext"]) :
    "mp4";

  const filename = parsed.pathname.split("/").pop() ?? "video";
  const title = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

  return {
    platform: "direct",
    resourceId: rawUrl,
    sourceUrl: rawUrl,
    title: title || undefined,
    formats: [
      {
        id: "direct",
        kind: contentType.startsWith("audio/") ? "audio" : "video",
        label: "Direct link",
        ext: resolvedExt,
        sizeBytes,
        delivery: "direct",
        url: rawUrl,
      },
    ],
  };
}

export async function GET(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`video-download:info:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're checking too quickly. Please slow down.");
    }

    const parsed = querySchema.safeParse({
      platform: req.nextUrl.searchParams.get("platform"),
      resourceId: req.nextUrl.searchParams.get("resourceId"),
    });
    if (!parsed.success) {
      throw new ApiError("invalid-request", "A valid platform and resource ID are required.");
    }
    const { platform, resourceId } = parsed.data;

    switch (platform) {
      case "reddit":
        return NextResponse.json(await getRedditVideoInfo(resourceId));
      case "vimeo":
        return NextResponse.json(await getVimeoVideoInfo(resourceId));
      case "direct":
        return NextResponse.json(await getDirectVideoInfo(resourceId));
      case "instagram":
        return NextResponse.json(await getInstagramVideoInfo(resourceId, undefined));
      default:
        throw new ApiError(
          "unsupported-platform",
          VIDEO_DOWNLOAD_STATUS[platform as keyof typeof VIDEO_DOWNLOAD_STATUS]?.description ??
            "Video download isn't supported for this platform.",
        );
    }
  } catch (error) {
    return apiErrorResponse(error);
  }
}
