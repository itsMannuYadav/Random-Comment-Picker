"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Film, Loader2, RotateCcw } from "lucide-react";
import { fetchFile } from "@ffmpeg/util";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { getFFmpeg } from "@/lib/video/ffmpeg";
import { loadVideoMetadata, formatTimestamp, type VideoMeta } from "@/lib/video/frame";
import { formatBytes } from "@/lib/image/format";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("video-to-gif");
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // ffmpeg.wasm is single-threaded and memory-bound in-browser
const MAX_CLIP_SECONDS = 15; // keeps processing time and GIF size sane
const FPS_OPTIONS = [5, 10, 15];

type Stage = "idle" | "loading-engine" | "converting" | "error";

export default function VideoToGifPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(3);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setStart(0);
      setEnd(Math.min(info.duration, MAX_CLIP_SECONDS));
      setWidth(Math.min(480, info.width));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that video.");
    }
  }

  async function generateGif() {
    if (!file || !meta) return;
    setError(null);
    setProgress(0);

    const clipLength = end - start;
    if (clipLength <= 0) {
      setError("End time must be after start time.");
      return;
    }

    const onProgress = ({ progress: p }: { progress: number }) => setProgress(Math.min(1, Math.max(0, p)));
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

    try {
      setStage("loading-engine");
      ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", onProgress);
      setStage("converting");

      const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const inputName = `input.${/^[a-z0-9]{2,5}$/.test(extension) ? extension : "mp4"}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const code = await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        String(start),
        "-to",
        String(end),
        "-vf",
        `fps=${fps},scale=${width}:-1:flags=lanczos`,
        "output.gif",
      ]);

      if (code !== 0) throw new Error("Conversion failed for this video.");

      const data = await ffmpeg.readFile("output.gif");
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "image/gif" });
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url: URL.createObjectURL(blob) };
      });

      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile("output.gif").catch(() => {});
      setStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert that video to a GIF.");
      setStage("error");
    } finally {
      ffmpeg?.off("progress", onProgress);
    }
  }

  function reset() {
    setFile(null);
    setMeta(null);
    setError(null);
    setStage("idle");
    setProgress(0);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  const clipLength = end - start;
  const busy = stage === "loading-engine" || stage === "converting";

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.video.href} className="hover:text-foreground">Video</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Video → GIF</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Video → GIF</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Turn a clip into a GIF, processed entirely in your browser via WebAssembly. The first
          conversion downloads a ~30MB video engine once per session.
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
                controls
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full rounded-lg border border-border"
              />
            </Card>

            {meta && (
              <Card className="flex flex-col gap-5 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Start ({formatTimestamp(start)})
                    <input
                      type="range"
                      min={0}
                      max={meta.duration}
                      step={0.1}
                      value={start}
                      onChange={(e) => {
                        const v = Math.min(Number(e.target.value), end - 0.1);
                        setStart(Math.max(0, v));
                      }}
                      className="accent-[var(--primary)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    End ({formatTimestamp(end)})
                    <input
                      type="range"
                      min={0}
                      max={meta.duration}
                      step={0.1}
                      value={end}
                      onChange={(e) => {
                        const v = Math.max(Number(e.target.value), start + 0.1);
                        setEnd(Math.min(meta.duration, Math.min(v, start + MAX_CLIP_SECONDS)));
                      }}
                      className="accent-[var(--primary)]"
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clip length: {clipLength.toFixed(1)}s (max {MAX_CLIP_SECONDS}s)
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Frame rate</p>
                    <div className="flex gap-2">
                      {FPS_OPTIONS.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFps(f)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            fps === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {f} fps
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Width (px)
                    <input
                      type="number"
                      min={64}
                      max={1280}
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-normal text-foreground"
                    />
                  </label>
                </div>

                <Button size="lg" onClick={generateGif} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                  {stage === "loading-engine"
                    ? "Loading video engine…"
                    : stage === "converting"
                      ? `Converting… ${Math.round(progress * 100)}%`
                      : "Generate GIF"}
                </Button>
              </Card>
            )}

            {result && (
              <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt="Generated GIF" className="h-32 w-auto rounded-lg border border-border object-contain" />
                <div className="flex flex-1 flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{formatBytes(result.blob.size)}</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={result.url}
                      download="output.gif"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                    <Button variant="secondary" className="flex-1" onClick={reset}>
                      <RotateCcw className="h-4 w-4" /> Process Another
                    </Button>
                  </div>
                </div>
              </Card>
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
