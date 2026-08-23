/**
 * Single source of truth for the application's own origin and for which
 * provider credentials are actually configured in this environment.
 *
 * Nothing else in the codebase should read `process.env.NEXT_PUBLIC_APP_URL`
 * or a provider API key directly — go through here so that (a) a future
 * domain migration is a one-line env change and (b) the UI can honestly
 * report what's configured vs. missing instead of pretending everything
 * works.
 */

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "MyCP",
  url: stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export interface CredentialStatus {
  /** Every env var this integration needs, and whether it's currently set. */
  required: Record<string, boolean>;
  configured: boolean;
}

function checkVars(names: string[]): CredentialStatus {
  const required: Record<string, boolean> = {};
  for (const name of names) {
    required[name] = Boolean(process.env[name] && process.env[name]!.length > 0);
  }
  return { required, configured: Object.values(required).every(Boolean) };
}

/**
 * Credential status per platform, computed lazily (env vars are only
 * guaranteed to be populated at request time on most hosts).
 */
export function getCredentialStatus() {
  return {
    youtube: checkVars(["YOUTUBE_API_KEY"]),
    reddit: checkVars(["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"]),
    instagram: checkVars(["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"]),
  } as const;
}

/** HMAC secret used to sign self-contained draw verification tokens. */
export function getDrawSecret(): string {
  const secret = process.env.DRAW_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DRAW_SECRET is not configured. Set it in your production environment before running draws."
    );
  }
  // Deterministic dev-only fallback so local development works without setup.
  // Draw tokens signed with this secret are NOT valid once a real secret is set.
  return "dev-only-insecure-draw-secret-do-not-use-in-production";
}
