# MY SOCIAL — COMPLETE PLATFORM TRANSFORMATION

## Production-Grade Social Media Utility & Creator Toolkit

You are acting as a **senior full-stack engineer, product architect, UI/UX designer, security engineer, performance engineer, and product strategist**.

We currently have an existing production website called:

**MyCP — My Comment Picker**

It is already deployed on Vercel and currently lives at:

```text
https://mycp.mannuyadav.me
```

The existing Comment Picker is working and must NOT be unnecessarily destroyed, rewritten, or replaced.

We are now transforming the entire project into a much larger platform:

# MySocial

MySocial should become a **premium social-media utility and creator toolkit**.

The existing Comment Picker becomes one of the flagship tools inside MySocial rather than the entire identity of the product.

The goal is NOT to create a basic collection of random online tools.

The goal is to create a polished, modern, highly useful, extensible platform that could eventually become a serious creator utility ecosystem.

---

# 1. CURRENT DATE AND API REQUIREMENT

Current date:

**23 August 2026**

All platform/API decisions must be based on the current state of official documentation as of implementation time.

DO NOT rely blindly on:

* old YouTube tutorials
* old Reddit tutorials
* outdated Stack Overflow answers
* unofficial APIs
* abandoned npm packages
* reverse-engineered endpoints
* blog posts from 2020–2024
* assumptions about current API capabilities

Before implementing a platform integration, verify the current official developer documentation.

If an API capability has changed, use the current implementation.

If an API capability is unavailable, restricted, requires approval, or requires a particular account type:

* do not fake the integration
* do not silently scrape around it
* do not create a misleading UI
* isolate the integration behind an adapter
* clearly communicate the limitation
* make the architecture ready for future support

---

# 2. CORE PRODUCT VISION

MySocial should feel like:

> **The creator's toolbox for the social web.**

Users should be able to come to one website and find useful tools for:

* giveaways
* comments
* thumbnails
* images
* videos
* audio
* social-media formatting
* URLs
* metadata
* profile utilities
* QR codes
* AI-assisted creator workflows
* media processing
* social content preparation

The platform should feel coherent.

It must NOT feel like:

> "100 random tools thrown onto one website."

Every tool should belong to a clear category.

---

# 3. BRAND

New product name:

# MySocial

Short brand:

**MySocial**

Existing MyCP becomes:

**MySocial → Comment Picker**

Possible brand positioning:

> Create. Analyze. Convert. Share.

or:

> Your social media toolbox.

Primary emotional qualities:

* modern
* premium
* fast
* useful
* trustworthy
* creator-friendly
* intelligent
* slightly playful
* technically impressive
* clean

Avoid childish design.

Avoid generic SaaS templates.

Avoid excessive glassmorphism.

Avoid excessive gradients.

Avoid generic Bootstrap-like cards.

Avoid copying existing competitor designs.

---

# 4. EXISTING PROJECT — VERY IMPORTANT

Before changing anything:

## INSPECT THE EXISTING REPOSITORY.

Determine:

* framework
* Next.js version
* React version
* TypeScript configuration
* Tailwind configuration
* shadcn/ui setup
* existing routes
* existing components
* existing API routes
* existing environment variables
* Vercel configuration
* existing Comment Picker implementation
* current URL architecture
* current database/storage architecture
* Git state
* package manager

DO NOT blindly initialize a new application.

DO NOT delete the current implementation.

DO NOT overwrite working features without understanding them.

The existing Comment Picker is valuable and must be migrated into the new architecture.

---

# 5. MIGRATION PRINCIPLE

Current:

```text
MyCP
└── Comment Picker
```

New:

```text
MySocial
│
├── Comment Picker
├── Thumbnail Tools
├── Image Tools
├── Video Tools
├── Audio Tools
├── Social Media Tools
├── URL Tools
├── Creator Tools
├── Profile Tools
├── AI Tools
└── Utilities
```

The old Comment Picker should become:

```text
/tools/comment-picker
```

or another clean route chosen by the architecture.

The old deep-link functionality should continue working.

For example:

```text
/y/[videoId]
```

must continue to work if it currently exists.

---

# 6. BACKWARD COMPATIBILITY

The existing domain:

```text
https://mycp.mannuyadav.me
```

must continue working.

Ideally:

```text
https://mycp.mannuyadav.me
```

should open the Comment Picker or redirect gracefully to its new location.

Do not break existing links.

Do not break existing bookmarks.

Do not break existing shared draw URLs.

Existing draw/result URLs must remain functional.

---

# 7. FUTURE DOMAIN

The current domain is temporary.

Eventually we may use:

```text
https://mysocial.example
```

or another dedicated domain.

Therefore:

## NEVER hard-code the domain.

Use:

```env
NEXT_PUBLIC_APP_URL=https://mycp.mannuyadav.me
NEXT_PUBLIC_APP_NAME=MySocial
```

All generated URLs must use the configured origin.

The application must be migratable to another domain without source-code rewriting.

---

# 8. VERCEL-FIRST ARCHITECTURE

The project is hosted on:

**Vercel**

Everything must remain Vercel-compatible.

Preferred stack:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide icons
* Vercel-compatible Route Handlers
* server components where useful
* client components where interaction requires them

Avoid architecture requiring:

* permanent VPS
* long-running Node process
* local filesystem persistence
* background daemon
* custom server
* Docker unless genuinely necessary
* unnecessary infrastructure

For CPU-heavy media processing, investigate Vercel limitations first.

If a task cannot safely run inside a Vercel function because of:

* execution time
* memory
* file size
* CPU requirements
* streaming requirements

do not force it.

