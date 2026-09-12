# MyCP — Universal Comment Picker

## Production-Ready Web App + Browser Extension

You are an expert senior full-stack engineer, product designer, UI/UX designer, security engineer, and software architect.

We are building a production-quality SaaS/product called **MyCP — My Comment Picker**.

The goal is to recreate the useful concept of the classic 2018–2019 random comment picker tools, but build a much more polished, modern, trustworthy, extensible 2026 version.

This is NOT intended to be a cheap-looking utility website.

It should feel like a real, polished SaaS product that a YouTuber, Instagram creator, influencer, agency, or brand would confidently use during a public giveaway.

---

# 1. PRODUCT VISION

MyCP allows users to provide a supported social-media post/video URL, retrieve eligible comments/replies through the platform's officially supported APIs, apply filters, randomly select one or multiple winners, and generate a transparent result that can be shared publicly.

Core concept:

```text
Paste URL
    ↓
Detect platform
    ↓
Connect account if required
    ↓
Fetch comments
    ↓
Normalize comments
    ↓
Apply filters
    ↓
Build eligible entry pool
    ↓
Secure random selection
    ↓
Winner animation
    ↓
Winner result
    ↓
Public verification/share page
```

The product should eventually support:

* YouTube
* Instagram
* Reddit
* Threads
* Facebook
* LinkedIn
* TikTok where officially permitted
* X where officially permitted

However, DO NOT pretend every platform has the same API capabilities.

Every platform must have its own adapter/integration.

---

# 2. VERY IMPORTANT API/POLICY RULE

Do NOT build the application around scraping social-media websites.

Do NOT use:

* HTML scraping
* unofficial private endpoints
* reverse-engineered APIs
* browser automation to bypass platform restrictions
* CAPTCHA bypassing
* proxy rotation intended to evade restrictions
* stolen/session cookies
* unofficial APIs when an official API is required for the use case

Use official APIs and documented authentication mechanisms wherever required.

Before implementing any platform integration:

1. Check the current official developer documentation.
2. Verify that the intended endpoint is actually available.
3. Verify the required permissions.
4. Verify whether the endpoint allows this exact product use case.
5. Verify rate limits/quota.
6. Verify whether the API requires the user's account to be connected.
7. Verify whether the API is restricted to specific account types.
8. Never assume an old tutorial from 2020/2021 is still valid.
9. If an integration cannot legally/technically be implemented through an appropriate official API, create a clean "Coming soon / API access required" state rather than implementing a workaround.

The application must remain extensible so that a future API change does not require rewriting the entire application.

