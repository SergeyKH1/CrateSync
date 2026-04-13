// CrateSync Chrome Extension - Service Worker
// Handles messages from the web app to add tracks to Bandcamp wishlist/cart

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // Placeholder - will be implemented by extension agent
    sendResponse({ success: false, error: "Not yet implemented" });
  }
);