Instead create an abstraction so a future worker/service can be plugged in.

---

# 9. DESIGN SYSTEM

Create a proper MySocial design system.

Define:

* typography
* spacing
* radii
* shadows
* borders
* colors
* buttons
* inputs
* cards
* dialogs
* drawers
* badges
* tabs
* tool cards
* empty states
* loading states
* error states

The design should feel consistent across every tool.

---

# 10. HOMEPAGE

Create a completely redesigned MySocial homepage.

Hero:

```text
Your social media toolbox.
Everything creators need, in one place.
```

Subheading:

```text
Pick winners, work with thumbnails,
prepare media, clean URLs, analyze content,
and more — all from one fast toolkit.
```

Primary CTA:

```text
Explore Tools
```

Secondary:

```text
Popular Tools
```

The homepage should immediately show useful tools.

---

# 11. HOMEPAGE TOOL DISCOVERY

Create:

## Popular Tools

Display visually strong tool cards:

```text
🎲 Comment Picker
🖼️ Thumbnail Downloader
🔗 Social URL Analyzer
📊 Video Info
🖼️ Image Compressor
🎬 Video Tools
```

Then categories:

```text
Engage
Images
Video
Audio
Social
Creator
AI
Utilities
```

Add search:

```text
Search tools...
```

Example:

User types:

```text
thumbnail
```

and immediately sees:

* Thumbnail Downloader
* Thumbnail Resizer
* Thumbnail Compressor
* Video → Thumbnail

---

# 12. TOOL REGISTRY

Do NOT hard-code every tool manually across multiple pages.

Create a central tool registry.

Conceptually:

```ts
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  href: string;
  status: "available" | "beta" | "coming-soon";
  popular?: boolean;
  platforms?: Platform[];
}
```

Example:

```text
comment-picker
thumbnail-downloader
social-url-analyzer
image-compressor
video-to-gif
qr-generator
```

The homepage, search, category pages, navigation, sitemap and tool discovery should consume this registry.

This makes the platform easy to expand.

---

# 13. TOOL CATEGORIES

Create these major categories:

## ENGAGE

* Comment Picker
* Giveaway Tools
* Comment Utilities

## IMAGES

* Thumbnail Downloader
* Image Compressor
* Image Converter
* Image Resizer
* Social Image Resizer
* Image Metadata Viewer
* Image Format Converter

## VIDEO

* Video Compressor
* Video Converter
* Video → GIF
* Video → Thumbnail
* Frame Extractor
* Social Video Resizer
* Video Metadata

## AUDIO

* Audio Converter
* Audio Compressor
* Video → Audio for user-provided/authorized media
* Audio Metadata
* Waveform Generator

## SOCIAL

* Social URL Analyzer
* Social Metadata
* URL Cleaner
* Profile Link Generator
* Social Link Generator

## CREATOR

* Caption Generator
* Hashtag Generator
* Hook Generator
* YouTube Title Generator
* Description Generator
* Comment Reply Generator
* Thumbnail Tools

## PROFILE

* Username utility
* Social Profile Link Generator
* Social Link Checker where technically appropriate

## AI

Create the architecture for future AI-powered tools without making AI mandatory for the first deployment.

## UTILITIES

* QR Generator
* QR Scanner if technically appropriate
* Color tools
* File information
* General media utilities

---

# 14. COMMENT PICKER — EXISTING FLAGSHIP

Preserve and improve the current Comment Picker.

Route:

```text
/tools/comment-picker
```

Keep support for the current YouTube workflow.

Features:

* YouTube URL detection
* comment retrieval
* pagination
* replies
* duplicate removal
* one-entry-per-user
* keyword filters
* hashtag filters
* minimum length
* maximum length
* date filtering
* blocked words
* link filtering
* multiple winners
* winner animation
* secure random selection
* draw ID
* verification
* public result page
* shareable winner page

The Comment Picker must remain one of the most polished tools in the entire product.

---

# 15. YOUTUBE API

Use the official YouTube Data API.

Current official documentation indicates that `commentThreads.list` supports retrieving comment threads associated with a video and supports pagination via `nextPageToken`. It also supports parameters such as `videoId`, `maxResults`, `order`, `searchTerms`, and `textFormat`. Verify current documentation before implementation.

Do not hard-code assumptions about quota.

Read the current official quota documentation during implementation.

Use:

```env
YOUTUBE_API_KEY=
```

Server-side only.

Never expose it as:

```env
NEXT_PUBLIC_YOUTUBE_API_KEY=
```

---

# 16. THUMBNAIL DOWNLOADER

Build a polished:

```text
/tools/thumbnail-downloader
```

Users can paste a supported YouTube URL.

Detect:

```text
youtube.com/watch
youtu.be
youtube.com/shorts
```

Retrieve available thumbnail information using supported official metadata/API mechanisms.

Show:

```text
Thumbnail Preview
```

Then available resolutions.

Potential labels:

```text
Default
Medium
High
Standard
Maximum Available
```

Do not claim a resolution exists if it does not.

Use the actual available source.

Show:

```text
Resolution
Aspect Ratio
File Type
```

Provide download buttons.

Also include:

```text
Open image
Copy image URL
Download
```

where appropriate.

---

# 17. THUMBNAIL QUALITY TOOL

Add:

```text
/tools/thumbnail-checker
```

Upload an image or provide a supported image URL.

Display:

```text
Dimensions
Aspect ratio
File size
Format
Estimated quality
```

If it is intended as a YouTube thumbnail, compare it against recommended dimensions without claiming unsupported guarantees.

---

# 18. IMAGE COMPRESSOR

Create:

```text
/tools/image-compressor
```

