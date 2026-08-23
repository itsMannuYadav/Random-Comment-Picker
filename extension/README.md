# MySocial Browser Extension

A minimal Manifest V3 extension. Detects when you're on a supported YouTube,
Reddit or Instagram page and offers one-click actions into the matching
MySocial tool — nothing more.

- No API keys or secrets: see planning doc section 59.
- No content script, no background service worker: the popup reads the
  active tab's URL via the `activeTab` permission (granted by opening the
  popup itself) and opens a new tab. That's the entire surface area.
- `utils/config.js` holds the one thing that changes when the app migrates
  domains: `MYSOCIAL_APP_URL`.

## What it offers

For any detected page, the popup shows real, working links into MySocial —
never a button that does nothing:

- **Pick with MySocial** — every detected platform, opens the comment
  picker's short-link route (`/y/`, `/r/`, `/i/`) directly.
- **Get Thumbnail** — YouTube only, opens the Thumbnail Downloader
  pre-filled with the current page's URL.
- **Analyze** — every detected platform, opens the Social URL Analyzer
  pre-filled with the current page's URL.

## Load it locally

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select this `extension/` folder.

## Plain `<script>` includes, not ES modules

`popup.html` loads `config.js`, `detect.js`, then `popup.js` as classic
scripts (not `type="module"`), so they share a global scope by design —
this is why the project's Next.js ESLint config excludes this folder.
