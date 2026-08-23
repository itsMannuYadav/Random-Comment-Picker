"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { ImageDropzone } from "@/components/tools/image-dropzone";
import { loadImageBitmap, encodeCanvas } from "@/lib/image/canvas";
import { detectSupportedOutputFormats, formatBytes, FORMAT_LABEL, FORMAT_EXTENSION, type OutputFormat } from "@/lib/image/format";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("image-converter");

// A good default for lossy re-encodes when the tool isn't offering a quality control of its own.
const DEFAULT_QUALITY = 0.92;

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<OutputFormat[]>(["image/png", "image/jpeg"]);
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectSupportedOutputFormats().then((formats) => {
      setSupportedFormats(formats);
    });
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
      // Default to a format the source isn't already in, so the button visibly does something.
      const target = supportedFormats.find((f) => f !== selected.type) ?? supportedFormats[0] ?? "image/png";
      setFormat(target as OutputFormat);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    }
  }

  useEffect(() => {
    if (!bitmap || !file) return;
    let cancelled = false;
    queueMicrotask(() => !cancelled && setProcessing(true));

    encodeCanvas(bitmap, bitmap.width, bitmap.height, format, format === "image/png" ? undefined : DEFAULT_QUALITY)
      .then((blob) => {
        if (cancelled) return;
        setResult((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { blob, url: URL.createObjectURL(blob) };
        });
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Conversion failed."))
      .finally(() => !cancelled && setProcessing(false));

    return () => {
      cancelled = true;
    };
  }, [bitmap, file, format]);

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
        <span className="text-foreground">Image Converter</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Image Converter</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Convert an image between PNG, JPEG and WebP entirely in your browser. Only formats this
          browser can actually encode are offered.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        {!file && <ImageDropzone onFile={handleFile} />}
        {error && (
          <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {file && bitmap && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Original · {file.type.replace("image/", "").toUpperCase()}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {originalUrl && <img src={originalUrl} alt="Original" className="w-full rounded-lg border border-border object-contain" />}
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatBytes(file.size)} · {bitmap.width}×{bitmap.height}
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Converted · {FORMAT_LABEL[format]}
                </p>
                {result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.url} alt="Converted" className="w-full rounded-lg border border-border object-contain" />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {result ? formatBytes(result.blob.size) : "Converting…"}
                </p>
              </Card>
            </div>

            <Card className="flex flex-col gap-5 p-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convert to</p>
                <div className="flex flex-wrap gap-2">
                  {supportedFormats.map((f) => (
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
                  download={result ? `converted.${FORMAT_EXTENSION[format]}` : undefined}
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