Allow drag-and-drop.

Support common formats where technically possible:

* JPG
* PNG
* WebP
* AVIF

Show:

```text
Original
3.8 MB

Compressed
1.1 MB

Saved
71%
```

Controls:

```text
Quality
Target size
Output format
```

Provide before/after preview.

For privacy, process files locally in the browser where feasible.

Do not upload images to a server unnecessarily.

---

# 19. IMAGE CONVERTER

Create:

```text
/tools/image-converter
```

Support appropriate conversions.

Examples:

```text
PNG → JPG
JPG → WebP
PNG → WebP
WebP → JPG
```

Where browser capabilities are insufficient, use a server-side processing path only when practical.

---

# 20. IMAGE RESIZER

Create:

```text
/tools/image-resizer
```

Modes:

```text
Custom
Instagram
YouTube
Facebook
LinkedIn
X
```

Allow:

* exact dimensions
* percentage
* aspect-ratio lock
* crop
* fit
* contain
* cover

---

# 21. SOCIAL IMAGE RESIZER

Create presets for common social-media formats.

Examples:

```text
Instagram square
Instagram portrait
Instagram story/reel cover
YouTube thumbnail
LinkedIn landscape
LinkedIn square
X post
Facebook
```

Do not hard-code obsolete dimensions without verifying current platform recommendations.

Make preset definitions configurable.

---

# 22. VIDEO → THUMBNAIL

Create:

```text
/tools/video-to-thumbnail
```

User uploads a video.

Show a timeline/frame selector.

Allow:

```text
00:00
00:05
00:10
Custom timestamp
```

Generate:

```text
JPG
PNG
WebP
```

Allow basic enhancement/crop where feasible.

---

# 23. FRAME EXTRACTOR

Create:

```text
/tools/frame-extractor
```

User uploads a video.

Options:

```text
Every 1 second
Every 5 seconds
Every 10 seconds
Custom interval
```

Export:

```text
ZIP
```

with extracted frames where technically feasible.

For very large videos, clearly explain limits.

Do not attempt to process files beyond the capabilities of the Vercel deployment.

---

# 24. VIDEO COMPRESSOR

Create:

```text
/tools/video-compressor
```

Support user-provided media.

Show:

```text
Original
Resolution
Duration
Size
Format
```

Allow target:

```text
Smaller file
Balanced
High quality
Custom
```

If serverless/Vercel limits make browser-side or worker-based processing necessary, use the best architecture available.

Do not pretend a compression operation completed when it did not.

---

# 25. VIDEO CONVERTER

Create:

```text
/tools/video-converter
```

Support realistic browser/server capabilities.

Potential output:

```text
MP4
WebM
GIF
```

Do not promise formats the runtime cannot reliably generate.

---

# 26. VIDEO → GIF

Create:

```text
/tools/video-to-gif
```

Features:

* upload video
* start time
* end time
* FPS
* width
* quality
* preview
* export

Warn users about large GIF sizes.

Optionally provide WebM as a more efficient alternative.

---

# 27. SOCIAL VIDEO RESIZER

This should become a flagship creator utility.

User uploads one video.

MySocial offers:

```text
YouTube
YouTube Shorts
Instagram Reel
Instagram Post
TikTok
LinkedIn
X
Facebook
```

Where current platform recommendations are known and appropriate.

Modes:

```text
Crop
Fit
Blurred background
Solid background
Custom background
```

Preview before export.

---

# 28. MEDIA DOWNLOADER ARCHITECTURE

Create a generic media-download abstraction.

However:

## IMPORTANT

Do not implement unauthorized extraction or bypass systems for third-party protected media.

Do not:

* bypass DRM
* bypass access controls
* use stolen cookies
* evade CAPTCHAs
* rotate proxies to evade platform restrictions
* scrape private content
* reverse-engineer protected streaming endpoints
* bypass platform download restrictions

For supported content, the downloader should operate on:

* user-uploaded files
* content the user is authorized to download
* direct media URLs where permitted
* official platform download mechanisms/APIs where available

The architecture should still be modular:

```text
media/
  sources/
  processors/
  download/
```

This allows future lawful/official integrations without rewriting the media system.

---

# 29. SOCIAL URL ANALYZER

Create:

```text
/tools/url-analyzer
```

This should be one of the most useful tools.

User pastes:

```text
https://youtube.com/watch?v=ABC123
```

MySocial detects:

```text
Platform: YouTube
Resource ID: ABC123
URL Type: Video
```

Then retrieves available official metadata.

Show:

```text
Title
Channel
Published date
Duration
Thumbnail
Available statistics
```

Only display fields actually available through the official API.

Then show:

```text
Available Tools

🎲 Comment Picker
🖼️ Thumbnail Downloader
📊 Video Information
🔗 Clean URL
```

This becomes the central entry point into MySocial.

---

# 30. URL CLEANER

Create:

```text
/tools/url-cleaner
```

Accept supported social URLs.

Remove unnecessary tracking parameters where safe.

Example:

```text
Original:
https://youtube.com/watch?v=ABC123&utm_source=test

Clean:
https://youtube.com/watch?v=ABC123
```

Do not blindly remove parameters that change the actual content.

Show:

```text
Original
Clean
Copy
```

---

# 31. SOCIAL METADATA TOOL

Create:

```text
/tools/social-metadata
```

For supported URLs, show available metadata.

Possible fields:

* title
* description
* author/channel
* thumbnail
* publication date
* duration
* statistics
* platform
* resource ID

Only use data that the current official API permits.

---

# 32. SOCIAL LINK GENERATOR

Create:

```text
/tools/social-links
```

User enters a username/profile identifier.

