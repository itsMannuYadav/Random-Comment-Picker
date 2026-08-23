/**
 * Known tracking/attribution parameters, safe to strip because they never
 * change what content a URL points to — only how the click is attributed.
 * Deliberately an allowlist of params to remove, not a denylist of params
 * to keep: stripping "everything we don't recognize" risks breaking a
 * legitimate content param this list doesn't know about (doc's own
 * caution against removing parameters that change actual content).
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_source_platform",
  "utm_creative_format",
  "utm_marketing_tactic",
  "gclid",
  "gclsrc",
  "dclid",
  "fbclid",
  "igshid",
  "igsh",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "ref",
  "ref_src",
  "ref_url",
  "si",
  "spm",
  "scm",
  "_ga",
  "_gl",
  "yclid",
  "twclid",
  "ttclid",
]);

export interface CleanUrlResult {
  original: string;
  clean: string;
  removedParams: string[];
}

export function cleanUrl(input: string): CleanUrlResult | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const removedParams: string[] = [];
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
      removedParams.push(key);
    }
  }

  return { original: input.trim(), clean: url.toString(), removedParams };
}
