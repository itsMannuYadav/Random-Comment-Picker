// Runs in the PAGE's own JS context (manifest "world": "MAIN"), not the
// extension's isolated world — required to see window.ytInitialPlayerResponse
// and to intercept the page's own fetch() calls. YouTube is a single-page
// app: navigating between videos does NOT reload the page or re-run
// document_start scripts, so the only reliable way to get streamingData for
// every video visited (not just the first) is to watch the same
// /youtubei/v1/player request the page itself makes internally on each
// client-side navigation, and read its response body.
//
// This reads data already present in the page the user is legitimately
// watching in their own real browser session — no signature deciphering, no
// synthesized requests, nothing that impersonates a client.

(function () {
  function post(data) {
    window.postMessage({ source: "mysocial-yt", type: "player-response", data }, "*");
  }

  function extractRelevant(playerResponse) {
    if (!playerResponse || typeof playerResponse !== "object") return null;
    const videoDetails = playerResponse.videoDetails;
    const streamingData = playerResponse.streamingData;
    if (!videoDetails || !streamingData) return null;

    const toFormat = (f) => ({
      itag: f.itag,
      mimeType: f.mimeType,
      qualityLabel: f.qualityLabel || null,
      audioQuality: f.audioQuality || null,
      bitrate: f.bitrate || null,
      contentLength: f.contentLength || null,
      width: f.width || null,
      height: f.height || null,
      // Only present for formats YouTube didn't bother ciphering (common for
      // lower-demand videos/resolutions) -- safe to use directly since it's
      // a plain URL the page's own response already handed us.
      url: f.url || null,
    });

    return {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      author: videoDetails.author,
      lengthSeconds: Number(videoDetails.lengthSeconds) || null,
      thumbnail: (videoDetails.thumbnail?.thumbnails || []).slice(-1)[0]?.url || null,
      formats: (streamingData.formats || []).map(toFormat),
      adaptiveFormats: (streamingData.adaptiveFormats || []).map(toFormat),
    };
  }

  // 1. Whatever is already inlined on first load of a /watch page.
  if (window.ytInitialPlayerResponse) {
    const extracted = extractRelevant(window.ytInitialPlayerResponse);
    if (extracted) post(extracted);
  }

  // 2. Every subsequent SPA navigation re-fetches this same endpoint --
  // intercept fetch() to see each response as it arrives.
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      if (url.includes("/youtubei/v1/player")) {
        response
          .clone()
          .json()
          .then((json) => {
            const extracted = extractRelevant(json);
            if (extracted) post(extracted);
          })
          .catch(() => {});
      }
    } catch {
      /* never let interception break the page's own request */
    }
    return response;
  };

  // 3. Some YouTube surfaces (older code paths) still use XHR for the same
  // endpoint instead of fetch().
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__mysocialUrl = url;
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    if (typeof this.__mysocialUrl === "string" && this.__mysocialUrl.includes("/youtubei/v1/player")) {
      this.addEventListener("load", () => {
        try {
          const extracted = extractRelevant(JSON.parse(this.responseText));
          if (extracted) post(extracted);
        } catch {
          /* ignore parse failures */
        }
      });
    }
    return originalSend.apply(this, args);
  };
})();