Generate links for supported platforms.

Allow:

```text
Instagram
YouTube
X
LinkedIn
Reddit
Threads
TikTok
```

Only generate a platform URL when the platform's current URL structure is known.

---

# 33. QR CODE GENERATOR

Create:

```text
/tools/qr-generator
```

Allow users to generate QR codes for:

* website
* YouTube video
* social profile
* giveaway result
* MySocial tool
* arbitrary text

Options:

* size
* margin
* error correction
* foreground/background
* logo where technically safe
* PNG/SVG download

Keep the UI extremely simple.

---

# 34. CREATOR AI TOOLS

Create the architecture for AI tools.

Potential tools:

### Caption Generator

Input:

```text
Topic
Platform
Tone
Audience
```

Output:

```text
Caption
Hashtags
CTA
```

### YouTube Title Generator

Generate multiple title concepts.

### Hook Generator

Generate opening hooks.

### Hashtag Generator

Generate relevant hashtag suggestions.

### Description Generator

Generate YouTube/social descriptions.

### Comment Reply Generator

Input a comment and generate suggested responses.

IMPORTANT:

AI tools must be provider-agnostic.

Create:

```text
lib/ai/
```

with an adapter interface.

Do not hard-code the entire application around one AI vendor.

API keys must remain server-side.

---

# 35. PROFILE/USERNAME TOOLS

Create a future-ready:

```text
/tools/profile-tools
```

Possible tools:

* profile link generator
* username utility
* social handle formatter
* social profile URL builder

Do not claim username availability unless the current platform allows a technically reliable check.

---

# 36. COMMENT UTILITIES

Expand the Comment Picker ecosystem.

Potential tools:

### Comment Cleaner

Normalize comments for export.

### Comment Counter

Count comments from supported APIs.

### Keyword Comment Finder

Search comments where official API functionality supports it.

### Comment Exporter

Export eligible public comment data where platform terms permit.

Keep privacy/data retention minimal.

---

# 37. TOOL DETAIL PAGE

Every tool should have:

```text
Breadcrumb

Tool title

Description

Main tool interface

How it works

Supported formats/platforms

FAQ

Related tools
```

Example:

```text
Thumbnail Downloader

Download the highest available thumbnail
from a supported YouTube URL.

[ URL INPUT ]

Related:
Thumbnail Checker
Image Compressor
Video → Thumbnail
```

---

# 38. TOOL SEARCH

Global search should search:

* tool name
* description
* category
* keywords

Example:

User types:

```text
compress
```

Results:

```text
Image Compressor
Video Compressor
Audio Compressor
```

Use keyboard support:

```text
Ctrl/Cmd + K
```

for global tool search.

---

# 39. COMMAND PALETTE

Add a premium command palette.

Shortcut:

```text
Ctrl + K
```

or:

```text
Cmd + K
```

Actions:

```text
Open Comment Picker
Open Thumbnail Downloader
Compress Image
Analyze URL
Generate QR
Search Tools
```

This makes the platform feel much more sophisticated.

---

# 40. RECENT TOOLS

For anonymous users, use local storage where appropriate.

Show:

```text
Recently used

Comment Picker
Thumbnail Downloader
URL Analyzer
```

Do not store sensitive uploaded media.

---

# 41. FAVORITES

Allow users to favorite tools locally.

Later, authenticated users can sync favorites.

---

# 42. TOOL CATEGORIES PAGE

Create:

```text
/tools
```

with:

```text
All Tools

Engage
Images
Video
Audio
Social
Creator
AI
Utilities
```

Provide:

* search
* filters
* sorting
* popular
* newest
* recently used

---

# 43. NAVIGATION

Desktop navigation:

```text
MySocial

Tools
Categories
Popular
Extension
```

Potential right-side actions:

```text
Search
Theme
```

Keep navigation simple.

Do not create a huge enterprise dashboard.

---

# 44. MOBILE NAVIGATION

Mobile should have a clean bottom or compact navigation.

Important:

The tool itself should receive maximum screen space.

Do not make users fight through menus to reach the utility.

---

# 45. DARK MODE

Implement excellent dark mode.

Do not simply invert colors.

Check:

* contrast
* shadows
* borders
* image previews
* code/text
* dialogs
* loading states

---

# 46. MICROINTERACTIONS

Use subtle animation.

Examples:

* tool card hover
* button press
* copy confirmation
* upload progress
* successful conversion
* winner reveal
* filter changes
* search results

Avoid excessive animation.

Respect:

```text
prefers-reduced-motion
```

---

# 47. FILE UPLOAD UX

For media tools:

Support:

* drag and drop
* click to browse
* paste where appropriate
* file preview
* progress
* cancel
* retry
* remove

Show:

```text
Maximum supported size
```

based on actual deployment limits.

Never pretend arbitrary huge uploads are supported.

---

# 48. PRIVACY-FIRST MEDIA PROCESSING

Prefer client-side processing whenever practical.

For example:

* image compression
* image conversion
* simple resizing
* QR generation

can often happen locally.

This reduces:

* server cost
* privacy risk
* storage requirements

For server-side processing, clearly indicate that processing occurs remotely.

Do not retain user files longer than necessary.

---

# 49. SECURITY

Treat every uploaded file and URL as untrusted.

Protect against:

* XSS
* SSRF
* malicious MIME types
* path traversal
* oversized payloads
* zip bombs
* malicious SVG
* unsafe file names
* arbitrary URL fetching
* open redirects

For URL fetching:

DO NOT create:

```text
/api/fetch?url=ANYTHING
```

without strict allowlisting.

Only fetch from supported domains and validated resource URLs.

