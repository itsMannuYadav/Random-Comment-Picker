"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Copy, Download, ExternalLink, ImageDown, Link2, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { parseYouTubeUrl } from "@/integrations/youtube/parser";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { detectVideoPlatform } from "@/lib/video-download/client-detect";
import type { VideoDownloadInfo } from "@/lib/video-download/types";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

/** One downloadable image, whatever platform it came from. */
interface ThumbnailOption {
  key: string;
  label: string;
  url: string;
  width?: number;
  height?: number;
  /** Same-origin download link that forces a real file save. */
  downloadHref: string;
}

interface ThumbnailInfo {
  title?: string;
  thumbnails: ThumbnailOption[];
}

interface YouTubeThumbnailApiResponse {
  videoId: string;
  title?: string;
  thumbnails: { key: string; label: string; url: string; width: number; height: number }[];
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function aspectRatioLabel(width: number, height: number): string {
  const divisor = gcd(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

const related = getRelatedTools("thumbnail-downloader");

function ThumbnailDownloaderPageInner() {
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [info, setInfo] = useState<ThumbnailInfo | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyUrl(url: string, key: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
    });
  }

  function analyze(rawUrl: string) {
    setNotice(null);
    const raw = rawUrl.trim();
    if (!raw) return;

    startTransition(async () => {
      try {
        // YouTube gets every confirmed-available resolution via the
        // dedicated endpoint; every other platform gets the single
        // thumbnailUrl already returned by the video-download info lookup.
        const ytParsed = parseYouTubeUrl(raw);
        if (ytParsed) {
          const result = await apiFetch<YouTubeThumbnailApiResponse>(`/api/youtube/thumbnails?videoId=${ytParsed.videoId}`);
          setInfo({
            title: result.title,
            thumbnails: result.thumbnails.map((t) => ({
              ...t,
              downloadHref: `/api/youtube/thumbnail-file?videoId=${result.videoId}&key=${t.key}`,
            })),
          });
          return;
        }

        const { platform, resourceId } = await detectVideoPlatform(raw, apiFetch);
        const result = await apiFetch<VideoDownloadInfo>(
          `/api/video-download/info?platform=${encodeURIComponent(platform)}&resourceId=${encodeURIComponent(resourceId)}`,
        );
        if (!result.thumbnailUrl) {
          setInfo(null);
          setNotice("No thumbnail was found for that URL.");
          return;
        }
        setInfo({
          title: result.title,
          thumbnails: [
            {
              key: "thumbnail",
              label: "Thumbnail",
              url: result.thumbnailUrl,
              downloadHref: `/api/video-download/file?url=${encodeURIComponent(result.thumbnailUrl)}`,
            },
          ],
        });
      } catch (err) {
        setInfo(null);
        setNotice(err instanceof ClientApiError ? err.message : "Something went wrong fetching that thumbnail.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    analyze(value);
  }

  useEffect(() => {
    const prefill = searchParams.get("url");
    if (!prefill) return;
    queueMicrotask(() => {
      setValue(prefill);
      analyze(prefill);
    });
    // Only ever run once for the URL this page loaded with — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.images.href} className="hover:text-foreground">
          Images
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Thumbnail Downloader</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Thumbnail Downloader</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Download the thumbnail from a YouTube video, Reddit post, Vimeo video, or any webpage —
          YouTube shows every resolution actually confirmed available via the official API.
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
                placeholder="Paste any video/post URL — YouTube, Reddit, Vimeo, or any website"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Video or post URL"
              />
              {value && (
                <button type="button" onClick={() => setValue("")} aria-label="Clear" className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" disabled={pending || !value.trim()} className="w-full sm:w-auto">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
              Get Thumbnail
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
          {info.title && <p className="mb-4 truncate text-center text-sm text-muted-foreground">{info.title}</p>}

          <div className="flex flex-col gap-4">
            {info.thumbnails.map((thumb, i) => (
              <Card key={thumb.key} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb.url}
                  alt={`${thumb.label} resolution thumbnail`}
                  className="h-24 w-auto shrink-0 self-center rounded-lg border border-border object-cover sm:h-20"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {thumb.label}
                    {i === 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        Best available
                      </span>
                    )}
                  </p>
                  {thumb.width && thumb.height && (
                    <p className="text-sm text-muted-foreground">
                      {thumb.width}×{thumb.height} · {aspectRatioLabel(thumb.width, thumb.height)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={thumb.downloadHref}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <a
                    href={thumb.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </a>
                  <button
                    type="button"
                    onClick={() => copyUrl(thumb.url, thumb.key)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copiedKey === thumb.key ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
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

export default function ThumbnailDownloaderPage() {
  return (
    <Suspense fallback={null}>
      <ThumbnailDownloaderPageInner />
    </Suspense>
  );
}
