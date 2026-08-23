/**
 * Single source of truth for the application's own origin — safe to import
 * from both client and server code. Nothing else in the codebase should
 * read `process.env.NEXT_PUBLIC_APP_URL` directly, so a future domain
 * migration (planning doc section 61) is a one-line env change.
 *
 * Server-only secrets and credential checks live in `src/lib/env.server.ts`.
 */

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "MySocial",
  url: stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};