---

# 50. MEDIA FILE SAFETY

Do not execute uploaded files.

Validate:

* MIME type
* file signature/magic bytes where possible
* extension
* size

Generate safe temporary filenames.

Never use the original filename directly as a filesystem path.

---

# 51. PERFORMANCE

The platform must feel fast.

Use:

* lazy loading
* dynamic imports
* code splitting
* image optimization
* streaming where appropriate
* caching
* server components
* lightweight client bundles

Heavy tools should not load their entire processing stack on the homepage.

For example:

The homepage should NOT load video-processing libraries before the user opens a video tool.

---

# 52. TOOL ISOLATION

Each tool should be independently loadable.

Conceptually:

```text
tools/
  comment-picker/
  thumbnail-downloader/
  image-compressor/
  image-converter/
  video-compressor/
  video-to-gif/
  url-analyzer/
```

A failure in one tool should not crash the entire application.

---

# 53. PLATFORM ADAPTERS

Create:

```text
platforms/
  youtube/
  instagram/
  reddit/
  threads/
  facebook/
  linkedin/
  tiktok/
  x/
```

Each platform should have:

* URL parser
* identifier extraction
* capability definition
* API client
* mapper
* error handling

Example:

```ts
interface PlatformAdapter {
  detect(url: string): boolean;
  parse(url: string): ParsedResource | null;
  getCapabilities(): PlatformCapabilities;
}
```

Do not assume all platforms support the same features.

---

# 54. PLATFORM CAPABILITY MATRIX

Create a central capability system.

Example:

```text
YouTube:
  commentPicker: true
  thumbnail: true
  metadata: true
  downloader: false
```

Instagram:

```text
commentPicker: depends on authorized access
thumbnail: depends on official access
metadata: depends on official access
```

This allows the UI to dynamically show available tools.

---

# 55. REDDIT

Reddit must NOT be implemented through scraping.

The current Reddit developer environment/policy must be checked before implementation.

Reddit's current Responsible Builder Policy requires approval for API/data access, and commercial use has additional requirements.

Therefore:

If appropriate access has not been granted:

```text
Reddit
Coming soon / Access required
```

Do not pretend it works.

Keep the adapter architecture ready.

---

# 56. INSTAGRAM

Use official Meta/Instagram APIs.

Do not scrape Instagram.

If the current API requires:

* professional account
* OAuth
* specific permissions
* account ownership

build the correct authorization flow.

If unavailable:

```text
Requires Instagram connection
```

Do not bypass the access model.

---

# 57. TIKTOK / X / OTHER PLATFORMS

Do not implement unofficial scraping just to make the platform list look impressive.

Use:

```text
Available
Beta
Requires connection
Coming soon
```

based on actual capabilities.

The product should prioritize **trust over fake feature counts**.

---

# 58. EXTENSION

Preserve the existing browser-extension plan.

Build:

```text
/extension
```

for MySocial.

Target:

* Chrome
* Edge
* Chromium-compatible browsers

Use:

**Manifest V3**

Extension functionality:

```text
Detect supported social page
↓
Identify resource
↓
Show MySocial action
↓
Open appropriate MySocial tool
```

Example:

YouTube:

```text
youtube.com/watch?v=ABC123
```

Extension:

```text
🎲 Pick with MySocial
🖼️ Get Thumbnail
📊 Analyze
```

Clicking should open:

```text
APP_URL/y/ABC123
```

or:

```text
APP_URL/tools/thumbnail-downloader?url=...
```

depending on the selected action.

---

# 59. EXTENSION SECURITY

Never put:

```text
YOUTUBE_API_KEY
REDDIT_CLIENT_SECRET
META_CLIENT_SECRET
AI_API_KEY
```

inside the extension.

The extension should communicate with the MySocial website/backend.

Use the configured production origin.

---

# 60. PUBLIC RESULT PAGES

Preserve the Comment Picker result system.

Example:

```text
/draw/[drawId]
```

These pages should be:

* shareable
* fast
* SEO-aware where appropriate
* visually polished

---

# 61. SEO

Build proper metadata for:

```text
/
/tools
/tools/comment-picker
/tools/thumbnail-downloader
/tools/image-compressor
/tools/video-tools
/tools/url-analyzer
/extension
```

Generate dynamic metadata for individual tool pages.

Create:

* sitemap
* robots
* canonical URLs
* Open Graph metadata
* Twitter/X cards where appropriate

Do not expose private user data to search engines.

---

# 62. ACCESSIBILITY

Every tool must support:

* keyboard navigation
* focus states
* semantic HTML
* accessible labels
* screen readers
* reduced motion
* proper contrast
* accessible dialogs
* accessible upload controls

Do not make a visually impressive but inaccessible product.

---

# 63. ANALYTICS

Create an analytics abstraction.

Track only useful product events:

```text
tool_opened
tool_completed
url_analyzed
comment_picker_started
draw_completed
thumbnail_downloaded
image_compressed
video_processed
extension_clicked
```

Avoid collecting unnecessary personal information.

---

# 64. ERROR DESIGN

Errors should be useful.

Bad:

```text
Something went wrong.
```

Better:

```text
We couldn't read this URL.

Check that it belongs to a supported platform
and try again.
```

For API problems:

```text
YouTube is temporarily unavailable.
Please try again in a few minutes.
```

Never expose stack traces.

---

# 65. EMPTY STATES

Make empty states beautiful.

Example:

```text
✨

Your next tool is one paste away.

Drop a social-media URL above
or explore the tools below.
```

---

# 66. LOADING STATES

Do not use generic spinners everywhere.

Create meaningful states.

For URL analysis:

