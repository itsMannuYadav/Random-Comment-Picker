"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Link2, Link2Off, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { loadImageBitmap, encodeCanvas, encodeCoverCanvas } from "@/lib/image/canvas";
import { scaledDimension } from "@/lib/image/resize";
import { formatBytes, FORMAT_EXTENSION, MAX_IMAGE_SIZE_BYTES } from "@/lib/image/format";
import { RESIZE_PRESETS } from "@/lib/image/presets";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("image-resizer");
type Mode = "stretch" | "cover";

export default function ImageResizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [locked, setLocked] = useState(true);
  const [mode, setMode] = useState<Mode>("stretch");
  const [presetId, setPresetId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setWidth(loaded.width);
      setHeight(loaded.height);
      setMode("stretch");
      setPresetId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    }
  }

  function handleWidthChange(value: number) {
    setPresetId(null);
    if (!bitmap) return;
    if (locked) {
      const next = scaledDimension({ width: bitmap.width, height: bitmap.height }, "width", value);
      setWidth(next.width);
      setHeight(next.height);
    } else {
      setWidth(Math.max(1, Math.round(value)));
    }
    setMode("stretch");
  }

  function handleHeightChange(value: number) {
    setPresetId(null);
    if (!bitmap) return;
    if (locked) {
      const next = scaledDimension({ width: bitmap.width, height: bitmap.height }, "height", value);
      setWidth(next.width);
      setHeight(next.height);
    } else {
      setHeight(Math.max(1, Math.round(value)));
    }
    setMode("stretch");
  }

  function applyPreset(id: string, w: number, h: number) {
    setPresetId(id);
    setWidth(w);
    setHeight(h);
    setMode("cover");
  }

  useEffect(() => {
    if (!bitmap || !file || width < 1 || height < 1) return;
    let cancelled = false;
    queueMicrotask(() => !cancelled && setProcessing(true));

    const encode =
      mode === "cover"
        ? encodeCoverCanvas(bitmap, bitmap.width, bitmap.height, width, height, "image/jpeg", 0.92)
        : encodeCanvas(bitmap, width, height, "image/jpeg", 0.92);

    encode
      .then((blob) => {
        if (cancelled) return;
        setResult((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { blob, url: URL.createObjectURL(blob) };
        });
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Resizing failed."))
      .finally(() => !cancelled && setProcessing(false));

    return () => {
      cancelled = true;
    };
  }, [bitmap, file, width, height, mode]);

  function reset() {
    setFile(null);
    setBitmap(null);
    setError(null);
    setPresetId(null);
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
        <span className="text-foreground">Image Resizer</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Image Resizer</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Resize to exact dimensions or a common social preset — processed entirely in your browser.
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resized</p>
                {result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.url} alt="Resized" className="w-full rounded-lg border border-border object-contain" />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {result ? `${formatBytes(result.blob.size)} · ${width}×${height}` : "Resizing…"}
                </p>
              </Card>
            </div>

            <Card className="flex flex-col gap-5 p-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom dimensions</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                    aria-label="Width in pixels"
                  />
                  <button
                    type="button"
                    onClick={() => setLocked((v) => !v)}
                    aria-label={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                    aria-pressed={locked}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                      locked ? "border-primary text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {locked ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                    aria-label="Height in pixels"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social presets</p>
                <div className="flex flex-wrap gap-2">
                  {RESIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id, preset.width, preset.height)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        presetId === preset.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {preset.label}
                      <span className="ml-1 text-muted-foreground/70">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  ))}
                </div>
                {presetId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Preset applied with a center-cropped fill so nothing is stretched.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={result?.url}
                  download={result ? `resized.${FORMAT_EXTENSION["image/jpeg"]}` : undefined}
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
