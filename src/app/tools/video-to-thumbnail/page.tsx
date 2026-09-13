"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, RotateCcw, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { encodeCanvas } from "@/lib/image/canvas";
import { detectSupportedOutputFormats, FORMAT_LABEL, FORMAT_EXTENSION, type OutputFormat } from "@/lib/image/format";
import { loadVideoMetadata, formatTimestamp, type VideoMeta } from "@/lib/video/frame";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("video-to-thumbnail");
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // browser-side seek+draw, not a full transcode — generous but bounded

const TIME_PRESETS = [
  { label: "Start", fraction: 0 },
  { label: "25%", fraction: 0.25 },
  { label: "50%", fraction: 0.5 },
  { label: "75%", fraction: 0.75 },
];

export default function VideoToThumbnailPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [time, setTime] = useState(0);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [supportedFormats, setSupportedFormats] = useState<OutputFormat[]>(["image/png", "image/jpeg"]);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectSupportedOutputFormats().then(setSupportedFormats);
  }, []);

  async function handleFile(selected: File) {
    setError(null);
    setResult(null);
    setMeta(null);
    setFile(selected);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  async function handleLoadedMetadata() {
    if (!videoRef.current) return;
    try {
      const info = await loadVideoMetadata(videoRef.current);
      setMeta(info);
      setTime(Math.min(1, info.duration * 0.1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that video.");
    }
  }

  function seekTo(seconds: number) {
    if (!videoRef.current || !meta) return;
    const clamped = Math.min(Math.max(seconds, 0), meta.duration);
    setTime(clamped);
    videoRef.current.currentTime = clamped;
  }

  async function captureFrame() {
    if (!videoRef.current || !meta) return;
    setCapturing(true);
    setError(null);
    try {
      const blob = await encodeCanvas(videoRef.current, meta.width, meta.height, format, format === "image/png" ? undefined : 0.92);
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url: URL.createObjectURL(blob) };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't capture that frame.");
    } finally {
      setCapturing(false);
    }
  }

  function reset() {
    setFile(null);
    setMeta(null);
    setError(null);
    setTime(0);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.video.href} className="hover:text-foreground">Video</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Video → Thumbnail</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Video → Thumbnail</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Grab a still frame from any point in a video you upload - processed entirely in your browser.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        {!file && (
          <FileDropzone onFile={handleFile} accept="video/" kind="video" maxSizeBytes={MAX_VIDEO_SIZE_BYTES} />
        )}
        {error && (
          <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {file && videoUrl && (
          <div className="flex flex-col gap-6">
            <Card className="p-4">
              <video
                ref={videoRef}
                src={videoUrl}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full rounded-lg border border-border"
              />

              {meta && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatTimestamp(time)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={meta.duration}
                      step={0.01}
                      value={time}
                      onChange={(e) => seekTo(Number(e.target.value))}
                      className="w-full accent-[var(--primary)]"
                    />
                    <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatTimestamp(meta.duration)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => seekTo(meta.duration * preset.fraction)}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="flex flex-col gap-5 p-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output format</p>
                <div className="flex flex-wrap gap-2">
                  {supportedFormats
                    .filter((f) => f !== "image/avif")
                    .map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFormat(f)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          format === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {FORMAT_LABEL[f]}
                      </button>
                    ))}
                </div>
              </div>

              <Button size="lg" onClick={captureFrame} disabled={!meta || capturing}>
                <Camera className="h-4 w-4" /> Capture Frame
              </Button>

              {result && (
                <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.url} alt="Captured frame" className="h-24 w-auto rounded-lg border border-border object-cover" />
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                    <a
                      href={result.url}
                      download={`frame.${FORMAT_EXTENSION[format]}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                    <Button variant="secondary" className="flex-1" onClick={reset}>
                      <RotateCcw className="h-4 w-4" /> Process Another
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </section>

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
