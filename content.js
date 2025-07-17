
/**
 * Detects if the current web page is built with the Lovable framework.
 * It checks for specific meta tags within the page's HTML.
 * @returns {string|null} The name of the detected framework (e.g., "Lovable") or null if not detected.
 */
function detectFramework() {
  // 1. Detect Lovable via keywords meta tag
  // This looks for a meta tag with the name "keywords" and content containing "lovable"
  const lovableKeywords = document.querySelector('meta[name="keywords"][content*="lovable"]');
  if (lovableKeywords) {
    console.log("Lovable detected via meta tag!"); // Log detection for debugging
    return "Lovable";
  }
  
  console.log("No known framework detected."); // Log if no framework is detected
  return null;
}

// Execute the detection function when the script runs
const framework = detectFramework();

// Send a message to the background script based on the detection result
if (framework) {
  console.log(`Sending message: Detected ${framework}`); // Log message sent
  chrome.runtime.sendMessage({ detected: true, framework: framework });
} else {
  console.log("Sending message: No framework detected"); // Log message sent
  chrome.runtime.sendMessage({ detected: false });
}
