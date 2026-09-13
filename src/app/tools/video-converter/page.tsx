"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchFile } from "@ffmpeg/util";
import { ChevronRight, Download, Loader2, RefreshCcw, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { getFFmpeg } from "@/lib/ffmpeg/client";
import { formatBytes } from "@/lib/image/format";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("video-converter");
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;

const FORMATS = [
  {
    ext: "mp4",
    label: "MP4",
    description: "H.264 video + AAC audio - plays everywhere",
    args: (input: string) => ["-i", input, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart", "output.mp4"],
    mime: "video/mp4",
  },
  {
    ext: "webm",
    label: "WebM",
    description: "VP9 video + Opus audio - optimised for web",
    args: (input: string) => ["-i", input, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "33", "-c:a", "libopus", "output.webm"],
    mime: "video/webm",
  },
] as const;

type FormatExt = (typeof FORMATS)[number]["ext"];
type Stage = "idle" | "loading-engine" | "converting" | "error";

export default function VideoConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetExt, setTargetExt] = useState<FormatExt>("mp4");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; url: string; ext: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(selected: File) {
    setError(null);
    setResult(null);
    setFile(selected);

    // Auto-suggest the opposite format
    const ext = selected.name.split(".").pop()?.toLowerCase();
    setTargetExt(ext === "webm" ? "mp4" : "webm");
  }

  async function convert() {
    if (!file) return;
    setError(null);
    setProgress(0);

    const fmt = FORMATS.find((f) => f.ext === targetExt)!;
    const onProgress = ({ progress: p }: { progress: number }) =>
      setProgress(Math.min(1, Math.max(0, p)));
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

    try {
      setStage("loading-engine");
      ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", onProgress);
      setStage("converting");

      const srcExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const inputName = `input.${/^[a-z0-9]{2,5}$/.test(srcExt) ? srcExt : "mp4"}`;
      const outputName = `output.${targetExt}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const code = await ffmpeg.exec(fmt.args(inputName));
      if (code !== 0) throw new Error("Conversion failed - try a different file or format.");

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: fmt.mime });

      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url: URL.createObjectURL(blob), ext: targetExt };
      });

      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
      setStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert that video.");
      setStage("error");
    } finally {
      ffmpeg?.off("progress", onProgress);
    }
  }

  function reset() {
    setFile(null);
    setError(null);
    setStage("idle");
    setProgress(0);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  const busy = stage === "loading-engine" || stage === "converting";
  const srcExt = file?.name.split(".").pop()?.toLowerCase();

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
        <span className="text-foreground">Video Converter</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Video Converter</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Convert between MP4 and WebM, processed entirely in your browser via WebAssembly - nothing
          is uploaded to a server.
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
            <Card className="flex items-center gap-4 p-5">
              <RefreshCcw className="h-8 w-8 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{file.name}</p>
                <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </Card>

            <Card className="flex flex-col gap-5 p-5">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Convert to
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {FORMATS.map((f) => {
                    const isSame = f.ext === srcExt;
                    return (
                      <button
                        key={f.ext}
                        type="button"
                        disabled={isSame}
                        onClick={() => setTargetExt(f.ext)}
                        className={`flex flex-1 flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          targetExt === f.ext && !isSame
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <span className="font-semibold">{f.label}</span>
                        <span className="text-xs text-muted-foreground">{f.description}</span>
                        {isSame && (
                          <span className="text-xs text-muted-foreground/60">Same as source</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button size="lg" onClick={convert} disabled={busy || srcExt === targetExt}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                {stage === "loading-engine"
                  ? "Loading video engine…"
                  : stage === "converting"
                    ? `Converting… ${Math.round(progress * 100)}%`
                    : `Convert to ${FORMATS.find((f) => f.ext === targetExt)?.label}`}
              </Button>

              {result && (
                <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {result.ext.toUpperCase()} · {formatBytes(result.blob.size)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.blob.size < file.size
                        ? `${Math.round((1 - result.blob.size / file.size) * 100)}% smaller than source`
                        : "Converted successfully"}
                    </p>
                  </div>
                  <a
                    href={result.url}
                    download={`converted.${result.ext}`}
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
