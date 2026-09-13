"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { loadImageBitmap, encodeCanvas } from "@/lib/image/canvas";
import { detectSupportedOutputFormats, formatBytes, percentSaved, FORMAT_LABEL, FORMAT_EXTENSION, MAX_IMAGE_SIZE_BYTES, type OutputFormat } from "@/lib/image/format";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("image-compressor");

export default function ImageCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<OutputFormat[]>(["image/png", "image/jpeg"]);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectSupportedOutputFormats().then(setSupportedFormats);
  }, []);

  async function handleFile(selected: File) {
    setError(null);
    setResult(null);
    try {
      const loaded = await loadImageBitmap(selected);
      setFile(selected);
      setOriginalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(selected);
      });
      setBitmap(loaded);
      const preferred: OutputFormat = selected.type === "image/png" ? "image/png" : "image/jpeg";
      setFormat(preferred);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    }
  }

  useEffect(() => {
    if (!bitmap || !file) return;
    let cancelled = false;
    queueMicrotask(() => !cancelled && setProcessing(true));

    encodeCanvas(bitmap, bitmap.width, bitmap.height, format, format === "image/png" ? undefined : quality / 100)
      .then((blob) => {
        if (cancelled) return;
        setResult((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { blob, url: URL.createObjectURL(blob) };
        });
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Compression failed."))
      .finally(() => !cancelled && setProcessing(false));

    return () => {
      cancelled = true;
    };
  }, [bitmap, file, format, quality]);

  const saved = useMemo(
    () => (file && result ? percentSaved(file.size, result.blob.size) : 0),
    [file, result]
  );

  function reset() {
    setFile(null);
    setBitmap(null);
    setError(null);
    setOriginalUrl((prev) => {
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
        <Link href={CATEGORY_BY_ID.images.href} className="hover:text-foreground">Images</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Image Compressor</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Image Compressor</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Shrink an image right in your browser. Nothing is uploaded - the file never leaves your device.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        {!file && <FileDropzone onFile={handleFile} accept="image/" kind="image" maxSizeBytes={MAX_IMAGE_SIZE_BYTES} />}
        {error && (
          <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {file && bitmap && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {originalUrl && <img src={originalUrl} alt="Original" className="w-full rounded-lg border border-border object-contain" />}
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatBytes(file.size)} · {bitmap.width}×{bitmap.height}
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compressed</p>
                {result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.url} alt="Compressed" className="w-full rounded-lg border border-border object-contain" />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {result ? `${formatBytes(result.blob.size)} · Saved ${saved}%` : "Processing…"}
                </p>
              </Card>
            </div>

            <Card className="flex flex-col gap-5 p-5">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Quality</span>
                  <span>{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={quality}
                  disabled={format === "image/png"}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--primary)] disabled:opacity-40"
                />
                {format === "image/png" && (
                  <p className="mt-1 text-xs text-muted-foreground">PNG is lossless - quality doesn&rsquo;t apply.</p>
                )}
              </div>

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

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={result?.url}
                  download={result ? `compressed.${FORMAT_EXTENSION[format]}` : undefined}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                  aria-disabled={!result || processing}
                >
                  <Download className="h-4 w-4" /> Download
                </a>
                <Button variant="secondary" className="flex-1" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Process Another
                </Button>
              </div>
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
