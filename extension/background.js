// CrateSync Chrome Extension - Service Worker
// Handles messages from the web app to add tracks to Bandcamp wishlist/cart

const LOG_PREFIX = "[CrateSync BG]";
const TAB_TIMEOUT_MS = 10000;

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    handleExternalMessage(message)
      .then((response) => sendResponse(response))
      .catch((err) => {
        console.error(LOG_PREFIX, "Unhandled error:", err);
        sendResponse({ success: false, error: err.message || "Unknown error" });
      });

    // Return true to keep the message channel open for async response
    return true;
  }
);

async function handleExternalMessage(message) {
  try {
    if (!message || !message.type) {
      return { success: false, error: "Invalid message: missing type" };
    }

    console.log(LOG_PREFIX, "Received message:", message.type);

    switch (message.type) {
      case "CRATESYNC_PING":
        return { installed: true, version: "1.0.0" };

      case "CRATESYNC_ADD":
        return await handleAdd(message);

      default:
        return { success: false, error: `Unknown message type: ${message.type}` };
    }
  } catch (err) {
    console.error(LOG_PREFIX, "Error handling message:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

async function handleAdd(message) {
  const { action, url, trackName } = message;

  if (!url) {
    return { success: false, error: "Missing URL" };
  }

  if (!action) {
    return { success: false, error: "Missing action" };
  }

  console.log(LOG_PREFIX, `Adding track: "${trackName}" via ${action} at ${url}`);

  let tab = null;

  try {
    // 1. Create a new tab with the Bandcamp URL
    tab = await chrome.tabs.create({ url, active: false });
    console.log(LOG_PREFIX, `Created tab ${tab.id}`);

    // 2. Wait for the tab to finish loading
    await waitForTabLoad(tab.id);
    console.log(LOG_PREFIX, `Tab ${tab.id} loaded`);

    // 3. Send message to content script and wait for response
    const result = await sendMessageToTab(tab.id, {
      action,
      trackName: trackName || "",
    });
    console.log(LOG_PREFIX, `Content script response:`, result);

    return result;
  } catch (err) {
    console.error(LOG_PREFIX, `Error during add:`, err);
    return { success: false, error: err.message || "Failed to add track" };
  } finally {
    // 5. Always close the tab
    if (tab && tab.id) {
      try {
        await chrome.tabs.remove(tab.id);
        console.log(LOG_PREFIX, `Closed tab ${tab.id}`);
      } catch (closeErr) {
        console.warn(LOG_PREFIX, `Failed to close tab ${tab.id}:`, closeErr);
      }
    }
  }
}

function waitForTabLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Tab load timed out"));
    }, TAB_TIMEOUT_MS);

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Content script response timed out"));
    }, TAB_TIMEOUT_MS);

    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error("No response from content script"));
          return;
        }

        resolve(response);
      });
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}
