"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QrScanner from "qr-scanner";
import { ChevronRight, Upload, Camera, Copy, ExternalLink, ScanQrCode, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";
import { cn } from "@/lib/cn";

const related = getRelatedTools("qr-scanner");

function isProbablyUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function QrScannerPage() {
  const [mode, setMode] = useState<"upload" | "camera">("upload");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function decodeFile(file: File) {
    setError(null);
    setResult(null);
    try {
      const scanResult = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      setResult(scanResult.data);
    } catch {
      setError("No QR code was found in that image.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) decodeFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) decodeFile(file);
  }

  // Camera mode: create/destroy the scanner as the video element mounts and
  // unmounts (switching modes, or leaving the page).
  useEffect(() => {
    if (mode !== "camera" || !videoRef.current) return;

    setError(null);
    let cancelled = false;

    const scanner = new QrScanner(
      videoRef.current,
      (scanResult) => setResult(scanResult.data),
      { highlightScanRegion: true, highlightCodeOutline: true },
    );
    scannerRef.current = scanner;

    scanner.start().catch((err) => {
      if (cancelled) return;
      setError(
        err instanceof Error && /permission/i.test(err.message)
          ? "Camera access was denied. Allow camera access to scan, or upload an image instead."
          : "Couldn't access a camera on this device. Try uploading an image instead.",
      );
    });

    return () => {
      cancelled = true;
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [mode]);

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function reset() {
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.utilities.href} className="hover:text-foreground">Utilities</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">QR Scanner</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">QR Scanner</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Decode a QR code from an uploaded image or your camera — processed entirely in your
          browser, nothing ever uploaded to a server.
        </p>

        <div className="flex w-full max-w-md rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => {
              setMode("upload");
              reset();
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("camera");
              reset();
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              mode === "camera" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Camera className="h-4 w-4" /> Camera
          </button>
        </div>

        <div className="w-full max-w-md">
          {mode === "upload" ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
              )}
            >
              <ScanQrCode className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Drop a QR code image here, or <span className="font-semibold text-primary">browse</span>
              </span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
            </label>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        {error && (
          <p className="max-w-md text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {result && (
          <Card className="flex w-full max-w-md flex-col gap-3 p-5 text-left">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 break-words text-sm">{result}</p>
              <button type="button" onClick={reset} aria-label="Scan another" className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={copyResult}>
                <Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy"}
              </Button>
              {isProbablyUrl(result) && (
                <Button asChild size="sm">
                  <a href={result} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Open link
                  </a>
                </Button>
              )}
            </div>
          </Card>
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
