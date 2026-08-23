import "server-only";

/**
 * Server-only credential/secret helpers. Kept out of `src/lib/env.ts` (which
 * is safe to import from client components for `appConfig`) so nothing here
 * can end up in a client bundle by accident.
 */

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
    ai: checkVars(["AI_PROVIDER_API_KEY"]),
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
