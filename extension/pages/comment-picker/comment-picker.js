// Extension page (not the popup, not a website tab) -- runs the same
// comment-picker draw as the website's /y /r /i routes, natively. Calls
// MySocial's own backend (/api/*/comments, /api/*/video|post|media,
// /api/draw) directly; nothing here navigates to the website.

function showNotice(message) {
  const el = document.getElementById("notice");
  el.textContent = message;
  el.hidden = !message;
}

function showProgress(label) {
  let el = document.getElementById("progress");
  if (!label) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "progress";
    el.className = "progress";
    document.getElementById("resource").after(el);
  }
  el.textContent = label;
}

async function apiFetch(path, init) {
  const res = await fetch(`${MYSOCIAL_APP_URL}${path}`, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || `Request failed (${res.status}).`);
  return body;
}

/** One adapter per platform: how to fetch the source resource and every comment. */
const ADAPTERS = {
  youtube: {
    fetchResource: (id) => apiFetch(`/api/youtube/video?videoId=${encodeURIComponent(id)}`),
    fetchComments: async (id, onProgress) => {
      let all = [];
      let pageToken;
      let pages = 0;
      do {
        const page = await apiFetch(
          `/api/youtube/comments?videoId=${encodeURIComponent(id)}${pageToken ? `&pageToken=${pageToken}` : ""}&runningTotal=${all.length}`,
        );
        all = all.concat(page.comments);
        pages += 1;
        onProgress(`Fetching comments - page ${pages} (${all.length} so far)`);
        pageToken = page.nextPageToken ?? undefined;
      } while (pageToken);
      return all;
    },
  },
  reddit: {
    fetchResource: (id) => apiFetch(`/api/reddit/post?postId=${encodeURIComponent(id)}`),
    fetchComments: async (id, onProgress) => {
      onProgress("Fetching comments…");
      const page = await apiFetch(`/api/reddit/comments?postId=${encodeURIComponent(id)}`);
      return page.comments;
    },
  },
  instagram: {
    fetchResource: (id) => apiFetch(`/api/instagram/media?mediaId=${encodeURIComponent(id)}`),
    fetchComments: async (id, onProgress) => {
      onProgress("Fetching comments…");
      const page = await apiFetch(`/api/instagram/comments?mediaId=${encodeURIComponent(id)}`);
      return page.comments;
    },
  },
};

let state = { platform: null, resourceId: null, resource: null, comments: [] };

function renderResource(resource) {
  document.getElementById("resource").innerHTML = `
    <div class="resource-card">
      ${resource.thumbnailUrl ? `<img src="${resource.thumbnailUrl}" alt="" />` : ""}
      <div>
        <div class="resource-title">${resource.title || resource.id}</div>
        <div class="resource-meta">${resource.authorName ? `${resource.authorName} · ` : ""}${resource.commentCount ?? "?"} comments</div>
      </div>
    </div>
  `;
}

function renderWinners(winners, token) {
  const container = document.getElementById("result");
  container.innerHTML =
    winners
      .map(
        (w) => `
      <div class="winner-card">
        ${w.authorAvatarUrl ? `<img src="${w.authorAvatarUrl}" alt="" />` : ""}
        <div>
          <div class="winner-name">${w.authorName || w.authorUsername || "Anonymous"}</div>
          <div class="winner-text">${(w.text || "").slice(0, 500)}</div>
        </div>
      </div>
    `,
      )
      .join("") +
    (token
      ? `<a class="verify-link" href="${MYSOCIAL_APP_URL}/draw/${token}" target="_blank" rel="noreferrer">View signed verification page →</a>`
      : "");
}

async function pickWinner(e) {
  e.preventDefault();
  const btn = document.getElementById("pick-btn");
  btn.disabled = true;
  btn.textContent = "Picking…";
  showNotice("");

  try {
    const filters = {
      onePerPerson: document.getElementById("one-per-person").checked,
      replyMode: document.getElementById("exclude-replies").checked ? "exclude" : "include",
      excludeLinks: document.getElementById("exclude-links").checked,
      keyword: document.getElementById("keyword").value.trim() || undefined,
    };
    const winnerCount = Math.max(1, Number(document.getElementById("winner-count").value) || 1);

    const result = await apiFetch("/api/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: state.platform,
        sourceId: state.resourceId,
        sourceUrl: state.resource.url,
        sourceTitle: state.resource.title,
        comments: state.comments,
        filters,
        winnerCount,
        previousWinners: [],
      }),
    });

    renderWinners(result.record.winners, result.token);
  } catch (err) {
    showNotice(err instanceof Error ? err.message : "Couldn't run that draw.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Pick Winner";
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get("url");
  const match = url ? detectSupportedUrl(url) : null;

  if (!match || !ADAPTERS[match.platform]) {
    showNotice("Open this from a supported YouTube, Reddit or Instagram page.");
    return;
  }

  state.platform = match.platform;
  state.resourceId = match.resourceId;
  const adapter = ADAPTERS[match.platform];

  try {
    showProgress("Loading post info…");
    state.resource = await adapter.fetchResource(match.resourceId);
    renderResource(state.resource);

    state.comments = await adapter.fetchComments(match.resourceId, showProgress);
    showProgress("");

    if (state.comments.length === 0) {
      showNotice("This post has no comments to pick from.");
      return;
    }

    document.getElementById("filters-form").hidden = false;
    document.getElementById("filters-form").addEventListener("submit", pickWinner);
  } catch (err) {
    showProgress("");
    showNotice(err instanceof Error ? err.message : "Couldn't load comments for this post.");
  }
}

init();
