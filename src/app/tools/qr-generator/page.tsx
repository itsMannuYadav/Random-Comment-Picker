"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { ChevronRight, Download, QrCode as QrCodeIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ToolCard } from "@/components/ui/tool-card";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("qr-generator");
const SIZES = [200, 300, 400, 500] as const;
const ERROR_LEVELS = [
  { value: "L", label: "Low" },
  { value: "M", label: "Medium" },
  { value: "Q", label: "Quartile" },
  { value: "H", label: "High" },
] as const;

function QrGeneratorPageInner() {
  const searchParams = useSearchParams();
  const [text, setText] = useState(() => searchParams.get("text") ?? "");
  const [size, setSize] = useState<(typeof SIZES)[number]>(300);
  const [margin, setMargin] = useState(2);
  const [errorLevel, setErrorLevel] = useState<(typeof ERROR_LEVELS)[number]["value"]>("M");
  const [foreground, setForeground] = useState("#14110d");
  const [background, setBackground] = useState("#ffffff");
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!text.trim()) {
      queueMicrotask(() => {
        if (cancelled) return;
        setPngUrl(null);
        setSvgMarkup(null);
        setError(null);
      });
      return () => {
        cancelled = true;
      };
    }

    const options = {
      width: size,
      margin,
      errorCorrectionLevel: errorLevel,
      color: { dark: foreground, light: background },
    };

    Promise.all([
      QRCode.toDataURL(text, options),
      QRCode.toString(text, { ...options, type: "svg" as const }),
    ])
      .then(([dataUrl, svg]) => {
        if (cancelled) return;
        setPngUrl(dataUrl);
        setSvgMarkup(svg);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't generate a QR code for that text.");
        setPngUrl(null);
        setSvgMarkup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [text, size, margin, errorLevel, foreground, background]);

  function downloadSvg() {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
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
        <span className="text-foreground">QR Generator</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">QR Generator</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Generate a QR code for a link, video or any text — processed entirely in your browser.
        </p>
      </section>

      <section className="mx-auto grid max-w-3xl grid-cols-1 gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_280px]">
        <Card className="flex flex-col gap-5 p-5">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Content
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a URL or type any text"
              rows={3}
              className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Size</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    size === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Error correction
            </p>
            <div className="flex flex-wrap gap-2">
              {ERROR_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setErrorLevel(level.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    errorLevel === level.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Foreground
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Background
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-transparent"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Margin ({margin} modules)
            <input
              type="range"
              min={0}
              max={8}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="accent-[var(--primary)]"
            />
          </label>
        </Card>

        <Card className="flex flex-col items-center gap-4 p-5">
          {pngUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngUrl} alt="Generated QR code" className="w-full rounded-lg border border-border" />
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
              <QrCodeIcon className="h-8 w-8" />
              {error ? error : "Enter content to generate a QR code"}
            </div>
          )}

          {pngUrl && (
            <div className="flex w-full flex-col gap-2">
              <a
                href={pngUrl}
                download="qr-code.png"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
              >
                <Download className="h-4 w-4" /> Download PNG
              </a>
              <button
                type="button"
                onClick={downloadSvg}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <Download className="h-4 w-4" /> Download SVG
              </button>
            </div>
          )}
        </Card>
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

export default function QrGeneratorPage() {
  return (
    <Suspense fallback={null}>
      <QrGeneratorPageInner />
    </Suspense>
  );
}