```text
Detecting platform...
Reading metadata...
Preparing tools...
```

For image processing:

```text
Reading image...
Optimizing...
Preparing download...
```

For comment picker:

```text
Connecting...
Collecting comments...
Applying filters...
Preparing draw...
```

Progress must reflect actual stages whenever possible.

Do not fake percentages.

---

# 67. TOOL COMPLETION EXPERIENCE

Every tool should end with a clear success state.

Example:

```text
✓ Done

Original
3.8 MB

New
1.1 MB

Saved 71%

[ Download ]
[ Process Another ]
```

---

# 68. COPY / DOWNLOAD UX

Every generated result should have obvious actions:

```text
Download
Copy
Open
Share
Process Again
```

Use toast notifications for small confirmations.

---

# 69. SHARING

Use the Web Share API where supported.

Fallback:

```text
Copy link
```

Shareable URLs should be canonical.

---

# 70. PWA

If practical, make MySocial installable as a PWA.

Include:

* manifest
* icons
* theme color
* offline shell where useful

Do not claim full offline support for API-dependent tools.

---

# 71. STORAGE

Avoid unnecessary permanent storage.

For anonymous users:

Prefer local browser storage for:

* recent tools
* favorites
* preferences

For future authenticated users:

Database can store:

* draw history
* saved tools
* saved projects
* settings

Do not permanently store uploaded media unless explicitly required.

---

# 72. FUTURE USER ACCOUNTS

Do not make login mandatory for basic tools.

Eventually accounts may unlock:

```text
History
Favorites
Saved projects
Creator workspace
Branded result pages
Analytics
AI history
```

Architect for this without forcing it into V1.

---

# 73. FUTURE MONETIZATION

Do not implement complex billing now.

But design for:

### Free

Basic tools and reasonable limits.

### Pro

Higher limits.

Advanced processing.

Saved history.

Premium AI tools.

Branded exports.

### Creator/Agency

Teams.

Client workspaces.

Campaigns.

Branding.

Do not let monetization interfere with the initial user experience.

---

# 74. TOOL LIMITS

Every resource-heavy tool must have configurable limits.

Example:

```env
MAX_UPLOAD_MB=
MAX_VIDEO_DURATION_SECONDS=
MAX_IMAGE_PIXELS=
MAX_PROCESSING_TIME=
```

Do not hard-code limits in 15 different components.

---

# 75. CONFIGURATION

Create:

```text
config/
  app.ts
  tools.ts
  platforms.ts
  limits.ts
```

Keep important configuration centralized.

---

# 76. ENVIRONMENT VARIABLES

Create a proper:

```text
.env.example
```

Possible variables:

```env
NEXT_PUBLIC_APP_NAME=MySocial
NEXT_PUBLIC_APP_URL=http://localhost:3000

YOUTUBE_API_KEY=

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=

AI_PROVIDER_API_KEY=

DATABASE_URL=
```

Only include variables that are actually needed.

Do not invent credentials.

Do not expose server secrets through `NEXT_PUBLIC_*`.

---

# 77. VERCEL DEPLOYMENT

The final project must build successfully on Vercel.

Test:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If scripts do not exist, create appropriate scripts.

Do not declare the project finished until the production build succeeds.

---

# 78. TESTING

Create unit tests for:

### URL parsing

* YouTube watch
* YouTube shorts
* youtu.be
* Instagram
* Reddit
* Threads
* invalid URLs
* malicious URLs

### Tool registry

* unique IDs
* valid routes
* valid categories

### Comment Picker

* filters
* duplicate removal
* multiple winners
* winner uniqueness

### Media utilities

* format detection
* dimension validation
* size limits

### Security

* SSRF
* invalid domains
* malicious URLs
* oversized payloads
* unsafe filenames

---

# 79. RESPONSIVE DESIGN

Every tool must work on:

* desktop
* laptop
* tablet
* mobile

Mobile is NOT simply a shrunken desktop.

For example:

Desktop:

```text
Preview | Controls
```

Mobile:

```text
Preview

Controls
```

Use drawers/bottom sheets where appropriate.

---

# 80. DESIGN FOR LARGE SCREENS

On desktop, use the available space intelligently.

Do not create giant empty areas.

For media tools:

```text
Preview
+
Controls
+
Output information
```

For tool discovery:

```text
Sidebar
+
Tool grid
```

---

# 81. TOOL CARDS

Tool cards should contain:

```text
Icon

Tool Name

One-line description

Status badge if needed

Arrow / action
```

Example:

```text
🎲
Comment Picker

Pick random giveaway winners
from supported comments.

Open →
```

---

# 82. CATEGORY LANDING PAGES

Create pages such as:

```text
/tools/images
/tools/video
/tools/audio
/tools/social
/tools/creator
```

Each should explain the category briefly and show tools.

---

# 83. RELATED TOOLS

Every tool should recommend related tools.

Example:

Thumbnail Downloader:

```text
You may also like

Thumbnail Checker
Image Compressor
Video → Thumbnail
Social Image Resizer
```

This keeps users inside MySocial.

---

# 84. GLOBAL TOOL SEARCH

Search should be extremely fast.

Support:

```text
Ctrl/Cmd + K
```

Fuzzy matching.

Example:

```text
thumb
```

should find:

* Thumbnail Downloader
* Thumbnail Checker
* Video → Thumbnail

---

# 85. COMMAND PALETTE ACTIONS

Include:

```text
Search tools
Open Comment Picker
Analyze URL
Compress image
Download thumbnail
Generate QR
Open extension
Toggle theme
```

---

# 86. NOTIFICATION SYSTEM

Create a reusable toast system.

