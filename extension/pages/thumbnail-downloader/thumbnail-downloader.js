// Extension page (not the popup, not a website tab) -- downloads the
// thumbnail for any platform's video/post, native to the extension.
// YouTube uses the dedicated multi-size endpoint (matches the website's own
// Thumbnail Downloader); every other platform reuses the thumbnailUrl
// already returned by /api/video-download/info -- one size, but real.

function showNotice(message) {
  const el = document.getElementById("notice");
  el.textContent = message;
  el.hidden = !message;
}

function sanitize(name) {
  return (name || "thumbnail").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120);
}

function renderThumbnails(title, options) {
  const container = document.getElementById("result");
  container.innerHTML = options
    .map(
      (o, i) => `
      <div class="thumb-card">
        <img src="${o.url}" alt="" />
        <div class="thumb-card-footer">
          <span>
            <span class="thumb-card-label">${o.label}</span>
            ${o.width ? `<span class="thumb-card-dims">${o.width}×${o.height}</span>` : ""}
          </span>
          <button class="format-download" data-i="${i}">Download</button>
        </div>
      </div>
    `,
    )
    .join("");

  container.querySelectorAll(".format-download").forEach((btn) => {
    btn.addEventListener("click", () => {
      const o = options[Number(btn.dataset.i)];
      const ext = o.url.split("?")[0].split(".").pop()?.toLowerCase();
      const filename = `${sanitize(title)}-${o.label.replace(/\s+/g, "-")}.${["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg"}`;
      chrome.downloads.download({ url: o.url, filename });
    });
  });
}

async function findThumbnail(raw) {
  showNotice("");
  document.getElementById("result").innerHTML = "";
  const btn = document.getElementById("check-btn");
  btn.disabled = true;
  btn.textContent = "Checking…";

  try {
    const { platform, resourceId } = await detectVideoPlatform(raw);

    if (platform === "youtube") {
      const res = await fetch(`${MYSOCIAL_APP_URL}/api/youtube/thumbnails?videoId=${encodeURIComponent(resourceId)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message || body?.message || "Couldn't fetch thumbnails.");
      renderThumbnails(
        body.title,
        body.thumbnails.map((t) => ({ label: t.label, url: t.url, width: t.width, height: t.height })),
      );
      return;
    }

    const res = await fetch(
      `${MYSOCIAL_APP_URL}/api/video-download/info?platform=${encodeURIComponent(platform)}&resourceId=${encodeURIComponent(resourceId)}`,
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || body?.message || "Couldn't fetch that page.");
    if (!body.thumbnailUrl) throw new Error("No thumbnail was found for this URL.");
    renderThumbnails(body.title, [{ label: "Thumbnail", url: body.thumbnailUrl }]);
  } catch (err) {
    showNotice(err instanceof Error ? err.message : "Something went wrong.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Find Thumbnail";
  }
}

document.getElementById("url-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = document.getElementById("url-input").value.trim();
  if (raw) findThumbnail(raw);
});

const params = new URLSearchParams(window.location.search);
const prefill = params.get("url");
if (prefill) {
  document.getElementById("url-input").value = prefill;
  findThumbnail(prefill);
}
