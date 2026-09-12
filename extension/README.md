# MySocial Browser Extension

A Manifest V3 extension. Detects when you're on a supported YouTube, Reddit
or Instagram page and lets you pick a comment winner, download the video,
or grab its thumbnail — all natively inside the extension, no redirect to
the website for the core action.

**Rule this extension follows:** every website capability must be reachable
from here. Where there's no technical reason it can't run in the extension
directly, it does (Comment Picker, Video Downloader, Thumbnail Downloader).
Where a website tool has no reason to need extension-side execution (AI
generators, image/audio/video utilities, QR generator, URL analyzer), a
one-click deep link is enough — see "Analyze" below.

- No API keys or secrets: see planning doc section 59.
- `utils/config.js` holds the one thing that changes when the app migrates
  domains: `MYSOCIAL_APP_URL`.

## What it offers

- **Pick Winner** — native extension page (`pages/comment-picker/`). Fetches
  the post/video's comments and runs the same signed draw as the website's
  `/y` `/r` `/i` routes, calling `/api/*/comments` + `/api/draw` directly.
  Shows the winner(s) inline, plus a link to the public `/draw/[token]`
  verification page (that link is meant to be shared externally by design —
  the actual draw already ran and completed inside the extension).
- **Get Thumbnail** — native extension page (`pages/thumbnail-downloader/`).
  YouTube gets every confirmed-available resolution via the dedicated
  endpoint; every other platform (Reddit, Vimeo, direct links, arbitrary
  webpages) gets the thumbnail already returned by
  `/api/video-download/info`.
- **Download Video** — native extension page (`pages/video-downloader/`).
  Works for Reddit, Vimeo, Instagram, direct links, and the webpage
  extractor (anything `/api/video-download/info` supports) by calling the
  backend directly and downloading/muxing inside the extension via
  `chrome.downloads` and the offscreen ffmpeg document described below.
  **YouTube is not handled by this page** — see the next section for why it
  has its own separate mechanism entirely.
- **Analyze** — deep link into the website's URL Analyzer. No technical
  reason this needs to run natively, so a link is all it gets (see the rule
  above).

## How YouTube download works, and why it's separate from everything else

The website's own Video Downloader tool (`src/integrations/youtube/video.ts`)
deliberately does **not** support YouTube: YouTube's stream URLs are gated by
a signature cipher, and even once deciphered, the actual file request is
blocked by a separate anti-bot check (PoToken/BotGuard) unless the request
comes from something YouTube can verify is a real browser. Defeating that
check server-side would mean emulating YouTube's bot-detection challenge,
which this project does not do.

This extension sidesteps that problem entirely by not needing to pass as a
browser — it *is* one. It runs inside the user's own real Chrome, on a page
the user is already legitimately watching, and only ever uses stream URLs
that YouTube's own player already requested and was served during normal
playback:

1. **`content/inject.js`** runs in the *page's own* JS context (manifest
   `"world": "MAIN"`) — not the extension's isolated world — so it can read
   `window.ytInitialPlayerResponse` and intercept the page's own `fetch()`
   calls to `/youtubei/v1/player` (the endpoint YouTube's single-page app
   calls internally on every client-side video navigation). This is reading
   data the page already has, not extracting or deciphering anything.
2. **`content/youtube-watch.js`** (isolated world) relays that data to the
   background service worker via `chrome.runtime.sendMessage`.
3. **`background/background.js`** watches `*.googlevideo.com/videoplayback`
   requests via `chrome.webRequest.onBeforeRequest` (observe-only) as the
   user plays the video, and records the itag + URL for each quality the
   player actually requests. A URL only ever appears here *after* the real
   player used it and YouTube served it — nothing is requested speculatively.
4. Progressive (single-file, audio+video already combined) formats that
   YouTube didn't bother ciphering download immediately with no need to
   press play at all. Anything above that resolution is adaptive
   (video-only + audio-only tracks) — once both have been captured during
   playback, `offscreen/offscreen.js` runs ffmpeg.wasm (bundled locally under
   `offscreen/vendor/`, not fetched at runtime) to combine them into one
   file, then triggers the download itself.

The popup's YouTube quality list lives inline (not in a separate extension
page like the other tools) since it's driven by live capture state, not a
one-shot backend lookup.

**Practical implication:** a quality is only downloadable once the user has
actually played the video at (or near) that quality — the popup shows
"Locked — play the video at this quality to unlock it" for anything not yet
captured. This is a real constraint, not a bug: there is no URL to offer
until the browser's own player has legitimately obtained one.

## How the other extension pages avoid CORS without exposing secrets

`pages/video-downloader/`, `pages/thumbnail-downloader/`, and
`pages/comment-picker/` all call `${MYSOCIAL_APP_URL}/api/...` directly from
extension-page JavaScript. Two things make that work safely:

- `host_permissions` includes the app's own domain, which lets the
  extension's `fetch()` calls bypass the CORS restriction a normal webpage
  would hit — no server-side CORS headers needed.
- Anything requiring a real secret (Reddit's client credentials, Vimeo's
  access token) stays server-side in the backend the extension calls. The
  extension never holds API secrets itself — bundling one into an
  extension exposes it to every user who installs it.

Muxing a video-only + audio-only pair for a non-YouTube platform routes both
URLs through `/api/video-download/file` first (`background.js`'s
`proxyUrl()`), the same proxy the website uses — there's no way to know in
advance which CDN host to add to `host_permissions` for an arbitrary
Reddit/Vimeo/webpage-extracted URL, so the offscreen document's own `fetch()`
never depends on that CDN sending permissive CORS headers.

## Known limitation: thumbnails for non-video webpages

The Thumbnail Downloader's "any website" fallback reuses
`/api/video-download/info?platform=webpage`, which throws if it can't find
a *video* on the page (see `src/lib/video-download/webpage-extractor.ts`) —
even if that page has a perfectly good `og:image` for a thumbnail. Grabbing
a thumbnail from a plain, non-video webpage isn't currently supported.

## Load it locally

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select this `extension/` folder.

## Keeping the bundled ffmpeg.wasm in sync

`offscreen/vendor/ffmpeg/` and `offscreen/vendor/core/` are plain copies of
`@ffmpeg/ffmpeg`'s and `@ffmpeg/core`'s ESM build output (not source —
same pattern as `scripts/copy-ffmpeg-core.mjs` for the website). If those
packages are upgraded in `package.json`, recopy:

```bash
cp node_modules/@ffmpeg/ffmpeg/dist/esm/*.js extension/offscreen/vendor/ffmpeg/
cp node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm extension/offscreen/vendor/core/
```

They're bundled inside the extension rather than fetched from the website at
runtime because Chrome Web Store policy prohibits extensions from executing
remotely-hosted code.

## Plain `<script>` includes, not ES modules (most pages)

Every page here loads `config.js` (and usually `detect.js` or
`pages/shared/detect-video-platform.js`), then its own script, as classic
scripts (not `type="module"`), sharing global scope by design — this is why
the project's Next.js ESLint config excludes this folder.
`offscreen/offscreen.js` is the one exception (`type="module"`), since it
needs real ES module imports for the bundled ffmpeg.wasm build.