**Amendment (2026-09-12):** YouTube video download is a deliberate, explicit exception to this rule — YouTube's Data API has no video-file-download endpoint for third-party videos at all, so rule 9's "Coming soon" fallback was replaced with an unofficial implementation (parsing YouTube's public player response, the same technique tools like yt-dlp use) by product decision. This is disclosed in the UI (see VIDEO_DOWNLOAD_STATUS in src/lib/video-download/platform-status.ts) rather than presented as an official integration. The rule above still applies to every other platform and every other feature.

---

# 3. INITIAL PLATFORM PRIORITY

Implement the architecture for all platforms, but prioritize actual implementation in this order:

### Phase 1

1. YouTube
2. Reddit

### Phase 2

3. Instagram

### Phase 3

4. Threads
5. Facebook
6. LinkedIn

### Future / conditional

7. TikTok
8. X

Do not waste development time implementing unsupported integrations through scraping.

---

# 4. YOUTUBE — PRIMARY INTEGRATION

YouTube should be the most polished integration in V1.

Use the official YouTube Data API.

The application should be able to accept URLs such as:

```text
https://www.youtube.com/watch?v=VIDEO_ID
https://youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/shorts/VIDEO_ID
```

Extract the video ID safely.

Do not assume every URL is valid.

Validate:

* domain
* URL structure
* video ID
* unsupported YouTube URL types

Retrieve comment threads using the official API.

Remember that a comment thread can contain a top-level comment and replies, and that complete reply retrieval may require the appropriate comments endpoint.

Implement pagination correctly.

Do NOT assume that the first API response contains every comment.

The UI must communicate progress while comments are being retrieved.

Example:

```text
Fetching comments...

Page 1
Page 2
Page 3

12,481 comments collected
```

Where appropriate, show:

```text
Comments found
Replies found
Total entries
```

---

# 5. REDDIT INTEGRATION

Support Reddit post URLs.

Examples:

```text
https://www.reddit.com/r/subreddit/comments/POST_ID/...
https://reddit.com/r/subreddit/comments/POST_ID/...
```

Extract the post identifier.

Build a Reddit adapter separate from the YouTube adapter.

Normalize Reddit comments into the same internal comment structure.

Support:

* top-level comments
* replies
* author
* comment text/body
* score
* created date
* permalink
* parent ID

Respect the current Reddit developer/API requirements.

Because Reddit's developer platform/API policies are evolving, keep the integration isolated behind an adapter and make the API implementation replaceable.

---

# 6. INSTAGRAM

Instagram should use official Meta/Instagram API mechanisms.

Do not attempt to fetch arbitrary Instagram comments by scraping public HTML.

The UX must clearly handle the fact that Instagram API access may require:

* account connection
* authentication
* appropriate permissions
* supported professional account types
* access to the user's own media

Possible UX:

```text
Instagram

Connect Instagram
       ↓
Authorize MyCP
       ↓
Choose your post/reel
       ↓
Load comments
```

If a user pastes an Instagram URL that cannot be accessed with the currently authorized account, explain the issue clearly.

Never silently fail.

---

# 7. UNIVERSAL PLATFORM ADAPTER ARCHITECTURE

Do NOT create one giant function such as:

```text
fetchComments(platform, url)
```

Instead create a proper adapter architecture.

Conceptually:

```text
src/
  integrations/
    youtube/
      parser
      client
      mapper
      types

    reddit/
      parser
      client
      mapper
      types

    instagram/
      parser
      client
      mapper
      types

    threads/
    facebook/
    linkedin/
    tiktok/
    x/

  core/
    comment-engine/
    filters/
    random/
    verification/
```

All platforms should eventually map into one normalized internal model.

Example:

```ts
interface NormalizedComment {
  id: string;
  platform: Platform;
  postId: string;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  likeCount?: number;
  score?: number;
  replyCount?: number;
  parentId?: string | null;
  isReply: boolean;
  permalink?: string;
  raw?: unknown;
}
```

The rest of the application should not care whether the comment originated from YouTube, Reddit, or Instagram.

---

# 8. URL DETECTION ENGINE

Create a reusable URL detection system.

The user should be able to paste a URL into one input.

Automatically detect:

```text
YouTube
Instagram
Reddit
Threads
Facebook
LinkedIn
TikTok
X
Unknown
```

Example:

```text
https://youtube.com/watch?v=ABC123
```

becomes:

```text
Platform: YouTube
Resource ID: ABC123
```

If unsupported:

```text
We don't support this platform yet.
```

Do not expose technical errors to normal users.

---

# 9. THE CUSTOM URL / MYCP LINK SYSTEM

This is a major feature.

The application must support MyCP URLs such as:

```text
https://mycp.mannuyadav.me/y/VIDEO_ID
```

and:

```text
https://mycp.mannuyadav.me/r/POST_ID
```

and eventually:

```text
https://mycp.mannuyadav.me/i/MEDIA_ID
```

Use short platform prefixes:

```text
/y/ = YouTube
/r/ = Reddit
/i/ = Instagram
/t/ = TikTok
/th/ = Threads
/f/ = Facebook
/li/ = LinkedIn
/x/ = X
```

Also support a friendly YouTube-compatible route:

```text
https://mycp.mannuyadav.me/watch?v=VIDEO_ID
```

When someone opens:

```text
https://mycp.mannuyadav.me/watch?v=ABC123
```

MyCP should recognize:

```text
platform = youtube
videoId = ABC123
```

and immediately load the picker interface.

IMPORTANT:

Do not attempt to modify or intercept the real YouTube domain.

The custom URL is simply a URL on our own domain that follows a familiar YouTube-like structure.

---

# 10. FUTURE CUSTOM DOMAIN SUPPORT

The current development domain will be:

```text
mycp.mannuyadav.me
```

This is temporary.

Eventually we may purchase a dedicated domain such as:

```text
mycp.in
```

or another suitable brand/domain.

Therefore:

### NEVER hard-code:

```text
mycp.mannuyadav.me
```

inside application logic.

Create environment variables.

Example:

```env
NEXT_PUBLIC_APP_URL=https://mycp.mannuyadav.me
NEXT_PUBLIC_APP_NAME=MyCP
```

All generated links must use the configured application URL.

Example:

```ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

Do not scatter domain strings throughout the codebase.

The application must work after changing only environment variables and Vercel domain configuration.

---

# 11. VERCEL COMPATIBILITY

The application will be hosted on Vercel.

Everything must be Vercel-compatible.

Prefer:

* Next.js
* TypeScript
* server-side API routes / route handlers
* server components where appropriate
* client components only where interaction requires them
* Vercel-compatible serverless architecture
* environment variables
* no dependency on a permanent local server
* no filesystem persistence
* no long-running local process
* no architecture that requires a traditional VPS

Avoid unnecessary infrastructure.

The app should be deployable through:

```text
GitHub
    ↓
Vercel
    ↓
Production
```

---

# 12. RECOMMENDED STACK

Use a modern stable stack compatible with the existing development environment.

Preferred:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide icons
```

Use clean component architecture.

If a backend/database is required for:

* user accounts
* draw history
* saved campaigns
* verification records

design the application so Supabase can be used cleanly.

Do not introduce unnecessary dependencies.

---

# 13. HOMEPAGE UI

The homepage should immediately communicate:

> Pick a winner. Fairly.

Possible headline:

```text
Pick a winner.
Make it fair.
```

Subheading:

```text
Randomly select winners from YouTube, Reddit,
Instagram and more — with powerful filters
and transparent draw results.
```

Primary interaction should be visible immediately.

Example:

```text
┌─────────────────────────────────────────────────┐
│ 🔗 Paste a YouTube, Instagram or Reddit URL    │
│                                                 │
│                              [ Pick a Comment ] │
└─────────────────────────────────────────────────┘
```

Do not make the homepage feel like a generic SaaS dashboard.

It should feel like a modern creator tool.

---

# 14. DESIGN DIRECTION

The UI quality is extremely important.

The product should feel:

* premium
* modern
* playful
* trustworthy
* fast
* clean
* creator-friendly
* slightly celebratory
* visually memorable

Avoid:

* generic Bootstrap-looking pages
* excessive gradients
* excessive glassmorphism
* giant empty areas
* boring admin-panel aesthetics
* excessive rounded cards everywhere
* random animations
* visual clutter

Use strong hierarchy.

Use a sophisticated visual system.

Suggested visual language:

```text
Warm neutral background
+
Strong primary accent
+
Dark text
+
Subtle borders
+
Soft shadows
+
Occasional celebratory accent
```

Use the product's own identity rather than copying another existing comment picker.

---

# 15. RESPONSIVE DESIGN

The product must work beautifully on:

* desktop
* laptop
* tablet
* mobile

Desktop should feel like a proper application.

Mobile should not simply be a compressed desktop version.

The picker interface should be especially good on mobile.

---

# 16. MAIN USER FLOW

Implement this flow:

```text
Homepage
    ↓
Paste URL
    ↓
Detect platform
    ↓
Validate URL
    ↓
Load resource
    ↓
Fetch comments
    ↓
Show loading progress
    ↓
Show comment statistics
    ↓
Configure filters
    ↓
Build eligible entries
    ↓
Show eligible count
    ↓
Pick winner
    ↓
Animation
    ↓
Winner
    ↓
Result / verification page
```

---

# 17. COMMENT LOADING SCREEN

Do not show a boring spinner.

Create a polished loading experience.

Example:

```text
Fetching comments

████████████████░░░░

8,421 comments loaded

We're collecting every eligible entry...
```

Possible animated stages:

```text
✓ Connecting
✓ Reading comments
✓ Processing replies
● Applying filters
○ Preparing draw
```

Do not fake progress.

Progress indicators should correspond to actual application stages whenever possible.

---

# 18. COMMENT FILTER SYSTEM

Create a powerful but easy-to-understand filter panel.

Basic filters:

### Entries

* One entry per person
* Include replies
* Exclude replies
* Remove duplicate comments

### Text

* Must contain keyword
* Must contain hashtag
* Must contain phrase
* Minimum length
* Maximum length

### Content

* Exclude links
* Exclude empty comments
* Exclude blocked words
* Exclude obvious spam where technically possible

### Date

* After
* Before
* Between two dates

### Platform-specific

Show only filters that make sense for that platform.

Do not show irrelevant controls.

---

# 19. FILTER UX

Use a clean progressive-disclosure design.

Do not dump 30 filters on the user.

Start with:

```text
Quick filters
```

Then:

```text
Advanced filters
```

Example:

```text
ENTRY RULES

☑ One entry per person

COMMENT REQUIREMENTS

[ Add keyword ]

[ Add hashtag ]

ADVANCED
▸ Date range
▸ Text length
▸ Replies
▸ Spam/content rules
```

Show the effect live:

```text
12,483 comments

→ 11,204 after duplicate removal
→ 9,821 eligible entries
```

This makes the process transparent.

---

# 20. MULTIPLE WINNERS

Allow:

```text
Number of winners:
[ 1 ]
```

Possible values:

```text
1
2
3
5
10
Custom
```

For multiple winners, ensure the same entry cannot win twice in the same draw.

Unless we explicitly introduce a future "allow repeat winners" setting.

---

# 21. RANDOM SELECTION ENGINE

Do NOT use a simplistic:

```js
Math.random()
```

for the core draw.

Use an appropriate cryptographically secure random mechanism available in the runtime.

The draw engine should:

1. Receive normalized eligible entries.
2. Canonically order the entries.
3. Create a deterministic representation/hash of the candidate pool.
4. Generate secure randomness.
5. Select the winner/winners.
6. Record enough metadata to verify the result.

Create a dedicated module:

```text
core/random/
```

and:

```text
core/verification/
```

The random engine must be independent of the UI.

---

# 22. DRAW RECORD

Every completed draw should have a record similar to:

```ts
interface DrawRecord {
  id: string;
  platform: Platform;
  sourceId: string;
  sourceUrl: string;

  totalComments: number;
  eligibleEntries: number;

  filters: DrawFilters;

  winnerIds: string[];

  candidatePoolHash: string;

  algorithmVersion: string;

  createdAt: string;
}
```

Do not store unnecessary personal information.

Minimize retained social-media data.

---

# 23. FAIRNESS / VERIFICATION

This should be one of MyCP's biggest differentiators.

After the draw, show:

```text
DRAW COMPLETE

9,821 eligible entries

1 winner selected

✓ Filters preserved
✓ Candidate pool recorded
✓ Random selection completed
```

Create a unique:

```text
Draw ID
```

Example:

```text
MYCP-8F3A91
```

The result page should allow another person to verify the draw metadata.

---

# 24. PUBLIC RESULT PAGE

Create:

```text
/draw/[drawId]
```

Example:

```text
mycp.mannuyadav.me/draw/MYCP-8F3A91
```

Show:

```text
🏆 GIVEAWAY RESULT

WINNER

@username

"This was my favorite comment..."

YouTube

9,821 eligible entries

1 winner

Drawn on 23 August 2026

Draw ID
MYCP-8F3A91

[ Verify Draw ]
```

Make this page highly shareable.

---

# 25. WINNER ANIMATION

This is important.

The draw should feel exciting.

Do NOT instantly reveal the winner.

Use a short, polished sequence:

```text
Preparing entries...
      ↓
Randomising...
      ↓
Selecting...
      ↓
Winner found
      ↓
🎉 WINNER
```

Possible visual effects:

* subtle particles
* number counter
* rapidly cycling usernames
* card transitions
* confetti at final reveal

Keep animation performant.

Respect:

```text
prefers-reduced-motion
```

and provide a reduced-motion experience.

---

# 26. WINNER CARD

The winner card should be visually impressive.

Include:

* avatar if officially available and permitted
* username/name
* comment text
* platform
* original comment link
* draw ID
* winner number

Actions:

```text
View Comment
Copy Result
Share
Pick Another
```

---

# 27. "PICK ANOTHER WINNER"

If the user wants another winner:

Do not blindly rerun the exact same selection.

Maintain the existing winner set and exclude already selected entries.

Display:

```text
Winner 1
Winner 2
Winner 3
```

The user should understand exactly what happened.

---

# 28. BROWSER EXTENSION

Build a browser extension as part of the project.

Primary target:

### Chromium browsers

* Google Chrome
* Microsoft Edge
* other Chromium-based browsers where compatible

Use **Manifest V3**.

Do not build a Manifest V2 extension.

---

# 29. EXTENSION PURPOSE

The extension should make MyCP useful directly while a creator is viewing supported content.

Example:

User is watching:

```text
youtube.com/watch?v=ABC123
```

The extension detects the current supported URL.

Extension popup:

```text
MYCP

YouTube detected

MrBeast
"Giveaway Video"

12,483 comments

[ Open in MyCP ]
```

Clicking:

```text
Open in MyCP
```

opens:

```text
https://mycp.mannuyadav.me/y/ABC123
```

---

# 30. EXTENSION BUTTON ON WEBSITE

The website should have:

```text
Get the Extension
```

and:

```text
Add MyCP to your browser
```

Create a dedicated page:

```text
/extension
```

with:

```text
MyCP Browser Extension

Pick winners faster.

Detect supported social posts
directly from your browser.

[ Add to Chrome ]

[ Add to Edge ]

[ Manual Installation ]
```

If store publication is not yet available, provide:

```text
Manual installation
```

instructions for developer/unpacked installation.

Do NOT pretend the extension is published in a browser store if it isn't.

---

# 31. EXTENSION ARCHITECTURE

Create a separate extension directory:

```text
extension/
```

Example:

```text
extension/
  manifest.json
  popup/
  background/
  content/
  icons/
  utils/
```

Keep extension logic independent from the Next.js website.

The extension should communicate with the website using normal HTTPS URLs.

Do not put secret API keys inside the extension.

VERY IMPORTANT:

Never expose:

```text
YOUTUBE_API_KEY
META_SECRET
REDDIT_CLIENT_SECRET
```

inside extension JavaScript.

The extension should only open the MyCP website or call safe public endpoints.

---

# 32. EXTENSION SUPPORTED URL DETECTION

Initially detect:

```text
youtube.com/watch
youtube.com/shorts
youtu.be
reddit.com/r/.../comments/...
```

Eventually:

```text
instagram.com/p/...
instagram.com/reel/...
threads.net/...
```

But only show "Pick with MyCP" when the integration is actually supported.

---

# 33. WEBSITE + EXTENSION HANDOFF

Use URL routes as the contract.

Example:

```text
YouTube:
https://APP_URL/y/VIDEO_ID

Reddit:
https://APP_URL/r/POST_ID

Instagram:
https://APP_URL/i/MEDIA_ID
```

The extension should never need to know how the backend fetches comments.

This keeps the extension simple.

---

# 34. API ROUTES

Design clean API routes.

For example:

```text
/api/platform/detect
/api/youtube/video
/api/youtube/comments
/api/reddit/post
/api/reddit/comments
/api/instagram/media
/api/instagram/comments
/api/draw
/api/draw/[id]
```

Adjust the exact structure if a better architecture is found.

Do not expose provider API credentials.

All secrets must remain server-side.

---

# 35. ERROR HANDLING

Every failure should have a human-friendly message.

Examples:

### Invalid URL

```text
That doesn't look like a supported social-media URL.
```

### Unsupported platform

```text
We don't support this platform yet.
```

### Comments disabled

```text
Comments are disabled on this video.
```

### Authentication required

```text
Connect your account to access comments from this post.
```

### API quota

```text
This service is temporarily unavailable because the platform API limit was reached.
Please try again later.
```

### Deleted content

```text
We couldn't find this post. It may have been deleted or made private.
```

Never expose stack traces to users.

---

# 36. RATE LIMITING

Implement application-level rate limiting where appropriate.

Do not allow one visitor to repeatedly consume expensive platform API quota without limits.

Consider:

* IP rate limiting
* request throttling
* caching
* deduplication
* API response caching where allowed
* maximum comments per anonymous request
* authenticated limits later

The design must allow future usage tiers.

---

# 37. YOUTUBE QUOTA AWARENESS

YouTube API quota is finite.

Design the system so we do not make unnecessary API calls.

Avoid:

```text
fetch video metadata
fetch comments
fetch comments again
fetch comments again
```

unless required.

Cache appropriate data where platform terms permit it.

Use pagination efficiently.

Make the API client centralized.

---

# 38. SECURITY

Follow security best practices.

Protect:

* API keys
* OAuth secrets
* session tokens
* database credentials

Use environment variables.

Never expose server secrets to:

```text
NEXT_PUBLIC_*
```

Do not trust user-provided URLs blindly.

Validate and sanitize inputs.

Prevent:

* SSRF
* injection
* XSS
* open redirects
* malicious URLs
* arbitrary external fetches
* oversized requests

The URL parser should only allow known platform domains.

Do not create a generic:

```text
fetch(anyUserProvidedUrl)
```

endpoint.

---

# 39. DOMAIN / ENVIRONMENT CONFIGURATION

Create:

```text
.env.example
```

with placeholders such as:

```env
NEXT_PUBLIC_APP_NAME=MyCP
NEXT_PUBLIC_APP_URL=http://localhost:3000

YOUTUBE_API_KEY=

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=

DATABASE_URL=
```

Only include variables that are actually required.

Clearly separate:

```text
public environment variables
```

from:

```text
server-only secrets
```

Add comments explaining where each secret belongs.

---

# 40. LOCAL DEVELOPMENT

The project must run with a simple flow such as:

```bash
npm install
npm run dev
```

and:

```bash
npm run build
npm run start
```

No complicated local infrastructure unless absolutely necessary.

---

# 41. CODE QUALITY

Write production-quality code.

Requirements:

* TypeScript strict mode
* no unnecessary `any`
* reusable components
* clear naming
* small functions
* separation of concerns
* server/client separation
* proper error types
* loading states
* empty states
* accessible components
* meaningful comments only where needed

Do not over-engineer.

Do not create 500 tiny files for trivial components.

Use a sensible structure.

---

# 42. ACCESSIBILITY

Support:

* keyboard navigation
* visible focus states
* semantic HTML
* ARIA labels where needed
* sufficient contrast
* reduced motion
* screen-reader-friendly buttons
* accessible form labels

Do not sacrifice accessibility for visual effects.

---

# 43. SEO

Create strong metadata for the public website.

Homepage title:

```text
MyCP — Random Comment Picker for Giveaways
```

Description should communicate:

* random comment picker
* giveaway winner selection
* YouTube
* social media
* fair/transparent draws

Create metadata for:

```text
/
/extension
/about
/pricing (if implemented)
/draw/[drawId]
```

Do not index private/user-specific pages unnecessarily.

---

# 44. LANDING PAGE SECTIONS

Build a polished marketing homepage.

Suggested sections:

### Hero

```text
Pick a winner.
Make it fair.

Randomly select giveaway winners
from social-media comments.
```

Primary CTA:

```text
Pick a Comment
```

Secondary:

```text
Get the Extension
```

### Platform section

```text
Works with the platforms you use.
```

Show supported platforms with clear status.

Do not show a platform as fully supported when it isn't.

### How it works

```text
1. Paste
2. Filter
3. Pick
4. Share
```

### Fairness section

Explain:

```text
Transparent random selection
```

### Extension section

Show how the extension works.

### Final CTA

```text
Ready to pick a winner?
```

---

# 45. PLATFORM STATUS UI

Use clear labels:

```text
Available
Beta
Requires account connection
Coming soon
Unavailable
```

Never mislead users.

For example:

```text
YouTube
Available

Reddit
Available

Instagram
Requires account connection

TikTok
Coming soon
```

Update these based on actual implementation status.

---

# 46. EMPTY STATES

Create beautiful empty states.

Example:

```text
🎲

Your next winner is waiting.

Paste a supported post or video URL
to get started.
```

---

# 47. LOADING STATES

Every async operation must have a designed loading state.

Do not rely on browser default loading.

Create:

* skeletons
* progress indicators
* animated stages
* disabled buttons during requests
* cancellation/error handling where appropriate

---

# 48. RESPONSIVE FILTER PANEL

Desktop:

```text
Main content
+
Filter sidebar
```

Mobile:

```text
Main content

[ Filters ]

Bottom sheet / drawer
```

Do not make mobile users scroll through a huge filter sidebar.

---

# 49. DRAW HISTORY

Initially, anonymous users can have temporary/local history if appropriate.

Later authenticated users can have:

```text
Dashboard

Recent Draws

YouTube Giveaway
23 Aug 2026
9,821 entries
1 winner

Reddit Giveaway
21 Aug 2026
2,341 entries
3 winners
```

Architect the system so this can be added without rewriting the draw engine.

---

# 50. FUTURE USER ACCOUNTS

Do not make login mandatory for the basic V1 picker unless technically required.

A user should ideally be able to:

```text
Visit
↓
Paste
↓
Pick
```

without creating an account.

Accounts can later unlock:

* draw history
* saved campaigns
* branded result pages
* analytics
* multiple clients
* team members
* higher limits

---

# 51. FUTURE MONETIZATION

Do not implement a complicated payment system now.

But architect for:

### Free

* limited draws
* basic filters

### Pro

* unlimited/expanded draws
* advanced filters
* saved history
* branded result pages
* exports

### Agency

* multiple brands
* team members
* client workspaces
* campaign history

Do not let monetization architecture contaminate the V1 experience.

---

# 52. SHAREABLE RESULT

The result page should provide:

```text
Copy Link
Share
Copy Winner
Download Result
```

If browser share API is available:

```text
navigator.share(...)
```

use it appropriately.

Fallback to copy link.

---

# 53. EXPORT

Plan for:

```text
CSV
JSON
```

exports.

For V1, CSV can be enough.

Potential export:

```text
Winner
Username
Comment
Platform
Draw ID
Date
```

Do not export unnecessary private information.

---

# 54. ANALYTICS

Design an analytics abstraction.

Do not hard-code a single analytics vendor throughout the application.

Create a simple:

```text
analytics/
```

layer.

Track useful product events such as:

```text
url_submitted
platform_detected
comments_loaded
filter_applied
draw_started
draw_completed
result_shared
extension_clicked
```

Do not collect unnecessary personal data.

---

# 55. TESTING

Write tests for critical logic.

Especially:

### URL parsing

Test:

```text
youtube.com/watch
youtu.be
youtube.com/shorts
reddit post
invalid URLs
malicious URLs
```

### Filtering

Test:

* duplicate users
* keywords
* hashtags
* date ranges
* replies
* min/max length

### Winner selection

Test:

* one winner
* multiple winners
* zero eligible entries
* duplicate prevention
* deterministic verification metadata

### Security

Test:

* unsupported domains
* SSRF attempts
* malformed URLs
* huge input payloads

---

# 56. DOCUMENTATION

Create:

```text
README.md
```

Include:

* what MyCP is
* architecture
* local setup
* environment variables
* Vercel deployment
* YouTube API setup
* Reddit API setup
* future integrations
* extension development
* production deployment
* domain configuration
* security notes

Also create:

```text
docs/
```

where appropriate.

---

# 57. DO NOT MAKE THESE MISTAKES

Absolutely do NOT:

1. Scrape YouTube comments when the official API is available.
2. Scrape Instagram to bypass Meta API limitations.
3. Put API secrets into client-side JavaScript.
4. Put secrets into the browser extension.
5. Hard-code the current domain.
6. Build platform-specific logic into the core draw engine.
7. Assume every platform supports anonymous comment retrieval.
8. Fake support for unsupported platforms.
9. Use `Math.random()` as the core fairness mechanism.
10. create fake API responses and pretend the integration works.
11. hide API failures behind generic loading forever.
12. create a UI that looks like an old 2019 utility website.
13. overcomplicate the first release with unnecessary authentication.
14. make the extension dependent on the website's internal React components.
15. make the app dependent on a VPS or persistent Node process.
16. create an architecture that becomes impossible to migrate to a dedicated domain later.

---

# 58. DEVELOPMENT APPROACH

Do not immediately generate thousands of lines of code.

First inspect the repository.

Understand:

* existing files
* existing package manager
* existing Next.js configuration
* existing Tailwind setup
* existing components
* existing environment files
* existing deployment configuration

Then produce a concise implementation plan.

After that, implement incrementally.

At each major stage:

1. Implement.
2. Run type checks.
3. Run lint.
4. Run tests.
5. Build production bundle.
6. Fix errors.
7. Verify the UI.
8. Continue.

Do not stop after merely generating code.

---

# 59. IMPLEMENTATION ORDER

Follow this order unless there is a strong technical reason not to.

## Stage 1 — Foundation

* project inspection
* architecture
* theme
* typography
* design system
* layout
* environment configuration

## Stage 2 — Homepage

* hero
* URL input
* platform detection
* platform cards
* responsive design

## Stage 3 — YouTube

* URL parser
* API client
* pagination
* comment normalization
* loading state
* error handling

## Stage 4 — Comment engine

* normalization
* filtering
* deduplication
* eligible pool

## Stage 5 — Draw engine

* secure randomness
* winner selection
* multiple winners
* draw record
* verification metadata

## Stage 6 — Winner experience

* animation
* winner card
* result page
* sharing

## Stage 7 — Reddit

* parser
* API adapter
* normalization
* filters
* picker

## Stage 8 — Extension

* Manifest V3
* popup
* URL detection
* MyCP handoff
* extension landing page

## Stage 9 — Instagram architecture

* OAuth flow
* permissions
* media selection
* comments

Only implement what the current official API permits.

## Stage 10 — Polish

* accessibility
* SEO
* performance
* error states
* mobile
* testing
* deployment

---

# 60. DOMAIN ROUTING

The application must support all of these concepts:

```text
/
```

```text
/y/[videoId]
```

```text
/r/[postId]
```

```text
/i/[mediaId]
```

```text
/watch?v=[videoId]
```

```text
/draw/[drawId]
```

```text
/extension
```

The exact routing implementation can use Next.js dynamic routes, route handlers, middleware, or rewrites as appropriate.

Choose the simplest robust implementation.

---

# 61. FUTURE DOMAIN MIGRATION

Today:

```text
mycp.mannuyadav.me
```

Later:

```text
mycp.in
```

The migration should ideally require:

```text
Add custom domain in Vercel
Update NEXT_PUBLIC_APP_URL
Update OAuth callback URLs
Update extension production URL if required
Update platform application settings
Deploy
```

No source-code rewrite should be necessary.

Create a single source of truth for the application origin.

---

# 62. EXTENSION DOMAIN MIGRATION

The extension must not assume:

```text
mycp.mannuyadav.me
```

forever.

Use a configurable production URL.

During development:

```text
http://localhost:3000
```

During production:

```text
https://mycp.mannuyadav.me
```

Later:

```text
https://newdomain.com
```

Do not hard-code the production URL throughout the extension.

---

# 63. VISUAL DETAILS

Pay special attention to:

### Buttons

Primary CTA should feel exciting.

### URL input

It is the most important input on the homepage.

It should support:

* paste
* keyboard submission
* clear button
* platform detection
* validation
* loading state

### Winner reveal

This is the emotional highlight of the product.

Make it memorable without becoming childish.

### Result page

Should look good enough that an influencer would screenshot it and post it publicly.

---

# 64. BRAND FEEL

The name:

# MyCP

Meaning:

**My Comment Picker**

Possible brand language:

```text
Pick a winner.
Make it fair.
```

or:

```text
Random. Simple. Fair.
```

The brand should communicate:

* randomness
* fairness
* simplicity
* trust
* creator energy

Do not copy the branding of existing comment picker websites.

---

# 65. PERFORMANCE

The application may deal with thousands or potentially very large numbers of comments.

Do not blindly render thousands of comments into the browser.

Prefer:

* server-side processing
* streaming/progress where useful
* pagination
* efficient normalization
* efficient filtering
* virtualization when comments need to be displayed
* memory-conscious processing

The actual winner selection does not require displaying every comment.

---

# 66. IMPORTANT DATA MODEL PRINCIPLE

Separate:

```text
Source data
```

from:

```text
Normalized data
```

from:

```text
Draw data
```

Conceptually:

```text
Platform API
      ↓
Raw provider response
      ↓
Provider mapper
      ↓
NormalizedComment[]
      ↓
Filter engine
      ↓
EligibleEntry[]
      ↓
Draw engine
      ↓
Winner
```

This separation is critical.

---

# 67. DO NOT OVERBUILD THE DASHBOARD

The core product is:

```text
URL
→ comments
→ filters
→ winner
```

Make that experience exceptional before adding:

* complex dashboards
* billing
* teams
* campaigns
* CRM
* analytics
* notifications

The first-time user should understand the product in seconds.

---

# 68. FINAL QUALITY BAR

Before considering the project complete, verify:

```text
[ ] Homepage works
[ ] URL detection works
[ ] YouTube URL parsing works
[ ] YouTube comments load
[ ] Pagination works
[ ] Reddit integration works where officially supported
[ ] Filters work
[ ] Duplicate removal works
[ ] Multiple winners work
[ ] Winner cannot repeat
[ ] Secure random selection implemented
[ ] Draw ID generated
[ ] Result page works
[ ] Share works
[ ] Extension detects supported pages
[ ] Extension opens MyCP correctly
[ ] Extension does not contain secrets
[ ] Mobile UI works
[ ] Desktop UI works
[ ] Accessibility checked
[ ] SEO metadata exists
[ ] Error states are polished
[ ] Environment variables are documented
[ ] Domain is configurable
[ ] Vercel build succeeds
[ ] Production build succeeds
[ ] Tests pass
[ ] No obvious security vulnerabilities
```

---

# 69. MOST IMPORTANT INSTRUCTION

Do not treat this as a coding exercise.

Treat it as building a **real product**.

Every decision should consider:

* user experience
* API correctness
* platform policies
* scalability
* security
* maintainability
* future domain migration
* future platform integrations
* browser extension support
* Vercel deployment
* visual quality

When an API capability is uncertain, verify it using current official documentation rather than guessing.

When a platform does not permit the desired functionality through an appropriate official API, do not implement a scraping workaround.

When a feature is not yet possible, design the architecture so it can be added later.

---

# 70. FIRST TASK

Before writing implementation code:

1. Inspect the existing repository.
2. Identify the current framework and configuration.
3. Check whether a project already exists or whether this needs to be initialized.
4. Check existing dependencies.
5. Check whether Tailwind/shadcn is already configured.
6. Check whether Vercel configuration exists.
7. Check environment configuration.
8. Check Git status.
9. Do not overwrite existing useful work.
10. Create a concise implementation plan.
11. Then begin Stage 1.

Do not ask unnecessary questions if the repository already provides the answer.

Make reasonable engineering decisions yourself.

If a decision genuinely affects architecture or requires a credential that cannot be inferred, clearly identify it and continue implementing everything that does not depend on it.

The goal is to finish with a **beautiful, production-ready, Vercel-compatible MyCP Comment Picker**, with a clean architecture that can grow from:

```text
YouTube + Reddit
```

into:

```text
YouTube
Reddit
Instagram
Threads
Facebook
LinkedIn
TikTok
X
```

without rewriting the core product.

Build it like a serious product, not a demo.
