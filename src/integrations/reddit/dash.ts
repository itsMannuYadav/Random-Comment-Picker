/**
 * Minimal, targeted parser for the shape of DASH MPD manifest Reddit serves
 * for v.redd.it videos — not a general-purpose XML/DASH library. Pulls out
 * <AdaptationSet mimeType="..."> blocks and the <Representation> elements
 * inside them (id/width/height/bandwidth attributes + a <BaseURL> child),
 * resolving each BaseURL against the manifest's own URL the way DASH
 * players do. A regex-based extractor is deliberately chosen over a real
 * XML DOM (no such parser is built into the Node runtime this API route
 * runs in, and pulling in a dependency for this one narrow, trusted-source
 * shape isn't worth it) — safe here specifically because the input always
 * comes from Reddit's own CDN, and every caller falls back to the
 * single-resolution data already in the post JSON if this returns nothing
 * or throws.
 */
export interface DashRepresentation {
  id: string;
  mimeType: "video" | "audio";
  width?: number;
  height?: number;
  bandwidth?: number;
  url: string;
}

function numAttr(attrs: string, name: string): number | undefined {
  const match = new RegExp(`\\b${name}="([^"]+)"`).exec(attrs);
  return match ? Number(match[1]) : undefined;
}

function strAttr(attrs: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]+)"`).exec(attrs)?.[1];
}

export function parseDashManifest(xml: string, manifestUrl: string): DashRepresentation[] {
  const results: DashRepresentation[] = [];
  let baseDir: URL;
  try {
    baseDir = new URL(".", manifestUrl);
  } catch {
    return results;
  }

  const adaptationSetRe = /<AdaptationSet\b([^>]*)>([\s\S]*?)<\/AdaptationSet>/g;
  let setMatch: RegExpExecArray | null;

  while ((setMatch = adaptationSetRe.exec(xml))) {
    const setAttrs = setMatch[1];
    const setMime = strAttr(setAttrs, "mimeType") ?? strAttr(setAttrs, "contentType");
    const mimeType: "video" | "audio" | null = setMime?.startsWith("video")
      ? "video"
      : setMime?.startsWith("audio")
        ? "audio"
        : null;
    if (!mimeType) continue;

    const block = setMatch[2];
    const repRe = /<Representation\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Representation>)/g;
    let repMatch: RegExpExecArray | null;

    while ((repMatch = repRe.exec(block))) {
      const attrs = repMatch[1];
      const inner = repMatch[2] ?? "";
      const id = strAttr(attrs, "id") ?? "";
      const baseUrlText = /<BaseURL>([^<]+)<\/BaseURL>/.exec(inner)?.[1]?.trim();
      if (!baseUrlText) continue;

      let resolved: string;
      try {
        resolved = new URL(baseUrlText, baseDir).toString();
      } catch {
        continue;
      }

      results.push({
        id,
        mimeType,
        width: numAttr(attrs, "width"),
        height: numAttr(attrs, "height"),
        bandwidth: numAttr(attrs, "bandwidth"),
        url: resolved,
      });
    }
  }

  return results;
}