Examples:

```text
Copied!
Downloaded!
Processing complete!
URL cleaned!
Draw verified!
```

Do not overuse notifications.

---

# 87. PREFERENCES

Allow lightweight preferences:

* theme
* reduced motion
* default tool behavior
* recent tools

Store locally initially.

---

# 88. DOCUMENTATION

Create:

```text
README.md
```

Explain:

* MySocial architecture
* setup
* development
* environment variables
* Vercel
* API configuration
* tool architecture
* extension
* adding a new tool
* adding a new platform
* security

Also create:

```text
docs/
```

where useful.

---

# 89. ADDING A NEW TOOL MUST BE EASY

A future developer should be able to add:

```text
/tools/new-tool
```

without modifying 20 unrelated files.

Create a clear pattern:

```text
tools/
  new-tool/
    components/
    lib/
    types.ts
    page.tsx
```

Then register it in the central tool registry.

---

# 90. ADDING A NEW PLATFORM MUST BE EASY

Future platforms should plug into:

```text
platforms/
```

without rewriting:

* URL analyzer
* navigation
* tool registry
* core media engine

Use capability-based architecture.

---

# 91. NO FAKE FEATURES

This is critical.

If a tool is not actually implemented:

```text
Coming soon
```

Do not make a button that appears functional but does nothing.

Do not use fake sample API responses in production.

During development, mocks may be used only when explicitly isolated and clearly marked.

---

# 92. NO FAKE API SUCCESS

Never display:

```text
12,483 comments loaded
```

unless 12,483 comments were actually loaded.

Never show:

```text
Download complete
```

unless the file actually exists.

Never show:

```text
AI generated
```

unless an AI provider actually generated it.

Trust is more important than appearance.

---

# 93. PRIVACY

Create a simple privacy explanation.

Tell users when:

* a file is processed locally
* a file is uploaded
* a third-party API is contacted
* data is temporarily processed

Do not collect data unnecessarily.

---

# 94. LEGAL/PLATFORM CAPABILITY UX

Do not create a giant scary legal wall.

Instead, contextualize limitations.

Example:

```text
This tool currently works with media
you upload or are authorized to process.
```

For platform integrations:

```text
This feature uses the platform's official API.
Availability depends on the platform's current access rules.
```

Keep it understandable.

---

# 95. MEDIA PROCESSING ARCHITECTURE

Create abstraction:

```text
media/
  types/
  detect/
  process/
  encode/
  metadata/
```

Do not tightly couple UI to FFmpeg or any single processing implementation.

If FFmpeg/WASM is used, lazy-load it only for tools that need it.

Do not load huge WASM bundles on initial page load.

---

# 96. BROWSER VS SERVER PROCESSING

Use this decision process:

### Browser

Prefer for:

* QR
* image resizing
* image compression
* simple format conversion
* basic metadata
* lightweight media operations

### Server / Worker

Use where required for:

* larger media
* CPU-heavy operations
* operations impossible in browser

But verify Vercel constraints first.

If Vercel is unsuitable, create a provider abstraction for a future worker service rather than coupling the entire app to Vercel functions.

---

# 97. PERFORMANCE BUDGET

Keep the homepage lightweight.

Do not import:

* FFmpeg
* heavy AI SDKs
* image processing libraries
* video processing libraries

into the homepage bundle.

Load them only when required.

---

# 98. PWA / EXTENSION / WEBSITE RELATIONSHIP

Architecture:

```text
                MySocial
                   │
       ┌───────────┼───────────┐
       │           │           │
     Website      PWA      Extension
       │                       │
       └───────────┬───────────┘
                   │
              Tool Routes
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
       YouTube   Media    Utilities
```

The extension should not duplicate core tool logic.

The website is the source of truth.

---

# 99. URL ROUTING

Recommended structure:

```text
/
 /tools
 /tools/comment-picker
 /tools/thumbnail-downloader
 /tools/thumbnail-checker
 /tools/image-compressor
 /tools/image-converter
 /tools/image-resizer
 /tools/video-compressor
 /tools/video-converter
 /tools/video-to-gif
 /tools/video-to-thumbnail
 /tools/frame-extractor
 /tools/url-analyzer
 /tools/url-cleaner
 /tools/qr-generator
 /tools/social-links
 /tools/caption-generator
 /tools/title-generator
 /tools/hashtag-generator
 /tools/hook-generator
 /tools/profile-tools
 /extension
 /draw/[drawId]
```

Adjust if a better route structure exists.

---

# 100. OLD MYCP URL ROUTING

Preserve:

```text
https://mycp.mannuyadav.me/
```

and any existing deep links.

If appropriate:

```text
mycp.mannuyadav.me
```

can redirect to:

```text
mycp.mannuyadav.me/tools/comment-picker
```

but do not break existing result/draw URLs.

---

# 101. SOCIAL URL SHORT ROUTES

Preserve/create:

```text
/y/[videoId]
/r/[postId]
/i/[mediaId]
```

These should route into the correct tool.

Example:

```text
/y/ABC123
```

should open the YouTube-powered MySocial experience.

---

# 102. FUTURE DOMAIN MIGRATION

The entire application should work if:

```text
mycp.mannuyadav.me
```

becomes:

```text
mysocial.in
```

Only configuration, OAuth callback URLs, Vercel domain configuration and external platform settings should need updating.

No source-wide search-and-replace.

---

# 103. QUALITY BAR

This is NOT a school project.

This is NOT a basic CRUD application.

Do not stop when:

```text
npm run build
```

works.

The product must feel finished.

Test:

