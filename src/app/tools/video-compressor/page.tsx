"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { fetchFile } from "@ffmpeg/util";
import { ChevronRight, Clapperboard, Download, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { getFFmpeg } from "@/lib/ffmpeg/client";
import { loadVideoMetadata, type VideoMeta } from "@/lib/video/frame";
import { formatBytes, percentSaved } from "@/lib/image/format";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("video-compressor");
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;

const QUALITY_PRESETS = [
  { id: "high",   label: "High",   crf: 20, description: "Minimal quality loss, larger file" },
  { id: "medium", label: "Medium", crf: 26, description: "Good balance of size and quality" },
  { id: "low",    label: "Low",    crf: 32, description: "Smaller file, noticeable compression" },
] as const;

const RESOLUTION_CAPS = [
  { id: "original", label: "Original",  height: null },
  { id: "1080p",    label: "1080p",     height: 1080 },
  { id: "720p",     label: "720p",      height: 720  },
  { id: "480p",     label: "480p",      height: 480  },
] as const;

type QualityId = (typeof QUALITY_PRESETS)[number]["id"];
type ResolutionId = (typeof RESOLUTION_CAPS)[number]["id"];
type Stage = "idle" | "loading-engine" | "compressing" | "error";

export default function VideoCompressorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [quality, setQuality] = useState<QualityId>("medium");
  const [resolution, setResolution] = useState<ResolutionId>("original");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(selected: File) {
    setError(null);
    setResult(null);
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

  async function compress() {
    if (!file) return;
    setError(null);
    setProgress(0);

    const preset = QUALITY_PRESETS.find((p) => p.id === quality)!;
    const resCap = RESOLUTION_CAPS.find((r) => r.id === resolution)!;
    const onProgress = ({ progress: p }: { progress: number }) =>
      setProgress(Math.min(1, Math.max(0, p)));
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

    try {
      setStage("loading-engine");
      ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", onProgress);
      setStage("compressing");

      const srcExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const inputName = `input.${/^[a-z0-9]{2,5}$/.test(srcExt) ? srcExt : "mp4"}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Scale filter: -2 keeps the dimension divisible by 2 (libx264 requirement).
      // Only applied when the source is larger than the cap.
      const needsScale =
        resCap.height !== null && meta && meta.height > resCap.height;
      const vf = needsScale ? `scale=-2:${resCap.height}` : null;

      const args: string[] = ["-i", inputName, "-c:v", "libx264", "-preset", "fast", "-crf", String(preset.crf)];
      if (vf) args.push("-vf", vf);
      args.push("-c:a", "aac", "-movflags", "+faststart", "output.mp4");

      const code = await ffmpeg.exec(args);
      if (code !== 0) throw new Error("Compression failed - try a lower quality setting or smaller file.");

      const data = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });

      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url: URL.createObjectURL(blob) };
      });

      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile("output.mp4").catch(() => {});
      setStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't compress that video.");
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
    setVideoUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setResult((prev) => { if (prev) URL.revokeObjectURL(prev.url); return null; });
  }

  const busy = stage === "loading-engine" || stage === "compressing";

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
        <span className="text-foreground">Video Compressor</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Video Compressor</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Reduce the file size of any video you upload - choose your quality target and an optional
          resolution cap. Runs entirely in your browser via WebAssembly.
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
            {/* Hidden video element for metadata */}
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                preload="metadata"
                className="hidden"
                onLoadedMetadata={handleLoadedMetadata}
              />
            )}

            {/* Source info */}
            <Card className="flex items-center gap-4 p-5">
              <Clapperboard className="h-8 w-8 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(file.size)}
                  {meta && ` · ${meta.width}×${meta.height}`}
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-6 p-5">
              {/* Quality */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quality
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {QUALITY_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setQuality(p.id)}
                      className={`flex flex-1 flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors ${
                        quality === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className="font-semibold">{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Max resolution
                </p>
                <div className="flex flex-wrap gap-2">
                  {RESOLUTION_CAPS.map((r) => {
                    const belowSource = !meta || r.height === null || meta.height >= r.height;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={!belowSource}
                        onClick={() => setResolution(r.id)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          resolution === r.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {r.label}
                        {!belowSource && " ↑"}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Caps marked ↑ are above your source - they won&apos;t upscale.
                </p>
              </div>

              <Button size="lg" onClick={compress} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
                {stage === "loading-engine"
                  ? "Loading video engine…"
                  : stage === "compressing"
                    ? `Compressing… ${Math.round(progress * 100)}%`
                    : "Compress Video"}
              </Button>

              {result && (
                <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatBytes(result.blob.size)}
                      {result.blob.size < file.size && (
                        <span className="ml-2 text-green-600 dark:text-green-400">
                          {percentSaved(file.size, result.blob.size)}% smaller
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Original: {formatBytes(file.size)}
                    </p>
                  </div>
                  <a
                    href={result.url}
                    download="compressed.mp4"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                  <Button variant="secondary" onClick={reset}>
                    <RotateCcw className="h-4 w-4" /> Start Over
                  </Button>
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
