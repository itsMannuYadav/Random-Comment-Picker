/**
 * Client-side-only image encode helpers. Everything here runs in the
 * browser via Canvas — no upload, per the doc's privacy-first preference
 * for lightweight media operations (§48, §96).
 */

export async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("We couldn't read that as an image. Try a different file.");
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding this image failed."))),
      mimeType,
      quality
    );
  });
}

/** Draws the source stretched to exactly width×height — no cropping, no padding. */
export async function encodeCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported in this browser.");
  ctx.drawImage(source, 0, 0, width, height);
  return canvasToBlob(canvas, mimeType, quality);
}

/**
 * Draws the source scaled up to fully cover a target×target box, center-cropping
 * whatever spills outside it — the same "fill the frame, no bars" behavior most
 * social platforms use when a preset's aspect ratio doesn't match the source.
 */
export async function encodeCoverCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported in this browser.");

  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const dx = (targetWidth - drawWidth) / 2;
  const dy = (targetHeight - drawHeight) / 2;
  ctx.drawImage(source, dx, dy, drawWidth, drawHeight);
  return canvasToBlob(canvas, mimeType, quality);
}
