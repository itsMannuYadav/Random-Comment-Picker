"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Film,
  Link2,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileVideo,
} from "lucide-react";
import { SiVimeo } from "react-icons/si";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { downloadHref, muxFormat } from "@/lib/video-download/mux";
import { detectVideoPlatform } from "@/lib/video-download/client-detect";
import type { DownloadFormat, VideoDownloadInfo, VideoDownloadPlatform } from "@/lib/video-download/types";
import { VIDEO_DOWNLOAD_STATUS } from "@/lib/video-download/platform-status";
import { formatTimestamp } from "@/lib/video/frame";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";
import { cn } from "@/lib/cn";

const related = getRelatedTools("video-downloader");

// Platforms shown in the status grid, in display order.
// Vimeo and direct are always shown; social platforms shown with their honest status.
const GRID_PLATFORMS: { id: VideoDownloadPlatform; label: string; color: string }[] = [
  { id: "reddit",    label: "Reddit",       color: "#FF4500" },
  { id: "vimeo",     label: "Vimeo",        color: "#1AB7EA" },
  { id: "direct",    label: "Direct link",  color: "#6366f1" },
  { id: "youtube",   label: "YouTube",      color: "#FF0000" },
  { id: "instagram", label: "Instagram",    color: "#C13584" },
  { id: "tiktok",    label: "TikTok",       color: "#000000" },
  { id: "x",         label: "X",            color: "#000000" },
  { id: "facebook",  label: "Facebook",     color: "#1877F2" },
];

/** Real logos where we have one; PlatformIcon covers the comment-picker
 * platform set, Vimeo gets its own real logo here, and "direct link" is
 * generic (there's no brand to show). */
function GridPlatformIcon({ platform, color }: { platform: VideoDownloadPlatform; color: string }) {
  if (platform === "vimeo") {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ background: color }}
        aria-hidden="true"
      >
        <SiVimeo className="h-[55%] w-[55%]" />
      </span>
    );
  }
  if (platform === "direct" || platform === "webpage") {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ background: color }}
        aria-hidden="true"
      >
        <Download className="h-[55%] w-[55%]" />
      </span>
    );
  }
  return <PlatformIcon platform={platform} className="h-7 w-7" />;
}

