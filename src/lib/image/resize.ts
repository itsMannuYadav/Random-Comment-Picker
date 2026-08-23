export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Given a changed width or height and the original aspect ratio, computes
 * the locked counterpart dimension. Both outputs are always >= 1px.
 */
export function scaledDimension(original: Dimensions, changed: "width" | "height", value: number): Dimensions {
  const ratio = original.width / original.height;

  if (changed === "width") {
    const width = Math.max(1, Math.round(value));
    return { width, height: Math.max(1, Math.round(width / ratio)) };
  }

  const height = Math.max(1, Math.round(value));
  return { width: Math.max(1, Math.round(height * ratio)), height };
}
