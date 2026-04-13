// CrateSync Chrome Extension - Popup Script

const CRATESYNC_URL = "http://localhost:3000";
const CRATESYNC_PROD_URL = "https://cratesync.com";

document.addEventListener("DOMContentLoaded", () => {
  try {
    const openBtn = document.getElementById("openBtn");

    openBtn.addEventListener("click", () => {
      try {
        // Try production URL first, fall back to localhost
        chrome.tabs.create({ url: CRATESYNC_URL });
        window.close();
      } catch (err) {
        console.error("[CrateSync Popup]", "Error opening tab:", err);
      }
    });

    // Display version from manifest
    const manifest = chrome.runtime.getManifest();
    const versionEl = document.getElementById("version");
    if (manifest && manifest.version) {
      versionEl.textContent = `v${manifest.version}`;
    }
  } catch (err) {
    console.error("[CrateSync Popup]", "Init error:", err);
  }
});
