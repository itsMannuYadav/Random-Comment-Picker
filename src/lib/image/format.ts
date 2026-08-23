export type OutputFormat = "image/png" | "image/jpeg" | "image/webp" | "image/avif";

// Generous for a browser-side canvas op, bounded against accidental huge uploads.
export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

export const FORMAT_LABEL: Record<OutputFormat, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
};

export const FORMAT_EXTENSION: Record<OutputFormat, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Formats every browser we support has always been able to encode via canvas. */
const BASELINE_FORMATS: OutputFormat[] = ["image/png", "image/jpeg"];

/** Formats worth probing because real-world support still varies. */
const PROBE_FORMATS: OutputFormat[] = ["image/webp", "image/avif"];

/**
 * Canvas silently falls back to PNG when asked to encode a mime type it
 * doesn't actually support (`toBlob` never rejects for an unknown type) —
 * so the only honest way to know what this browser can produce is to try
 * encoding a throwaway canvas and check the blob's real type matches what
 * was requested. Never assume WebP/AVIF encode support from a version
 * check or a hardcoded list (planning doc §91 — don't claim a format
 * exists if it doesn't).
 */
export async function detectSupportedOutputFormats(): Promise<OutputFormat[]> {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return BASELINE_FORMATS;
  ctx.fillRect(0, 0, 2, 2);

  const supported = [...BASELINE_FORMATS];
  for (const type of PROBE_FORMATS) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type));
    if (blob && blob.type === type) supported.push(type);
  }
  return supported;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function percentSaved(originalBytes: number, newBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.max(0, Math.round((1 - newBytes / originalBytes) * 100));
}