type FormatState = {
  status: "idle" | "preparing" | "ready" | "error";
  progress: number;
  blobUrl?: string;
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoDownloaderPage() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [info, setInfo] = useState<VideoDownloadInfo | null>(null);
  const [formatStates, setFormatStates] = useState<Record<string, FormatState>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) return;

    setNotice(null);
    setInfo(null);
    setFormatStates({});
    setLoading(true);

    try {
      const { platform, resourceId } = await detectVideoPlatform(raw, apiFetch);
      const result = await apiFetch<VideoDownloadInfo>(
        `/api/video-download/info?platform=${encodeURIComponent(platform)}&resourceId=${encodeURIComponent(resourceId)}`,
      );
      setInfo(result);
    } catch (err) {
      setNotice(err instanceof ClientApiError ? err.message : "Something went wrong checking that URL.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(format: DownloadFormat) {
    if (format.delivery === "direct") {
      const a = document.createElement("a");
      // Vimeo (skipProxy) — use the signed URL directly; the CDN already sends
      // Content-Disposition: attachment. Everything else routes through our proxy.
      a.href = format.skipProxy ? format.url : downloadHref(format.url);
      a.download = "";
      a.click();
      return;
    }

    setFormatStates((s) => ({ ...s, [format.id]: { status: "preparing", progress: 0 } }));
    try {
      const blob = await muxFormat(format, (progress) => {
        setFormatStates((s) => ({ ...s, [format.id]: { status: "preparing", progress } }));
      });
      const blobUrl = URL.createObjectURL(blob);
      setFormatStates((s) => ({ ...s, [format.id]: { status: "ready", progress: 1, blobUrl } }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${info?.resourceId ?? "video"}-${format.label.replace(/\s+/g, "-")}.mp4`;
      a.click();
    } catch (err) {
      setFormatStates((s) => ({
        ...s,
        [format.id]: {
          status: "error",
          progress: 0,
          error: err instanceof Error ? err.message : "Download failed.",
        },
      }));
    }
  }

  function reset() {
    for (const state of Object.values(formatStates)) {
      if (state.blobUrl) URL.revokeObjectURL(state.blobUrl);
    }
    setValue("");
    setInfo(null);
    setNotice(null);
    setFormatStates({});
  }

  const videoFormats = info?.formats.filter((f) => f.kind === "video") ?? [];
  const audioFormats = info?.formats.filter((f) => f.kind === "audio") ?? [];

  return (
    <main id="main-content">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6"
      >
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.video.href} className="hover:text-foreground">Video</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Video Downloader</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Video Downloader</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Paste any public video URL - Reddit, YouTube, Vimeo, a direct file, or any webpage that
          embeds a video. Only real formats are shown; no fake resolutions.
        </p>

        <div className="mx-auto w-full max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-3 px-3 py-2">
              <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Paste any video URL - YouTube, Reddit, Vimeo, or any website"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Video URL"
              />
              {value && (
                <button
                  type="button"
                  onClick={() => setValue("")}
                  aria-label="Clear"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" disabled={loading || !value.trim()} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              Check Video
            </Button>
          </form>

          {notice && (
            <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          )}
        </div>

        {/* Platform status grid — always visible when no result is shown */}
        {!info && <PlatformGrid />}
      </section>

      {info && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          {/* Video metadata card */}
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
            {info.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.thumbnailUrl}
                alt=""
                className="h-24 w-24 shrink-0 self-start rounded-lg border border-border object-cover sm:h-28 sm:w-28"
              />
            )}
            <div className="min-w-0 flex-1">
              {info.title && <p className="font-semibold leading-snug">{info.title}</p>}
              <p className="mt-1 text-sm text-muted-foreground">
                {info.creatorName && <>{info.creatorName} · </>}
                {info.platform !== "direct" && (
                  <span className="capitalize">{info.platform}</span>
                )}
                {info.durationSeconds !== undefined && (
                  <> · {formatTimestamp(info.durationSeconds)}</>
                )}
              </p>
              <a
                href={info.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-xs text-primary hover:underline"
              >
                {info.sourceUrl}
              </a>
            </div>
          </Card>

          {/* Format groups */}
          {videoFormats.length > 0 && (
            <FormatGroup
              label="Video"
              formats={videoFormats}
              states={formatStates}
              onDownload={handleDownload}
            />
          )}
          {audioFormats.length > 0 && (
            <FormatGroup
              label="Audio only"
              formats={audioFormats}
              states={formatStates}
              onDownload={handleDownload}
            />
          )}

          {info.platform === "direct" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Tip: if your browser plays the video instead of saving it, right-click the video and choose
              &ldquo;Save video as…&rdquo;
            </p>
          )}

          <Button variant="secondary" className="mt-6 w-full sm:w-auto" onClick={reset}>
            Check Another
          </Button>
        </section>
      )}

      {related.length > 0 && (
        <section className="border-t border-border/70 bg-muted/30 py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Platform status grid
// ---------------------------------------------------------------------------

function PlatformGrid() {
  return (
    <div className="w-full max-w-2xl">
      <p className="mb-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Platform support
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GRID_PLATFORMS.map((p) => {
          const statusInfo = VIDEO_DOWNLOAD_STATUS[p.id];
          return (
            <PlatformStatusCard
              key={p.id}
              platform={p.id}
              color={p.color}
              label={p.label}
              statusInfo={statusInfo}
            />
          );
        })}
      </div>
    </div>
  );
}

function PlatformStatusCard({
  platform,
  color,
  label,
  statusInfo,
}: {
  platform: VideoDownloadPlatform;
  color: string;
  label: string;
  statusInfo: { status: string; label: string; description: string };
}) {
  const isAvailable = statusInfo.status === "available";
  const isRequiresConnection = statusInfo.status === "requires-connection";

  return (
    <div
      className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
      title={statusInfo.description}
    >
      <div className="flex items-start justify-between gap-2">
        <GridPlatformIcon platform={platform} color={color} />
        {/* Status dot */}
        {isAvailable ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
        ) : isRequiresConnection ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-yellow-500" />
        ) : (
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        )}
      </div>
      <div>
        <p className="text-xs font-semibold leading-tight">{label}</p>
        <p
          className={cn(
            "mt-0.5 text-[0.65rem] font-medium leading-tight",
            isAvailable
              ? "text-green-600 dark:text-green-400"
              : isRequiresConnection
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-muted-foreground/60",
          )}
        >
          {statusInfo.label}
        </p>
      </div>
      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-56 rounded-lg border border-border bg-popover p-2.5 text-[0.7rem] leading-snug text-muted-foreground shadow-md group-hover:block">
        {statusInfo.description}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Format group + row
// ---------------------------------------------------------------------------

function FormatGroup({
  label,
  formats,
  states,
  onDownload,
}: {
  label: string;
  formats: DownloadFormat[];
  states: Record<string, FormatState>;
  onDownload: (format: DownloadFormat) => void;
}) {
  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-2.5">
        {formats.map((format, i) => (
          <FormatRow
            key={format.id}
            format={format}
            isBest={i === 0 && formats.length > 1}
            state={states[format.id]}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
}

function FormatRow({
  format,
  isBest,
  state,
  onDownload,
}: {
  format: DownloadFormat;
  isBest: boolean;
  state?: FormatState;
  onDownload: (format: DownloadFormat) => void;
}) {
  const busy = state?.status === "preparing";

  return (
    <Card className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <FileVideo className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{format.label}</p>
            {isBest && (
              <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-accent-foreground">
                Best
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {format.width && format.height ? `${format.width}×${format.height} · ` : ""}
            {format.ext.toUpperCase()}
            {format.sizeBytes ? ` · ${formatBytes(format.sizeBytes)}` : ""}
            {format.delivery === "mux" ? " · video+audio combined on download" : ""}
          </p>
          {state?.status === "error" && (
            <p className="mt-1 text-xs text-destructive">{state.error}</p>
          )}
        </div>
      </div>

      <Button size="sm" onClick={() => onDownload(format)} disabled={busy} className="shrink-0">
        {busy ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {Math.round((state?.progress ?? 0) * 100)}%
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />
            Download
          </>
        )}
      </Button>
    </Card>
  );
}
