# MyCP — My Comment Picker

A fair, transparent random comment picker for giveaways. Paste a YouTube or
Reddit URL, filter the comments, and run a cryptographically secure draw
with a publicly verifiable result page.

> Pick a winner. Make it fair.

## What's real here

Every platform integration in this repo calls the platform's **official**
API — there is no HTML scraping, no reverse-engineered endpoints, and no
fake/mocked responses. If a platform isn't wired up yet (Instagram OAuth,
Threads, Facebook, LinkedIn, TikTok, X), the UI says so honestly instead of
pretending it works — see [Platform status](#platform-status) below.

## Architecture

```text
src/
  app/                  Next.js App Router — pages + API routes
  integrations/         One folder per platform: parser, client, mapper, types
    youtube/             Real — YouTube Data API v3
    reddit/               Real — Reddit app-only OAuth
    instagram/            Real client code, gated behind account connection (not built yet)
    threads/ facebook/ linkedin/ tiktok/ x/   URL detection only — "coming soon"
  core/
    url-detection/        Paste-a-URL → platform + resource ID
    comment-engine/       Filter pipeline (dedupe, keyword, date range, ...)
    random/                Secure random draw engine (Web Crypto, never Math.random())
    verification/         Signed, self-contained draw result tokens
    rate-limit/            Per-IP request throttling
  components/            UI (picker flow, homepage, layout, primitives)
  types/                  Platform + NormalizedComment — the shape every
                          integration maps into, so the rest of the app never
                          needs to know which platform a comment came from
extension/              Manifest V3 browser extension (no API keys inside)
```

Every platform maps its raw API response into one shared `NormalizedComment`
shape (`src/types/comment.ts`) before it touches the filter or draw engine —
neither of those has any platform-specific logic in them.

### No database, and that's deliberate

There's no database in V1. Instead, a completed draw's full record is
serialized, HMAC-signed, and embedded directly in its `/draw/[token]` URL —
the result page verifies itself on load with no lookup required. This is
what makes the whole thing work statelessly on Vercel's serverless runtime
without any persistent process. See `src/core/verification/token.ts` for the
reasoning and the swap-in point for real persistence once accounts/draw
history ship.

### Random selection

`src/core/random/secureRandom.ts` draws from `crypto.getRandomValues` with
rejection sampling (no modulo bias) and does an unbiased Fisher-Yates
partial shuffle to pick winners without replacement. Every draw also
records a SHA-256 hash of the canonically-ordered candidate pool
(`src/core/verification/hash.ts`), so a result can be checked against
tampering without re-running the draw.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in whatever credentials you have
npm run dev
```

Open <http://localhost:3000>. Nothing needs a live API key to explore the
UI — platforms without credentials configured show an honest "not
configured" state (see the platform cards on the homepage) instead of
failing silently.

```bash
npm run build   # production build
npm run lint
npm test        # vitest — URL parsing, filters, random engine, draw tokens
```

## Environment variables

See [`.env.example`](.env.example) for the full list with setup notes.
Summary:

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Every generated link | The app's own origin — see [Domain migration](#domain-migration) |
| `YOUTUBE_API_KEY` | YouTube | [Google Cloud Console](https://console.cloud.google.com/apis/credentials), enable "YouTube Data API v3" |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Reddit | Create a "script" app at [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) |
| `DRAW_SECRET` | Creating draws in production | `openssl rand -base64 32` — dev has an insecure fallback |
| `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET` | Future Instagram OAuth | Client code exists in `src/integrations/instagram/client.ts`; there's no account-connection flow yet, so it's unreachable regardless |

## Platform status

| Platform | Status | Notes |
| --- | --- | --- |
| YouTube | Available | Full pagination, replies resolved beyond the ~5 YouTube inlines per thread |
| Reddit | Available | App-only OAuth, full "more comments" tree expansion |
| Instagram | Requires account connection | Graph API client is real and ready; needs an OAuth connect flow that isn't built |
| Threads / Facebook / LinkedIn / TikTok / X | Coming soon | No suitable official API for this use case yet — see planning notes before building these |

Ground truth lives in `src/lib/platform-status.ts`. The homepage merges it
with live credential presence (`src/lib/env.server.ts`) so the platform
cards say exactly which env var is missing, never just "it doesn't work."

## Deploying

```text
GitHub → Vercel → Production
```

No VPS, no persistent process, no filesystem writes. Set the environment
variables above in the Vercel project settings and deploy.

### Domain migration

`NEXT_PUBLIC_APP_URL` is the single source of truth for the app's origin —
nothing else in the codebase hard-codes a domain. Moving to a new domain is:

1. Add the custom domain in Vercel.
2. Update `NEXT_PUBLIC_APP_URL`.
3. Update `MYCP_APP_URL` in `extension/utils/config.js` and reload the
   extension.
4. Update OAuth callback URLs on each platform's developer console once
   those flows exist.
5. Redeploy.

## Browser extension

`extension/` is a standalone Manifest V3 extension — see
[`extension/README.md`](extension/README.md) for what it does and how to
load it unpacked. It holds no API credentials; it only detects a supported
page and opens the matching MyCP URL.

## Security notes

- The URL parser only recognizes an explicit allow-list of platform
  domains (`src/integrations/*/parser.ts`) — there is no generic
  "fetch whatever URL the user pasted" path, so this isn't an SSRF vector.
- All provider secrets are server-only env vars, never `NEXT_PUBLIC_*`, and
  never sent to the browser extension.
- The draw engine never uses `Math.random()`.
- Draw result tokens are HMAC-signed; a tampered token fails verification
  and 404s rather than rendering forged results.
