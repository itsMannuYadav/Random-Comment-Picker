const PLATFORM_LABEL = { youtube: "YouTube", reddit: "Reddit" };

function render(html) {
  document.getElementById("content").innerHTML = html;
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const match = tab?.url ? detectSupportedUrl(tab.url) : null;

  if (!match) {
    render(`
      <div class="empty">
        Open a supported YouTube video or Reddit post to pick a winner with MyCP.
      </div>
    `);
    return;
  }

  render(`
    <div class="resource">
      <span class="platform-tag">${PLATFORM_LABEL[match.platform]} detected</span>
      <span class="resource-id">${match.resourceId}</span>
    </div>
    <button class="primary" id="open-btn">Open in MyCP</button>
  `);

  document.getElementById("open-btn").addEventListener("click", () => {
    const url = `${MYCP_APP_URL}/${match.prefix}/${match.resourceId}`;
    chrome.tabs.create({ url });
  });
}

init();
