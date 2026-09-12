// Isolated-world content script: relays what content/inject.js (running in
// the page's own JS context) observes about to the background service
// worker, which needs chrome.* APIs inject.js can't reach directly.

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== "mysocial-yt" || event.data.type !== "player-response") return;

  chrome.runtime.sendMessage({
    type: "PLAYER_RESPONSE",
    data: event.data.data,
  });
});