* loading
* empty
* error
* success
* mobile
* desktop
* slow network
* invalid files
* invalid URLs
* API failure
* API quota
* unsupported platform
* large file
* repeated clicks
* browser back button
* refresh
* share links

---

# 104. FINAL VISUAL BAR

The first reaction should be:

> "Whoa, this looks like a real product."

Not:

> "This looks like a collection of developer demo pages."

Use:

* excellent typography
* strong spacing
* polished interactions
* subtle animation
* clear hierarchy
* consistent icons
* beautiful previews
* excellent empty states
* excellent success states

But never sacrifice performance for decoration.

---

# 105. DEVELOPMENT WORKFLOW

Do not attempt to rewrite the entire application blindly.

Work in stages.

## Stage 1

Inspect existing project.

## Stage 2

Create MySocial design system.

## Stage 3

Create tool registry.

## Stage 4

Migrate Comment Picker.

## Stage 5

Build homepage/tool discovery.

## Stage 6

Build Thumbnail Downloader.

## Stage 7

Build Image Tools.

## Stage 8

Build Video Tools.

## Stage 9

Build Audio Tools.

## Stage 10

Build URL/Social tools.

## Stage 11

Build QR/profile utilities.

## Stage 12

Build AI architecture/tools where credentials are available.

## Stage 13

Build extension.

## Stage 14

Polish everything.

## Stage 15

Test and deploy.

---

# 106. IMPLEMENTATION RULE

After each major stage:

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Fix all errors before moving forward.

Do not accumulate technical debt.

---

# 107. GIT SAFETY

Before major migration:

Check:

```bash
git status
```

Create a safe checkpoint/commit before restructuring.

Do not delete the existing working implementation without a recoverable Git state.

---

# 108. DO NOT ASK UNNECESSARY QUESTIONS

You have permission to make reasonable engineering decisions.

If something can be decided safely:

Decide it.

If a credential is missing:

Build the integration around an environment variable and document it.

If an API is unavailable:

Build the adapter and UI state without pretending it works.

If a feature is too heavy for Vercel:

Architect a worker abstraction.

Do not stop the entire project over a non-critical decision.

---

# 109. WHEN API ACCESS IS REQUIRED

The UI should say:

```text
This tool requires an API connection.
```

and provide configuration instructions for the developer.

Do not expose credentials to users.

---

# 110. WHEN A FEATURE IS NOT AVAILABLE

Use:

```text
Coming soon
```

or:

```text
Requires account connection
```

or:

```text
Requires API access
```

depending on the actual reason.

---

# 111. CORE PRODUCT PRINCIPLE

MySocial should always answer:

> "Why would a creator use this instead of opening five different websites?"

Answer:

Because MySocial is:

* unified
* fast
* beautiful
* privacy-conscious
* creator-focused
* easy to use
* extensible
* trustworthy

---

# 112. SUCCESS CRITERIA

At the end of this transformation, a new visitor should be able to:

1. Open MySocial.
2. Immediately understand what it is.
3. Search for a tool.
4. Open a tool within seconds.
5. Complete the task without creating an account.
6. Get a beautiful result.
7. Download/copy/share it.
8. Discover related tools.
9. Return later and find recently used tools.
10. Install the browser extension.

---

# 113. THE FINAL TOOL ECOSYSTEM

The target ecosystem is approximately:

```text
MY SOCIAL
│
├── ENGAGE
│   ├── Comment Picker
│   ├── Comment Counter
│   ├── Comment Cleaner
│   └── Giveaway Tools
│
├── IMAGES
│   ├── Thumbnail Downloader
│   ├── Thumbnail Checker
│   ├── Image Compressor
│   ├── Image Converter
│   ├── Image Resizer
│   └── Social Image Resizer
│
├── VIDEO
│   ├── Video Compressor
│   ├── Video Converter
│   ├── Video → GIF
│   ├── Video → Thumbnail
│   ├── Frame Extractor
│   └── Social Video Resizer
│
├── AUDIO
│   ├── Audio Converter
│   ├── Audio Compressor
│   ├── Audio Metadata
│   └── Waveform Generator
│
├── SOCIAL
│   ├── URL Analyzer
│   ├── URL Cleaner
│   ├── Social Metadata
│   ├── Social Link Generator
│   └── Profile Tools
│
├── CREATOR
│   ├── Caption Generator
│   ├── Title Generator
│   ├── Hashtag Generator
│   ├── Hook Generator
│   ├── Description Generator
│   └── Comment Reply Generator
│
├── AI
│   └── AI Creator Tools
│
└── UTILITIES
    ├── QR Generator
    ├── File Information
    └── More creator utilities
```

This is the destination, not necessarily something that must all be fully implemented in one coding pass.

Prioritize quality over blindly checking boxes.

---

# 114. FINAL INSTRUCTION TO THE CODING AGENT

Build **MySocial** as a serious, scalable, polished product.

Do not create a generic template.

Do not create fake functionality.

Do not scrape platforms to bypass their APIs.

Do not expose secrets.

Do not destroy existing functionality.

Do not hard-code the current domain.

Do not assume today's APIs will remain unchanged.

Do not over-engineer infrastructure unnecessarily.

Do not make the homepage heavy.

Do not compromise accessibility.

Do not sacrifice performance for visual effects.

Do not stop at "the code compiles."

Instead:

**Inspect → Plan → Implement → Test → Polish → Build → Verify → Deploy.**

The existing MyCP Comment Picker is the foundation.

Transform it into:

# MySocial

A beautiful, fast, extensible **social-media creator toolkit**.

The final product should make users think:

> **"Why didn't I have this before?"**

And developers should think:

> **"This architecture can actually grow."**

That is the quality bar.
