# Microsoft Edge Add-ons — listing copy

Paste these into Partner Center. Store images live in this folder.

## Properties

| Field | Value |
|---|---|
| Category | Productivity (or Social / Entertainment if Productivity is unavailable) |
| Website | `https://mycp.mannuyadav.me` |
| Support contact detail | `https://mycp.mannuyadav.me/support` (or `hello@mannuyadav.me`) |
| Mature content | Unchecked |

## Privacy — single purpose

```text
MySocial helps content creators run giveaways and grab media from social pages they already have open. On supported YouTube, Reddit, Instagram, and similar pages, it can pick a random comment winner, download public video where supported, and save thumbnails, all without leaving the browser.
```

## Privacy — remote code

Select **No, I am not using remote code.**

## Privacy — permission justifications

| Permission | Justification |
|---|---|
| `activeTab` | Read the current tab URL/title so the popup can detect the platform and open the right tool. |
| `scripting` | Inject content scripts on YouTube to detect playback and pass page context to the extension UI. |
| `webRequest` | Observe YouTube media request URLs already made by the page player so downloadable qualities can be listed. |
| `downloads` | Save chosen videos/thumbnails to the user’s Downloads folder. |
| `offscreen` | Run local ffmpeg.wasm to mux video+audio streams into one file before download. |
| Host: `*.youtube.com` / `*.googlevideo.com` | Operate on YouTube pages and media URLs the user’s own player already requested. |
| Host: `mycp.mannuyadav.me` | Call MySocial APIs for comment fetch, fair draw, and non-YouTube video/thumbnail info. |

## Privacy — data usage disclosure

Check these boxes (must match `src/app/privacy/page.tsx` section 3, "Information we process"):

| Checkbox | Check it? | Why |
|---|---|---|
| Website content | **Yes** | We fetch public comments (text) from YouTube/Reddit to run the draw — matches "text, images, sounds, videos, or hyperlinks." |
| Location | **Yes** | Server logs capture IP address for security/operations — Microsoft's own example for this category is "region, IP address, GPS coordinates." |
| Personally identifiable information | No | We only see public display names/handles, not real name/address/email/age/ID. |
| Health / Financial / Authentication / Personal communications / Web history / User activity | No | Not collected. |

Leave all three "I do not..." certification checkboxes checked — nothing here contradicts them (no selling data, no unrelated use, no lending/creditworthiness use).

## Privacy policy URL

```text
https://mycp.mannuyadav.me/privacy
```

Also useful:

- Terms: `https://mycp.mannuyadav.me/terms`
- Support: `https://mycp.mannuyadav.me/support`

These pages ship with the website (`src/app/privacy`, `src/app/terms`, `src/app/support`). Deploy the site before submitting so the URLs resolve.

## Store listing — description

```text
MySocial is a social media toolbox for creators, right inside Microsoft Edge.

On supported pages, open the extension popup to:

• Pick Winner — Fetch comments from YouTube, Reddit, or Instagram and run a cryptographically verifiable random draw. Share a Draw ID so anyone can check the result.
• Get Thumbnail — Download available thumbnail sizes for YouTube and other supported platforms.
• Download Video — Download public videos where supported (for example Reddit, Vimeo, Instagram, and direct links). On YouTube, downloads use stream URLs already requested by your own browser player while you watch.
• Analyze — Open MySocial’s URL analyzer for the current page.

Why install MySocial
• Works natively in the extension for core actions — no need to copy-paste into another site for picking winners or grabbing media.
• Fair giveaways with verifiable draw results.
• No API keys or secrets are stored in the extension. Backend credentials stay on MySocial’s servers.
• Media muxing uses a locally bundled ffmpeg.wasm build (no remotely hosted code).

Notes
• YouTube adaptive qualities unlock only after you play the video at (or near) that quality in the tab.
• Some tools open the MySocial website for features that don’t need to run inside the extension.
• Use only content you have the right to download. Respect each platform’s terms of service.

Website: https://mycp.mannuyadav.me
```

## Store listing — search terms

```text
comment picker
giveaway winner
youtube thumbnail
video downloader
social media tools
reddit giveaway
instagram comments
```

## Notes for certification

```text
Test account: none required for core YouTube/Reddit public flows.

How to test:
1. Install the extension and open a public YouTube video.
2. Open the popup — confirm title/thumbnail detection.
3. Try Pick Winner with a public video that has comments (uses https://mycp.mannuyadav.me APIs).
4. Try Get Thumbnail on the same page.
5. For YouTube download: play the video, then open the popup and download an unlocked quality.
6. Optional: test a public Reddit post URL for comment picker / video tools.

Backend dependency: https://mycp.mannuyadav.me must be online.
Privacy policy: https://mycp.mannuyadav.me/privacy
Support: https://mycp.mannuyadav.me/support (hello@mannuyadav.me)
```

## Images in this folder

| File | Partner Center field | Size |
|---|---|---|
| `logo-300x300.png` | Extension logo (required) | 300×300 |
| `logo-300x300-alt.png` | Alternate logo with wordmark | 300×300 |
| `promo-small-440x280.png` | Small promotional tile | 440×280 |
| `promo-large-1400x560.png` | Large promotional tile | 1400×560 |
| `screenshot-01-popup-1280x800.png` | Screenshot | 1280×800 |
| `screenshot-02-comment-picker-1280x800.png` | Screenshot | 1280×800 |
| `screenshot-03-thumbnails-1280x800.png` | Screenshot | 1280×800 |
| `screenshot-04-video-downloader-1280x800.png` | Screenshot | 1280×800 |

Upload the package from `dist/mysocial-edge-<version>.zip` (built with `npm run pack:extension`).
