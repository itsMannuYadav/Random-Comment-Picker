const PLATFORM_LABEL = { youtube: "YouTube", reddit: "Reddit", instagram: "Instagram" };

function render(html) {
  document.getElementById("content").innerHTML = html;
}

/** Every action is a real, working MySocial destination — never a dead button. */
function buildActions(match, tabUrl) {
  const actions = [
    {
      label: "Pick with MySocial",
      href: `${MYSOCIAL_APP_URL}/${match.prefix}/${match.resourceId}`,
      primary: true,
    },
  ];

  if (match.platform === "youtube") {
    actions.push({
      label: "Get Thumbnail",
      href: `${MYSOCIAL_APP_URL}/tools/thumbnail-downloader?url=${encodeURIComponent(tabUrl)}`,
    });
  }

  actions.push({
    label: "Analyze",
    href: `${MYSOCIAL_APP_URL}/tools/url-analyzer?url=${encodeURIComponent(tabUrl)}`,
  });

  return actions;
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const match = tab?.url ? detectSupportedUrl(tab.url) : null;

  if (!match) {
    render(`
      <div class="empty">
        Open a supported YouTube, Reddit or Instagram page to use MySocial.
      </div>
    `);
    return;
  }

  const actions = buildActions(match, tab.url);

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
  `);

  actions.forEach((action, i) => {
    document.querySelector(`[data-action="${i}"]`).addEventListener("click", () => {
      chrome.tabs.create({ url: action.href });
    });
  });
}

init();
