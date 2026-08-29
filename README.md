# MySocial

**The creator toolkit that doesn't cut corners.**

MySocial is an open, production-quality web app for content creators — built around a fair, cryptographically verifiable comment picker and growing into a full toolkit covering images, video, audio, social utilities, and AI-powered creator writing.

The flagship tool lets you paste a YouTube, Reddit, or Instagram URL, fetch every comment through the platform's **official API** (no scraping, ever), apply powerful filters, and pick one or more winners using a cryptographically secure random draw that anyone can independently verify by its Draw ID.

---

## Tools

### Engage
| Tool | Status |
|---|---|
| **Comment Picker** — Pick random giveaway winners from YouTube, Reddit and Instagram comments | ✅ Available |
| Comment Counter | Coming soon |
| Comment Cleaner | Coming soon |

### Images
| Tool | Status |
|---|---|
| **Thumbnail Downloader** — Download the highest-res thumbnail from any YouTube video | ✅ Available |
| **Image Compressor** — Shrink JPG, PNG and WebP images entirely in the browser | ✅ Available |
| **Image Converter** — Convert between PNG, JPG and WebP | ✅ Available |
| **Image Resizer** — Resize and crop to exact dimensions or social presets | ✅ Available |
| Thumbnail Checker | Coming soon |
| Social Image Resizer | Coming soon |

### Video
| Tool | Status |
|---|---|
| **Video → Thumbnail** — Grab a still frame from any point in an uploaded video | ✅ Available |
| **Video → GIF** — Turn a clip into a GIF with custom time range and frame rate | ✅ Available |
| **Video Downloader** — Download public videos via platforms' official APIs | ✅ Available |
| Frame Extractor | Coming soon |
| Video Compressor | Coming soon |
| Video Converter | Coming soon |
| Social Video Resizer | Coming soon |

### Audio
| Tool | Status |
|---|---|
| **Audio Converter** — Convert between MP3, WAV and OGG | ✅ Available |
| **Audio Compressor** — Reduce audio file size | ✅ Available |
| **Audio Metadata** — Inspect duration, sample rate and channels | ✅ Available |

### Social
| Tool | Status |
|---|---|
| **Social URL Analyzer** — Paste any supported URL and see its metadata and available tools | ✅ Available |
| **URL Cleaner** — Strip UTM and tracking parameters from any social or video URL | ✅ Available |
| **Social Link Generator** — Generate profile links for a username across platforms | ✅ Available |
| Social Metadata | Coming soon |

### Creator (AI-powered)
All generators are powered by Groq and use a provider-agnostic abstraction — swap the provider by changing one env var.

| Tool | Status |
|---|---|
| **Caption Generator** — Caption, hashtags and CTA for your next post | ✅ Available |
| **Title Generator** — YouTube title concepts for any topic | ✅ Available |
| **Hashtag Generator** — Relevant hashtag suggestions for your content | ✅ Available |
| **Hook Generator** — Opening hooks for a video or post | ✅ Available |
| **Description Generator** — YouTube or social post descriptions | ✅ Available |
| **Comment Reply Generator** — Suggested replies to a comment | ✅ Available |

### Utilities
| Tool | Status |
|---|---|
| **QR Generator** — Generate a QR code for a link, video or tool | ✅ Available |
| File Information | Coming soon |

---

## Comment Picker — how it works

```
Paste URL
  ↓
Detect platform
  ↓
Fetch comments via official API
  ↓
Normalize into common format
  ↓
Apply filters (duplicates, keywords, date range, replies…)
  ↓
Build eligible entry pool
  ↓
Cryptographically secure random draw
  ↓
Winner animation
  ↓
Shareable result page  (/draw/MYCP-XXXXXX)
```

Every draw gets a **Draw ID** (e.g. `MYCP-8F3A91`). The result page at `/draw/[id]` shows the total entries, filters used, and the winner — enough for anyone watching your giveaway to independently confirm the result.

### Supported platforms

| Platform | Comment Picker | Notes |
|---|---|---|
| YouTube | ✅ Available | Public videos via YouTube Data API v3 |
| Reddit | ✅ Available | App-only OAuth via Reddit API |
| Instagram | Requires account connection | Media must be owned by the connected professional account |
| TikTok | Coming soon | |
| Threads / Facebook / LinkedIn / X | Coming soon | |

---

## Architecture

### Platform adapters

Each platform lives in its own adapter — parser, API client, and mapper — so adding a new platform never touches the draw engine:

```
src/integrations/
  youtube/   — URL parser · API client · mapper · types
  reddit/    — URL parser · API client · mapper · types
  instagram/ — URL parser · OAuth client · mapper · types
  …

src/core/
  comment-engine/ — normalization, deduplication, filtering
  random/         — cryptographically secure draw, deterministic pool hash
  verification/   — Draw ID generation and HMAC-signed result tokens
```

All platforms map into a single `NormalizedComment` model. The draw engine never knows which platform a comment came from.

### AI provider abstraction

`src/lib/ai/provider.ts` is the only file that knows the AI provider is Groq. Every generator calls a shared interface — swapping providers requires changing one file and one env var.

### Browser-side media processing

Image, video and audio tools run **entirely in the browser** using FFmpeg compiled to WebAssembly (`@ffmpeg/ffmpeg`). No file is uploaded to a server for processing.

