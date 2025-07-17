
/**
 * Listens for messages from the content script (content.js).
 * This background script handles actions based on detected frameworks,
 * such as setting the extension icon and storing detection status.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if a framework was detected by the content script
  if (request.detected) {
    // Store the detected framework in local storage
    chrome.storage.local.set({ detectedFramework: request.framework });

    // Set the extension icon to the 'detected' version
    chrome.action.setIcon({
      path: {
        "16": "images/icon-detected16.png", // 16x16 pixel icon
        "48": "images/icon-detected48.png", // 48x48 pixel icon
        "128": "images/icon-detected128.png" // 128x128 pixel icon
      },
      tabId: sender.tab.id // Apply icon to the tab where detection occurred
    });
  } else {
    // If no framework was detected, remove any stored detection status
    chrome.storage.local.remove("detectedFramework");
    // Set the extension icon back to the default version
    chrome.action.setIcon({
      path: {
        "16": "images/icon16.png", // Default 16x16 pixel icon
        "48": "images/icon48.png", // Default 48x48 pixel icon
        "128": "images/icon128.png" // Default 128x128 pixel icon
      },
      tabId: sender.tab.id // Apply icon to the tab where detection occurred
    });
  }
});
