import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRedditVideoInfo } from "@/integrations/reddit";
import { getInstagramVideoInfo } from "@/integrations/instagram/video";
import { getVimeoVideoInfo } from "@/integrations/vimeo";
import { getYoutubeVideoInfo } from "@/integrations/youtube/video";
import { getWebpageVideoInfo } from "@/lib/video-download/webpage-extractor";
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
  platform: z.enum([...SOCIAL_PLATFORMS, "vimeo", "direct", "webpage"]),
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

  // Confirm it's actually a video. Try HEAD first; fall back to a Range GET
  // for servers that don't support HEAD (some CDNs return 404/405 on HEAD).
  let contentType = "";
  let sizeBytes: number | undefined;
  try {
    let probe = await fetch(rawUrl, { method: "HEAD", cache: "no-store", redirect: "follow" });
    if (!probe.ok) {
      // Fall back to GET with Range: bytes=0-0 to avoid downloading the whole file
      probe = await fetch(rawUrl, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        cache: "no-store",
        redirect: "follow",
      });
    }
    contentType = probe.headers.get("content-type") ?? "";
    const cl = probe.headers.get("content-length") ?? probe.headers.get("content-range")?.match(/\/(\d+)$/)?.[1];
    if (cl) sizeBytes = parseInt(cl as string, 10);
    if (!probe.ok && probe.status !== 206) {
      throw new ApiError("not-found", "That URL returned an error — make sure the link is publicly accessible.");
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("not-found", "We couldn't reach that URL. Make sure it's public and HTTPS.");
  }

  const isHtmlPage = contentType.includes("html") || contentType.includes("xml");
  const isVideoByContentType = !isHtmlPage && DIRECT_VIDEO_CONTENT_TYPES.some((t) => contentType.startsWith(t));
  const isVideoByExtension = DIRECT_VIDEO_EXTENSIONS.has(ext);

  if (isHtmlPage) {
    throw new ApiError(
      "invalid-request",
      "That URL points to a webpage, not a video file. If it's a page with an embedded video, paste the URL without modifying it and we'll extract the video automatically.",
    );
  }
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
      case "youtube":
        return NextResponse.json(await getYoutubeVideoInfo(resourceId));
      case "reddit":
        return NextResponse.json(await getRedditVideoInfo(resourceId));
      case "vimeo":
        return NextResponse.json(await getVimeoVideoInfo(resourceId));
      case "direct":
        return NextResponse.json(await getDirectVideoInfo(resourceId));
      case "instagram":
        return NextResponse.json(await getInstagramVideoInfo(resourceId, undefined));
      case "webpage":
        return NextResponse.json(await getWebpageVideoInfo(resourceId));
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
