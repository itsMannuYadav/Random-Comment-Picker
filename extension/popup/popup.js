const PLATFORM_LABEL = { youtube: "YouTube", reddit: "Reddit", instagram: "Instagram" };

function render(html) {
  document.getElementById("content").innerHTML = html;
}

function thumbnailDownloaderHref(tabUrl) {
  return `${chrome.runtime.getURL("pages/thumbnail-downloader/thumbnail-downloader.html")}?url=${encodeURIComponent(tabUrl)}`;
}

function commentPickerHref(tabUrl) {
  return `${chrome.runtime.getURL("pages/comment-picker/comment-picker.html")}?url=${encodeURIComponent(tabUrl)}`;
}

/** Every action is a real, working MySocial destination — never a dead button.
 * All of these are native extension pages, not website redirects. */
function buildActions(match, tabUrl) {
  const actions = [
    { label: "Pick Winner", href: commentPickerHref(tabUrl), primary: true },
    { label: "Get Thumbnail", href: thumbnailDownloaderHref(tabUrl) },
  ];

  actions.push({
    label: "Analyze",
    href: `${MYSOCIAL_APP_URL}/tools/url-analyzer?url=${encodeURIComponent(tabUrl)}`,
  });

  return actions;
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!n) return "";
  const mb = n / (1024 * 1024);
  return mb >= 1 ? ` · ${mb.toFixed(0)} MB` : ` · ${(n / 1024).toFixed(0)} KB`;
}

/** Builds one row per downloadable YouTube quality, deduped by resolution/bitrate. */
function buildYoutubeRows(state) {
  const captured = state.captured || {};
  const rows = [];

  // Progressive formats YouTube didn't bother ciphering — instant, no need
  // to have played the video at all.
  for (const f of state.meta?.formats ?? []) {
    if (!f.url) continue;
    rows.push({
      key: `p-${f.itag}`,
      label: `${f.qualityLabel || "Video"} (with audio)`,
      size: formatBytes(f.contentLength),
      ready: true,
      onDownload: () => sendDownload({ videoItag: f.itag }),
    });
  }

  // Adaptive video-only tracks — need a matching captured audio track to mux.
  const bestAudioItag = Object.keys(captured)
    .map(Number)
    .filter((itag) => (state.meta?.adaptiveFormats ?? []).find((f) => f.itag === itag && f.mimeType?.startsWith("audio/")))
    .sort((a, b) => (captured[b]?.contentLength || 0) - (captured[a]?.contentLength || 0))[0];

  // Same resolution often exists as multiple itags (different codecs, e.g.
  // avc1 vs vp9) -- prefer whichever variant the player actually captured
  // over an uncaptured duplicate, so an already-downloadable stream never
  // hides behind a locked one that merely appears first.
  const videoOnly = (state.meta?.adaptiveFormats ?? []).filter((f) => f.mimeType?.startsWith("video/"));
  const byLabel = new Map();
  for (const f of videoOnly) {
    const label = f.qualityLabel || `${f.height}p`;
    const existing = byLabel.get(label);
    if (!existing || (!captured[existing.itag] && captured[f.itag])) {
      byLabel.set(label, f);
    }
  }

  for (const [label, f] of byLabel) {
    const captureEntry = captured[f.itag];
    const ready = Boolean(captureEntry && bestAudioItag);
    rows.push({
      key: `a-${f.itag}`,
      label: `${label} (mux)`,
      size: formatBytes(f.contentLength),
      ready,
      hint: ready ? "" : "Play the video at this quality to unlock it",
      onDownload: ready ? () => sendDownload({ videoItag: f.itag, audioItag: bestAudioItag }) : null,
    });
  }

  return rows.sort((a, b) => (b.label > a.label ? 1 : -1));
}

function sendDownload(payload) {
  chrome.runtime.sendMessage({ type: "DOWNLOAD_FORMAT", ...payload }, (result) => {
    if (!result?.ok) {
      alert(result?.error || "Download failed.");
    }
  });
}

