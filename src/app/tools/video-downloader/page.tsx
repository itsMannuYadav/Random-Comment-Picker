"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Film, Link2, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { downloadHref, muxFormat } from "@/lib/video-download/mux";
import type { DownloadFormat, VideoDownloadInfo } from "@/lib/video-download/types";
import { formatTimestamp } from "@/lib/video/frame";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";
import type { Platform } from "@/types/platform";

const related = getRelatedTools("video-downloader");

interface DetectResponse {
  platform: Platform | "unknown";
  resourceId?: string;
  message?: string;
}

type FormatState = { status: "idle" | "preparing" | "ready" | "error"; progress: number; blobUrl?: string; error?: string };

export default function VideoDownloaderPage() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [info, setInfo] = useState<VideoDownloadInfo | null>(null);
  const [formatStates, setFormatStates] = useState<Record<string, FormatState>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;

    setNotice(null);
    setInfo(null);
    setFormatStates({});
    setLoading(true);

    try {
      const det = await apiFetch<DetectResponse>("/api/platform/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value.trim() }),
      });

      if (det.platform === "unknown" || !det.resourceId) {
        setNotice(det.message || "That doesn't look like a supported video URL.");
        return;
      }

      const result = await apiFetch<VideoDownloadInfo>(
        `/api/video-download/info?platform=${det.platform}&resourceId=${encodeURIComponent(det.resourceId)}`
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
      // Same-origin proxy forces a real save via Content-Disposition — a plain link is enough.
      const a = document.createElement("a");
      a.href = downloadHref(format.url);
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
        [format.id]: { status: "error", progress: 0, error: err instanceof Error ? err.message : "Download failed." },
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
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
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
          Download public video from platforms whose official API actually supports it. Only real,
          confirmed resolutions are ever shown — nothing hardcoded, nothing faked.
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
                placeholder="Paste a Reddit video URL"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Video URL"
              />
              {value && (
                <button type="button" onClick={() => setValue("")} aria-label="Clear" className="text-muted-foreground hover:text-foreground">
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
      </section>

      {info && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <Card className="flex flex-col gap-4 p-6 sm:flex-row">
            {info.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.thumbnailUrl} alt="" className="h-28 w-28 shrink-0 self-start rounded-lg border border-border object-cover" />
            )}
            <div className="min-w-0 flex-1">
              {info.title && <p className="font-semibold">{info.title}</p>}
              <p className="mt-1 text-sm text-muted-foreground">
                {info.creatorName && <>{info.creatorName} · </>}
                {info.durationSeconds !== undefined && formatTimestamp(info.durationSeconds)}
              </p>
              <a href={info.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary hover:underline">
                {info.sourceUrl}
              </a>
            </div>
          </Card>

          {videoFormats.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video</p>
              <div className="flex flex-col gap-3">
                {videoFormats.map((format) => (
                  <FormatRow key={format.id} format={format} state={formatStates[format.id]} onDownload={handleDownload} />
                ))}
              </div>
            </div>
          )}

          {audioFormats.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audio</p>
              <div className="flex flex-col gap-3">
                {audioFormats.map((format) => (
                  <FormatRow key={format.id} format={format} state={formatStates[format.id]} onDownload={handleDownload} />
                ))}
              </div>
            </div>
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

function FormatRow({
  format,
  state,
  onDownload,
}: {
  format: DownloadFormat;
  state?: FormatState;
  onDownload: (format: DownloadFormat) => void;
}) {
  const busy = state?.status === "preparing";
  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="font-semibold">{format.label}</p>
        <p className="text-xs text-muted-foreground">
          {format.width && format.height ? `${format.width}×${format.height} · ` : ""}
          {format.ext.toUpperCase()}
          {format.delivery === "mux" ? " · video + audio combined on download" : ""}
        </p>
        {state?.status === "error" && <p className="mt-1 text-xs text-muted-foreground">{state.error}</p>}
      </div>
      <Button size="sm" onClick={() => onDownload(format)} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {Math.round((state?.progress ?? 0) * 100)}%
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" /> Download
          </>
        )}
      </Button>
    </Card>
  );
}
