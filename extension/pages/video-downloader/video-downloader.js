// Extension page (not the popup, not a website tab) for downloading video
// from any platform the website's own Video Downloader supports (Reddit,
// Vimeo, Instagram, direct links, and the webpage extractor for everything
// else) -- YouTube is handled separately by the popup's live-capture flow
// (see background/background.js), since it needs the real player's own
// requests, not a resolved-URL response from our backend.
//
// This calls MySocial's own backend (/api/platform/detect,
// /api/video-download/info, /api/video-download/file) directly -- a
// background fetch to our own API, never a navigation to the website.

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!n) return "";
  return n < 1024 * 1024 ? ` · ${(n / 1024).toFixed(0)} KB` : ` · ${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function apiFetch(path, init) {
  const res = await fetch(`${MYSOCIAL_APP_URL}${path}`, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || `Request failed (${res.status}).`);
  return body;
}

function showNotice(message) {
  const el = document.getElementById("notice");
  el.textContent = message;
  el.hidden = !message;
}

function renderInfo(info) {
  const container = document.getElementById("result");
  const videoFormats = info.formats.filter((f) => f.kind === "video");
  const audioFormats = info.formats.filter((f) => f.kind === "audio");

  container.innerHTML = `
    <div class="video-header">
      ${info.thumbnailUrl ? `<img src="${info.thumbnailUrl}" alt="" />` : ""}
      <div>
        <p class="video-title">${info.title || info.resourceId}</p>
        <p class="video-meta">${info.creatorName ? `${info.creatorName} · ` : ""}${info.platform}</p>
      </div>
    </div>

    ${videoFormats.length ? `<div class="format-group-label">Video</div>${videoFormats.map(formatRow).join("")}` : ""}
    ${audioFormats.length ? `<div class="format-group-label">Audio only</div>${audioFormats.map(formatRow).join("")}` : ""}
  `;

  container.querySelectorAll(".format-download").forEach((btn) => {
    btn.addEventListener("click", () => downloadFormat(btn.dataset.id, info));
  });
}

function formatRow(f) {
  return `
    <div class="format-row" data-row-id="${f.id}">
      <span class="format-row-label">${f.label}<span class="format-row-size">${formatBytes(f.sizeBytes)}</span></span>
      <button class="format-download" data-id="${f.id}">Download</button>
    </div>
  `;
}

function setRowStatus(id, text, disabled) {
  const row = document.querySelector(`[data-row-id="${id}"]`);
  if (!row) return;
  const btn = row.querySelector(".format-download");
  let status = row.querySelector(".format-status");
  if (text) {
    if (!status) {
      status = document.createElement("span");
      status.className = "format-status";
      row.appendChild(status);
    }
    status.textContent = text;
  } else if (status) {
    status.remove();
  }
  if (btn) btn.disabled = Boolean(disabled);
}

async function downloadFormat(id, info) {
  const format = info.formats.find((f) => f.id === id);
  if (!format) return;

  setRowStatus(id, format.delivery === "mux" ? "Combining…" : "Starting…", true);
  try {
    const filename = `${(info.title || info.resourceId).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120)}-${format.label.replace(/\s+/g, "-")}.mp4`;
    const result = await chrome.runtime.sendMessage({
      type: "DOWNLOAD_GENERIC",
      videoUrl: format.url,
      audioUrl: format.delivery === "mux" ? format.audioUrl : undefined,
      filename,
      skipProxy: format.skipProxy,
    });
    if (!result?.ok) throw new Error(result?.error || "Download failed.");
    setRowStatus(id, "Done", false);
  } catch (err) {
    setRowStatus(id, err instanceof Error ? err.message : "Download failed.", false);
  }
}

async function checkVideo(raw) {
  showNotice("");
  document.getElementById("result").innerHTML = "";
  const btn = document.getElementById("check-btn");
  btn.disabled = true;
  btn.textContent = "Checking…";

  try {
    const { platform, resourceId } = await detectVideoPlatform(raw);
    const info = await apiFetch(
      `/api/video-download/info?platform=${encodeURIComponent(platform)}&resourceId=${encodeURIComponent(resourceId)}`,
    );
    renderInfo(info);
  } catch (err) {
    showNotice(err instanceof Error ? err.message : "Something went wrong checking that URL.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Check Video";
  }
}

document.getElementById("url-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = document.getElementById("url-input").value.trim();
  if (raw) checkVideo(raw);
});

// Pre-fill from ?url= (the popup links here with the current tab's URL).
const params = new URLSearchParams(window.location.search);
const prefill = params.get("url");
if (prefill) {
  document.getElementById("url-input").value = prefill;
  checkVideo(prefill);
}
