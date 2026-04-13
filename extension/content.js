// CrateSync Chrome Extension - Content Script
// Runs on Bandcamp pages to interact with wishlist/cart buttons

const LOG_PREFIX = "[CrateSync CS]";
const STATE_CHANGE_TIMEOUT_MS = 5000;

console.log(LOG_PREFIX, "Content script loaded on", window.location.href);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((err) => {
      console.error(LOG_PREFIX, "Error handling message:", err);
      sendResponse({ success: false, error: err.message || "Unknown error" });
    });

  // Return true to keep the message channel open for async response
  return true;
});

async function handleMessage(message) {
  try {
    console.log(LOG_PREFIX, "Received message:", message);

    if (!message || !message.action) {
      return { success: false, error: "Invalid message: missing action" };
    }

    switch (message.action) {
      case "wishlist":
        return await handleWishlist();

      case "cart":
        return await handleCart();

      default:
        return { success: false, error: `Unknown action: ${message.action}` };
    }
  } catch (err) {
    console.error(LOG_PREFIX, "Unhandled error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

// --- Wishlist ---

async function handleWishlist() {
  console.log(LOG_PREFIX, "Handling wishlist action");

  // Check if already wishlisted
  const wishlistedEl = document.querySelector(".wishlisted");
  if (wishlistedEl) {
    console.log(LOG_PREFIX, "Already wishlisted");
    return { success: true, alreadyWishlisted: true };
  }

  // Also check by text content
  const allButtons = document.querySelectorAll("button, a, span");
  for (const el of allButtons) {
    const text = (el.textContent || "").trim();
    if (text === "In Wishlist" || text === "In Collection") {
      console.log(LOG_PREFIX, "Already in wishlist/collection");
      return { success: true, alreadyWishlisted: true };
    }
  }

  // Find the wishlist button using fallback selectors
  const wishlistSelectors = [
    "button.collect-item-container",
    ".collect-item",
    'a[href*="wishlist"]',
  ];

  let button = null;

  for (const selector of wishlistSelectors) {
    button = document.querySelector(selector);
    if (button) {
      console.log(LOG_PREFIX, `Found wishlist button with selector: ${selector}`);
      break;
    }
  }

  // Fallback: find by text content
  if (!button) {
    for (const el of allButtons) {
      const text = (el.textContent || "").trim().toLowerCase();
      if (text.includes("wishlist") || text.includes("collect")) {
        button = el;
        console.log(LOG_PREFIX, "Found wishlist button by text content");
        break;
      }
    }
  }

  if (!button) {
    return { success: false, error: "Wishlist button not found on page" };
  }

  // Click the button
  button.click();
  console.log(LOG_PREFIX, "Clicked wishlist button");

  // Wait for state change
  try {
    await waitForStateChange(button);
    console.log(LOG_PREFIX, "Wishlist state changed successfully");
    return { success: true };
  } catch (err) {
    // Check if it was actually added despite timeout
    if (document.querySelector(".wishlisted")) {
      return { success: true };
    }
    return { success: false, error: "Timed out waiting for wishlist state change" };
  }
}

// --- Cart ---

async function handleCart() {
  console.log(LOG_PREFIX, "Handling cart action");

  // Find the buy button using fallback selectors
  const buySelectors = [
    ".buyItem",
    ".buy-link",
    'button[class*="buy"]',
  ];

  let button = null;

  for (const selector of buySelectors) {
    button = document.querySelector(selector);
    if (button) {
      console.log(LOG_PREFIX, `Found buy button with selector: ${selector}`);
      break;
    }
  }

  // Fallback: find by text content
  if (!button) {
    const allElements = document.querySelectorAll("button, a, span, h3, h4");
    for (const el of allElements) {
      const text = (el.textContent || "").trim().toLowerCase();
      if (text.includes("buy digital") || text.includes("buy now")) {
        button = el;
        console.log(LOG_PREFIX, "Found buy button by text content");
        break;
      }
    }
  }

  if (!button) {
    return { success: false, error: "Buy button not found on page" };
  }

  // Click the buy button
  button.click();
  console.log(LOG_PREFIX, "Clicked buy button");

  // Wait a moment for the dialog to appear
  await sleep(1000);

  // Handle price/format dialog if it appears
  try {
    await handleBuyDialog();
  } catch (err) {
    console.warn(LOG_PREFIX, "Buy dialog handling:", err.message);
    // Non-fatal - the click may have been enough
  }

  return { success: true };
}

async function handleBuyDialog() {
  // Look for the format/price dialog
  const dialog =
    document.querySelector(".checkout-dialog") ||
    document.querySelector(".buy-dialog") ||
    document.querySelector('[class*="buy"][class*="dialog"]');

  if (!dialog) {
    console.log(LOG_PREFIX, "No buy dialog detected, assuming direct add");
    return;
  }

  console.log(LOG_PREFIX, "Buy dialog detected");

  // Select the first digital option
  const digitalOptions = dialog.querySelectorAll(
    'input[type="radio"], .format-option, [class*="digital"]'
  );

  if (digitalOptions.length > 0) {
    digitalOptions[0].click();
    console.log(LOG_PREFIX, "Selected first format option");
    await sleep(300);
  }

  // Click "Add to Cart" or similar
  const cartButtonSelectors = [
    'button[class*="cart"]',
    'a[class*="cart"]',
    'button[class*="add"]',
  ];

  for (const selector of cartButtonSelectors) {
    const cartBtn = dialog.querySelector(selector) || document.querySelector(selector);
    if (cartBtn) {
      const text = (cartBtn.textContent || "").trim().toLowerCase();
      if (text.includes("cart") || text.includes("add") || text.includes("buy")) {
        cartBtn.click();
        console.log(LOG_PREFIX, "Clicked add to cart button");
        return;
      }
    }
  }

  // Fallback: look for any button with relevant text in the dialog
  const buttons = dialog.querySelectorAll("button, a");
  for (const btn of buttons) {
    const text = (btn.textContent || "").trim().toLowerCase();
    if (text.includes("add to cart") || text.includes("checkout")) {
      btn.click();
      console.log(LOG_PREFIX, "Clicked cart button by text");
      return;
    }
  }

  console.log(LOG_PREFIX, "No add-to-cart button found in dialog");
}

// --- Utilities ---

function waitForStateChange(element) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error("State change timed out"));
    }, STATE_CHANGE_TIMEOUT_MS);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check for class changes (e.g., adding "wishlisted")
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const target = mutation.target;
          if (
            target.classList.contains("wishlisted") ||
            target.classList.contains("collected")
          ) {
            clearTimeout(timeout);
            observer.disconnect();
            resolve();
            return;
          }
        }

        // Check for text content changes
        if (mutation.type === "childList" || mutation.type === "characterData") {
          const text = (element.textContent || "").trim();
          if (text.includes("In Wishlist") || text.includes("In Collection")) {
            clearTimeout(timeout);
            observer.disconnect();
            resolve();
            return;
          }
        }
      }
    });

    // Observe the button and its parent for changes
    const observeTarget = element.parentElement || element;
    observer.observe(observeTarget, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
