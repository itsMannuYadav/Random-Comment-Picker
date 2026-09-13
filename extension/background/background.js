// Mirrors utils/config.js -- duplicated because that file is a classic
// (non-module) script shared via popup.html's global scope, and this file is
// an ES module service worker that can't load it the same way. Update BOTH
// when the app migrates domains.
const MYSOCIAL_APP_URL = "https://mysocial.mannuyadav.me";

// Service worker (MV3). Owns three things:
//  1. Per-tab video metadata, relayed from content/inject.js via
//     content/youtube-watch.js (window.ytInitialPlayerResponse + every
//     /youtubei/v1/player response the page's own SPA navigation makes).
//  2. Per-tab captured playback URLs: observed (never synthesized) from
//     *.googlevideo.com requests the user's own real player already issued
//     and got served successfully during ordinary playback. A URL only
//     appears here after YouTube's own player used it -- we never contact
//     googlevideo.com ourselves until the user asks to download something
//     already captured this way.
//  3. Talking to the offscreen document to mux a captured video-only +
//     audio-only pair into one file when the user wants a resolution above
//     what progressive (single-file) formats offer.

/** @type {Map<number, { meta: object|null, captured: Map<number, {url:string, contentLength:string|null, mimeType:string|null}> }>} */
const tabState = new Map();

function getTab(tabId) {
  let state = tabState.get(tabId);
  if (!state) {
    state = { meta: null, captured: new Map() };
    tabState.set(tabId, state);
  }
  return state;
}

chrome.tabs.onRemoved.addListener((tabId) => tabState.delete(tabId));

// --- 1. Metadata from the content script -----------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PLAYER_RESPONSE" && sender.tab) {
    const state = getTab(sender.tab.id);
    // A different video than what we had -- drop stale captured URLs.
    if (state.meta?.videoId !== message.data.videoId) {
      state.captured.clear();
    }
    state.meta = message.data;
    return; // no response needed
  }

  if (message.type === "GET_STATE") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const state = tab ? tabState.get(tab.id) : null;
      sendResponse({
        meta: state?.meta ?? null,
        captured: state ? Object.fromEntries(state.captured) : {},
      });
    })();
    return true; // async response
  }

  if (message.type === "DOWNLOAD_FORMAT") {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const state = tab ? tabState.get(tab.id) : null;
        if (!state?.meta) throw new Error("No video detected in this tab.");
        await handleDownload(state, message);
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    })();
    return true;
  }

  // From the Video Downloader extension page (pages/video-downloader) --
  // formats already fully resolved by our own backend (/api/video-download/info),
  // not captured from live playback. Reddit/Vimeo/webpage-extractor/direct-link
  // downloads all go through here.
  if (message.type === "DOWNLOAD_GENERIC") {
    (async () => {
      try {
        await handleGenericDownload(message);
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    })();
    return true;
  }
});

// --- 2. Capture playback URLs the real player already used -----------------
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    let url;
    try {
      url = new URL(details.url);
    } catch {
      return;
    }
    const itag = Number(url.searchParams.get("itag"));
    if (!itag) return;

    const state = getTab(details.tabId);
    // Strip the chunk-specific `range` query param -- we'll request the full
    // resource ourselves later via an HTTP Range header, not reuse this
    // exact byte slice.
    url.searchParams.delete("range");
    url.searchParams.delete("rn");
    url.searchParams.delete("rbuf");

    state.captured.set(itag, {
      url: url.toString(),
      contentLength: url.searchParams.get("clen"),
      mimeType: url.searchParams.get("mime") ? decodeURIComponent(url.searchParams.get("mime")) : null,
    });
  },
  { urls: ["*://*.googlevideo.com/videoplayback*"] },
);

// --- 3. Download / mux -------------------------------------------------------
function sanitizeFilename(name) {
  return (name || "video").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120);
}

/** Progressive formats can carry a plain, already-usable URL straight from
 * streamingData -- nobody had to play anything for that to exist. Only
 * fall back to the webRequest-captured map (adaptive tracks, or a
 * progressive format YouTube did cipher) when there's no plain URL. */
function resolveVideoUrl(state, itag) {
  const plain = state.meta?.formats?.find((f) => f.itag === itag)?.url;
  if (plain) return plain;
  return state.captured.get(itag)?.url ?? null;
}

async function handleDownload(state, { videoItag, audioItag }) {
  const videoUrl = resolveVideoUrl(state, videoItag);
  if (!videoUrl) throw new Error("This quality hasn't been captured yet -- play the video at that quality first.");

  const filenameBase = sanitizeFilename(state.meta.title);

  if (!audioItag) {
    // Progressive (single file, already has audio) or a plain unciphered
    // format URL straight from streamingData.formats.
    await chrome.downloads.download({ url: videoUrl, filename: `${filenameBase}.mp4` });
    return;
  }

  const audio = state.captured.get(audioItag);
  if (!audio) throw new Error("The audio track hasn't been captured yet -- let the video play a little further.");

  await ensureOffscreenDocument();
  const result = await chrome.runtime.sendMessage({
    type: "MUX",
    videoUrl,
    audioUrl: audio.url,
    filename: `${filenameBase}.mp4`,
  });
  if (!result?.ok) throw new Error(result?.error || "Muxing failed.");
}

/** Routes a CDN URL through our own backend's file proxy -- same reason the
 * website does this (see src/lib/video-download/mux.ts): forces a real
 * Content-Disposition download and means the offscreen document's ffmpeg
 * fetch never depends on the source CDN sending permissive CORS headers,
 * since we have no way to know in advance which CDN host_permissions to
 * declare for an arbitrary webpage-extracted or Reddit/Vimeo URL. */
function proxyUrl(url) {
  return `${MYSOCIAL_APP_URL}/api/video-download/file?url=${encodeURIComponent(url)}`;
}

async function handleGenericDownload({ videoUrl, audioUrl, filename, skipProxy }) {
  if (!audioUrl) {
    const downloadUrl = skipProxy ? videoUrl : proxyUrl(videoUrl);
    await chrome.downloads.download({ url: downloadUrl, filename });
    return;
  }

  await ensureOffscreenDocument();
  const result = await chrome.runtime.sendMessage({
    type: "MUX",
    videoUrl: proxyUrl(videoUrl),
    audioUrl: proxyUrl(audioUrl),
    filename,
  });
  if (!result?.ok) throw new Error(result?.error || "Muxing failed.");
}

let offscreenReady = null;
async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  if (!offscreenReady) {
    offscreenReady = chrome.offscreen.createDocument({
      url: "offscreen/offscreen.html",
      reasons: ["WORKERS"],
      justification: "Runs ffmpeg.wasm to combine a captured video-only and audio-only track into one file.",
    });
  }
  await offscreenReady;
}
