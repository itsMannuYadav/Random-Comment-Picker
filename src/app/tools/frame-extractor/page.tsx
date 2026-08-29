"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { fetchFile } from "@ffmpeg/util";
import { ChevronRight, Download, ImageOff, Loader2, RotateCcw, Scissors } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { getFFmpeg } from "@/lib/ffmpeg/client";
import { loadVideoMetadata, formatTimestamp, type VideoMeta } from "@/lib/video/frame";
import { formatBytes } from "@/lib/image/format";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("frame-extractor");
const MAX_VIDEO_SIZE_BYTES = 300 * 1024 * 1024;
const MAX_FRAMES = 24;

const INTERVALS = [
  { value: 1,  label: "Every 1s" },
  { value: 2,  label: "Every 2s" },
  { value: 5,  label: "Every 5s" },
  { value: 10, label: "Every 10s" },
  { value: 30, label: "Every 30s" },
] as const;

type IntervalValue = (typeof INTERVALS)[number]["value"];
type Stage = "idle" | "loading-engine" | "extracting" | "error";

interface ExtractedFrame {
  index: number;
  timestampSeconds: number;
  blob: Blob;
  url: string;
}

export default function FrameExtractorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [interval, setInterval] = useState<IntervalValue>(2);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleFile(selected: File) {
    setError(null);
    setFrames([]);
    setMeta(null);
    setFile(selected);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  function handleLoadedMetadata() {
    if (!videoRef.current) return;
    loadVideoMetadata(videoRef.current)
      .then(setMeta)
      .catch(() => setError("Couldn't read that video's metadata."));
  }

  async function extract() {
    if (!file || !meta) return;
    setError(null);
    setFrames([]);
    setProgress(0);

    const expectedCount = Math.min(MAX_FRAMES, Math.floor(meta.duration / interval));
    if (expectedCount === 0) {
      setError(`The video is shorter than ${interval}s — try a shorter interval.`);
      return;
    }

    const onProgress = ({ progress: p }: { progress: number }) =>
      setProgress(Math.min(1, Math.max(0, p)));
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

    try {
      setStage("loading-engine");
      ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", onProgress);
      setStage("extracting");

      const srcExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const inputName = `input.${/^[a-z0-9]{2,5}$/.test(srcExt) ? srcExt : "mp4"}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Extract one frame per interval second, up to MAX_FRAMES
      await ffmpeg.exec([
        "-i", inputName,
        "-vf", `fps=1/${interval},trim=end_frame=${expectedCount}`,
        "-vsync", "vfr",
        "-f", "image2",
        "frame-%04d.png",
      ]);

      // Read however many frames were produced
      const extracted: ExtractedFrame[] = [];
      for (let i = 1; i <= expectedCount; i++) {
        const name = `frame-${String(i).padStart(4, "0")}.png`;
        try {
          const data = await ffmpeg.readFile(name);
          const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "image/png" });
          extracted.push({
            index: i,
            timestampSeconds: (i - 1) * interval,
            blob,
            url: URL.createObjectURL(blob),
          });
          await ffmpeg.deleteFile(name).catch(() => {});
        } catch {
          break; // no more frames produced
        }
      }

      await ffmpeg.deleteFile(inputName).catch(() => {});
      setFrames(extracted);
      setStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't extract frames from that video.");
      setStage("error");
    } finally {
      ffmpeg?.off("progress", onProgress);
    }
  }

  function downloadFrame(frame: ExtractedFrame) {
    const a = document.createElement("a");
    a.href = frame.url;
    a.download = `frame-${formatTimestamp(frame.timestampSeconds).replace(":", "m")}s.png`;
    a.click();
  }

  function downloadAll() {
    frames.forEach((frame, i) => {
      setTimeout(() => downloadFrame(frame), i * 120);
    });
  }

  function reset() {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setFile(null);
    setMeta(null);
    setError(null);
    setStage("idle");
    setProgress(0);
    setFrames([]);
    setVideoUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  }

  const busy = stage === "loading-engine" || stage === "extracting";
  const expectedCount = meta ? Math.min(MAX_FRAMES, Math.floor(meta.duration / interval)) : 0;

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
        <span className="text-foreground">Frame Extractor</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Frame Extractor</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Export PNG frames from a video at a chosen time interval — up to {MAX_FRAMES} frames, processed
          entirely in your browser via WebAssembly.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        {!file && (
          <FileDropzone
            onFile={handleFile}
            accept="video/"
            kind="video"
            maxSizeBytes={MAX_VIDEO_SIZE_BYTES}
          />
        )}
        {error && (
          <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {file && (
          <div className="flex flex-col gap-6">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                preload="metadata"
                className="hidden"
                onLoadedMetadata={handleLoadedMetadata}
              />
            )}

            <Card className="flex items-center gap-4 p-5">
              <Scissors className="h-8 w-8 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(file.size)}
                  {meta && ` · ${formatTimestamp(meta.duration)} · ${meta.width}×${meta.height}`}
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-5 p-5">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Extract interval
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTERVALS.map((i) => (
                    <button
                      key={i.value}
                      type="button"
                      onClick={() => setInterval(i.value)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        interval === i.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
                {meta && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    ~{expectedCount} frame{expectedCount !== 1 ? "s" : ""} from this video
                    {expectedCount === MAX_FRAMES && ` (capped at ${MAX_FRAMES})`}
                  </p>
                )}
              </div>

              <Button size="lg" onClick={extract} disabled={busy || !meta || expectedCount === 0}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                {stage === "loading-engine"
                  ? "Loading video engine…"
                  : stage === "extracting"
                    ? `Extracting… ${Math.round(progress * 100)}%`
                    : "Extract Frames"}
              </Button>
            </Card>

            {frames.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {frames.length} frame{frames.length !== 1 ? "s" : ""} extracted
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={downloadAll}>
                      <Download className="h-3.5 w-3.5" /> Download all
                    </Button>
                    <Button size="sm" variant="secondary" onClick={reset}>
                      <RotateCcw className="h-3.5 w-3.5" /> Start over
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {frames.map((frame) => (
                    <button
                      key={frame.index}
                      type="button"
                      onClick={() => downloadFrame(frame)}
                      title={`Download frame at ${formatTimestamp(frame.timestampSeconds)}`}
                      className="group relative overflow-hidden rounded-xl border border-border bg-muted transition-colors hover:border-primary/60"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frame.url}
                        alt={`Frame at ${formatTimestamp(frame.timestampSeconds)}`}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Download className="h-5 w-5 text-white" />
                        <span className="text-xs font-medium text-white">
                          {formatTimestamp(frame.timestampSeconds)}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-left">
                        <p className="text-xs text-white/90">{formatTimestamp(frame.timestampSeconds)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Click any frame to download it as PNG · {formatBytes(frames.reduce((s, f) => s + f.blob.size, 0))} total
                </p>
              </div>
            )}

            {frames.length === 0 && stage === "idle" && file && !error && (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <ImageOff className="h-8 w-8" />
                <p className="text-sm">Frames will appear here after extraction</p>
              </div>
            )}
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