function renderYoutubeDownload(state) {
  if (!state.meta) {
    return `<div class="yt-hint">Loading video info… if this doesn't update, reload the YouTube tab.</div>`;
  }

  const rows = buildYoutubeRows(state);
  if (rows.length === 0) {
    return `<div class="yt-hint">No downloadable quality captured yet - play the video for a few seconds, then reopen this popup.</div>`;
  }

  return `
    <div class="yt-title">${state.meta.title}</div>
    <div class="yt-rows">
      ${rows
        .map(
          (r, i) => `
        <div class="yt-row">
          <span class="yt-row-label">${r.label}${r.size}</span>
          <button class="yt-download" data-row="${i}" ${r.ready ? "" : "disabled"}>
            ${r.ready ? "Download" : "Locked"}
          </button>
        </div>
        ${r.hint ? `<div class="yt-row-hint">${r.hint}</div>` : ""}
      `,
        )
        .join("")}
    </div>
  `;
}

function videoDownloaderHref(tabUrl) {
  return `${chrome.runtime.getURL("pages/video-downloader/video-downloader.html")}?url=${encodeURIComponent(tabUrl)}`;
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const match = tab?.url ? detectSupportedUrl(tab.url) : null;

  if (!match) {
    // No comment-picker platform detected, but the video and thumbnail
    // downloaders work on any page (Reddit/Vimeo/direct links/webpage
    // extractor all handled by our own backend) -- always offer them
    // rather than a dead end.
    render(`
      <div class="empty">
        Open a supported YouTube, Reddit or Instagram page to pick comments.
      </div>
      ${
        tab?.url
          ? `<button class="primary" id="video-dl-any">Download Video</button>
             <button class="secondary" id="thumb-dl-any">Get Thumbnail</button>`
          : ""
      }
    `);
    if (tab?.url) {
      document.getElementById("video-dl-any").addEventListener("click", () => {
        chrome.tabs.create({ url: videoDownloaderHref(tab.url) });
      });
      document.getElementById("thumb-dl-any").addEventListener("click", () => {
        chrome.tabs.create({ url: thumbnailDownloaderHref(tab.url) });
      });
    }
    return;
  }

  const actions = buildActions(match, tab.url);
  // YouTube has its own dedicated in-popup capture flow below (the only
  // platform our backend can't resolve server-side) -- the generic page
  // would just show "not supported" for it, so only offer it elsewhere.
  // chrome.runtime.getURL(...) points at the extension's own bundled page --
  // chrome.tabs.create below opens it like any other action either way.
  if (match.platform !== "youtube") {
    actions.push({ label: "Download Video", href: videoDownloaderHref(tab.url) });
  }
  let youtubeSection = "";
  let rowsForBinding = [];

  if (match.platform === "youtube") {
    const state = await chrome.runtime.sendMessage({ type: "GET_STATE" });
    rowsForBinding = state?.meta ? buildYoutubeRows(state) : [];
    youtubeSection = `<div class="yt-section">${renderYoutubeDownload(state || {})}</div>`;
  }

  render(`
    <div class="resource">
      <span class="platform-tag">${PLATFORM_LABEL[match.platform]} detected</span>
      <span class="resource-id">${match.resourceId}</span>
    </div>
    ${actions
      .map(
        (action, i) =>
          `<button class="${action.primary ? "primary" : "secondary"}" data-action="${i}">${action.label}</button>`
      )
      .join("")}
    ${youtubeSection}
  `);

  actions.forEach((action, i) => {
    document.querySelector(`[data-action="${i}"]`).addEventListener("click", () => {
      chrome.tabs.create({ url: action.href });
    });
  });

  document.querySelectorAll(".yt-download").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = rowsForBinding[Number(btn.dataset.row)];
      row?.onDownload?.();
    });
  });
}

init();