### Security principles

- All platform API secrets stay server-side. Nothing is in `NEXT_PUBLIC_*` except the app name and URL.
- The browser extension never contains API credentials — it only opens the MySocial website.
- The URL parser accepts only known platform domains. There is no generic `fetch(userProvidedUrl)` endpoint.
- Inputs are validated at every boundary with Zod.
- The draw uses `crypto.getRandomValues` (or the Node.js `crypto` module), not `Math.random()`.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI components | Radix UI + custom components |
| Icons | Lucide React |
| AI | Groq SDK (provider-agnostic wrapper) |
| Media processing | FFmpeg/WebAssembly |
| Deployment | Vercel |
| Testing | Vitest |

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/itsMannu-Yadav/mysocial.git
cd mysocial
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values you need. Only add what the tools you want to use actually require:

```env
# Required for all tools
NEXT_PUBLIC_APP_NAME=MySocial
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Comment Picker — YouTube
YOUTUBE_API_KEY=

# Comment Picker — Reddit
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=web:mysocial:v1.0.0 (by /u/your-username)

# AI tools (Caption, Title, Hashtag, Hook, Description, Reply generators)
AI_PROVIDER_API_KEY=

# Draw verification (required for the picker in production)
# Generate with: openssl rand -base64 32
DRAW_SECRET=

# Instagram (future account-connection flow)
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
```

You can use the image/video/audio tools and all AI generators without the platform API keys — those only become required when running the Comment Picker.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npm test
```

### 5. Build for production

```bash
npm run build
npm run start
```

---

## API key setup guides

### YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a project (or use an existing one).
3. Enable the **YouTube Data API v3** on the project.
4. Create an **API key** and restrict it to the YouTube Data API v3.
5. Add it as `YOUTUBE_API_KEY` in your `.env.local`.

No OAuth is required — public comment retrieval uses an API key only.

### Reddit

1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps).
2. Create a new **script** app.
3. Copy the `client_id` (under the app name) and the `secret`.
4. Set `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, and a descriptive `REDDIT_USER_AGENT`.

The Reddit integration uses app-only (client credentials) OAuth — no user account connection needed.

### Groq (AI generators)

1. Go to [console.groq.com/keys](https://console.groq.com/keys).
2. Create an API key.
3. Add it as `AI_PROVIDER_API_KEY`.

---

## Deploying to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repository to GitHub.
2. Import the repo in [vercel.com/new](https://vercel.com/new).
3. Add your environment variables in the Vercel dashboard under **Settings → Environment Variables** — use the same keys from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://mysocial.example.com`).
5. Deploy.

### Domain migration

The entire application is driven by two env vars:

```env
NEXT_PUBLIC_APP_NAME=MySocial
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Changing the domain requires updating these vars, the OAuth redirect URLs in each platform's developer console, and redeploying. No source code changes needed.

---

## Browser extension

A Manifest V3 Chromium extension lives in `extension/`. When you're on a supported page (YouTube video, Reddit post), the popup shows the video or post details and a **"Open in MySocial"** button that takes you straight to the comment picker.

The extension **never contains API credentials**. It only opens MySocial URLs and calls safe public endpoints.

### Load the extension locally

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.

---

## Project structure

```
.
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── y/[videoId]/       # YouTube picker
│   │   ├── r/[postId]/        # Reddit picker
│   │   ├── i/[mediaId]/       # Instagram picker
│   │   ├── draw/[token]/      # Verifiable result page
│   │   ├── tools/             # All tool pages
│   │   └── extension/         # Extension landing page
│   ├── components/            # Shared UI components
│   ├── config/
│   │   ├── tools.ts           # Central tool registry
│   │   └── categories.ts      # Tool category taxonomy
│   ├── integrations/          # Per-platform adapters
│   ├── core/                  # Draw engine, filters, verification
│   ├── lib/
│   │   ├── ai/                # Provider-agnostic AI wrapper
│   │   └── env.server.ts      # Server-side credential checks
│   └── types/                 # Shared TypeScript types
├── extension/                 # Chromium browser extension (MV3)
├── .env.example               # All supported env vars with comments
└── planning doc.md            # Full product specification
```

---

## Fairness and verification

Draw results are tamper-evident by design:

- The eligible entry pool is hashed before selection.
- The winner is chosen using `crypto.getRandomValues`, not `Math.random()`.
- The result URL (`/draw/[token]`) encodes the draw metadata in an HMAC-signed token — the token cannot be forged without the `DRAW_SECRET`.
- The result page shows total entries, filters applied, the algorithm version, and the Draw ID so anyone can verify the giveaway was run honestly.

---

## Contributing

Pull requests are welcome. For large changes, open an issue first to discuss the approach.

A few ground rules that match the project's philosophy:

- **Official APIs only.** No scraping, no unofficial endpoints, no session-cookie tricks.
- **No secrets in the client.** Nothing sensitive in `NEXT_PUBLIC_*` or the extension bundle.
- **Honest status labels.** A tool is `Available` only when it works end-to-end. `Coming soon` is not a placeholder for broken features.
- **TypeScript strict.** Keep `noImplicitAny` clean.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built by [Mannu Yadav](https://github.com/itsMannu-Yadav)*
