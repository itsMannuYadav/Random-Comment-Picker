"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchFile } from "@ffmpeg/util";
import { ChevronRight, Download, Loader2, Music, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { getFFmpeg } from "@/lib/ffmpeg/client";
import { formatBytes } from "@/lib/image/format";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("audio-converter");
const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024;

// Confirmed encoders in the ffmpeg-core build actually in use (libmp3lame,
// libvorbis) — never list a format this build can't really produce.
const FORMATS = [
  { ext: "mp3", label: "MP3" },
  { ext: "wav", label: "WAV" },
  { ext: "ogg", label: "OGG" },
] as const;

type Stage = "idle" | "loading-engine" | "converting" | "error";

export default function AudioConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<(typeof FORMATS)[number]["ext"]>("mp3");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(selected: File) {
    setError(null);
    setResult(null);
    setFile(selected);
  }

  async function convert() {
    if (!file) return;
    setError(null);
    setProgress(0);

    const onProgress = ({ progress: p }: { progress: number }) => setProgress(Math.min(1, Math.max(0, p)));
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

    try {
      setStage("loading-engine");
      ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", onProgress);
      setStage("converting");

      const sourceExt = file.name.split(".").pop()?.toLowerCase() || "audio";
      const inputName = `input.${/^[a-z0-9]{2,5}$/.test(sourceExt) ? sourceExt : "audio"}`;
      const outputName = `output.${format}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const code = await ffmpeg.exec(["-i", inputName, outputName]);
      if (code !== 0) throw new Error("Conversion failed for this file.");

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: `audio/${format}` });
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url: URL.createObjectURL(blob) };
      });

      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
      setStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert that file.");
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

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.audio.href} className="hover:text-foreground">Audio</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Audio Converter</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Audio Converter</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Convert between MP3, WAV and OGG, processed entirely in your browser via WebAssembly.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        {!file && (
          <FileDropzone onFile={handleFile} accept="audio/" kind="audio" maxSizeBytes={MAX_AUDIO_SIZE_BYTES} />
        )}
        {error && (
          <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {file && (
          <div className="flex flex-col gap-6">
            <Card className="p-5">
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
            </Card>

            <Card className="flex flex-col gap-5 p-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convert to</p>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.ext}
                      type="button"
                      onClick={() => setFormat(f.ext)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        format === f.ext ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button size="lg" onClick={convert} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
                {stage === "loading-engine"
                  ? "Loading audio engine…"
                  : stage === "converting"
                    ? `Converting… ${Math.round(progress * 100)}%`
                    : "Convert"}
              </Button>

              {result && (
                <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                  <p className="flex-1 text-sm text-muted-foreground">{formatBytes(result.blob.size)}</p>
                  <a
                    href={result.url}
                    download={`converted.${format}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                  <Button variant="secondary" onClick={reset}>
                    <RotateCcw className="h-4 w-4" /> Process Another
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
