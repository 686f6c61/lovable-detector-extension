const STORAGE_KEYS = {
  DETECTIONS_BY_TAB: "detectionsByTab",
  DETECTION_HISTORY: "detectionHistory",
  TOTAL_DETECTIONS: "totalDetections"
};

const DEFAULT_ICON = {
  16: "images/icon16.png",
  48: "images/icon48.png",
  128: "images/icon128.png"
};

const DETECTED_ICON = {
  16: "images/icon-detected16.png",
  48: "images/icon-detected48.png",
  128: "images/icon-detected128.png"
};

function setTabIcon(tabId, detected) {
  chrome.action.setIcon(
    {
      tabId,
      path: detected ? DETECTED_ICON : DEFAULT_ICON
    },
    () => {
      if (chrome.runtime.lastError) {
        console.debug("[Te Pille] setIcon error:", chrome.runtime.lastError.message);
      }
    }
  );
}

function sanitizeDetectionPayload(request, tabUrl) {
  const score = Number.isFinite(request.score) ? request.score : 0;
  const confidence = Number.isFinite(request.confidence) ? request.confidence : 0;
  const signals = Array.isArray(request.signals) ? request.signals.slice(0, 20) : [];
  const framework = request.detected ? (request.framework || "Lovable") : null;

  return {
    detectedFramework: framework,
    detectedAt: Number.isFinite(request.checkedAt) ? request.checkedAt : Date.now(),
    url: tabUrl || "unknown",
    score,
    confidence: Math.max(0, Math.min(99, confidence)),
    signals
  };
}

function incrementTotalDetections() {
  chrome.storage.local.get({ [STORAGE_KEYS.TOTAL_DETECTIONS]: 0 }, (data) => {
    const current = data[STORAGE_KEYS.TOTAL_DETECTIONS] || 0;
    chrome.storage.local.set({ [STORAGE_KEYS.TOTAL_DETECTIONS]: current + 1 });
  });
}

function upsertHistoryEntry(entry) {
  chrome.storage.local.get({ [STORAGE_KEYS.DETECTION_HISTORY]: [] }, (data) => {
    const history = data[STORAGE_KEYS.DETECTION_HISTORY] || [];
    const nextEntry = {
      framework: entry.detectedFramework,
      url: entry.url,
      timestamp: entry.detectedAt,
      score: entry.score,
      confidence: entry.confidence
    };

    const index = history.findIndex((item) => item.url === nextEntry.url);
    if (index >= 0) {
      history[index] = nextEntry;
    } else {
      history.push(nextEntry);
    }

    chrome.storage.local.set({
      [STORAGE_KEYS.DETECTION_HISTORY]: history.slice(-100)
    });
  });
}

function clearDetectionForTab(tabId) {
  chrome.storage.local.get({ [STORAGE_KEYS.DETECTIONS_BY_TAB]: {} }, (data) => {
    const detectionsByTab = data[STORAGE_KEYS.DETECTIONS_BY_TAB] || {};
    if (!(String(tabId) in detectionsByTab)) {
      return;
    }

    delete detectionsByTab[String(tabId)];
    chrome.storage.local.set({ [STORAGE_KEYS.DETECTIONS_BY_TAB]: detectionsByTab });
  });
}

function migrateLegacyKeys() {
  chrome.storage.local.remove(["detectedFramework", "detectedAt", "url"]);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== "LOVABLE_DETECTION") {
    return false;
  }

  if (!sender.tab || typeof sender.tab.id !== "number") {
    sendResponse({ ok: false, error: "invalid_sender" });
    return false;
  }

  const tabId = sender.tab.id;
  const tabUrl = sender.tab.url || "";
  const detectionEntry = sanitizeDetectionPayload(request, tabUrl);

  chrome.storage.local.get({ [STORAGE_KEYS.DETECTIONS_BY_TAB]: {} }, (data) => {
    const detectionsByTab = data[STORAGE_KEYS.DETECTIONS_BY_TAB] || {};
    const previousEntry = detectionsByTab[String(tabId)] || null;
    detectionsByTab[String(tabId)] = detectionEntry;

    chrome.storage.local.set({ [STORAGE_KEYS.DETECTIONS_BY_TAB]: detectionsByTab }, () => {
      if (chrome.runtime.lastError) {
        console.error("[Te Pille] Error saving tab detection:", chrome.runtime.lastError.message);
      }
    });

    const wasDetected = Boolean(previousEntry && previousEntry.detectedFramework);
    const isDetected = Boolean(detectionEntry.detectedFramework);
    if (!wasDetected && isDetected) {
      incrementTotalDetections();
    }

    if (isDetected) {
      upsertHistoryEntry(detectionEntry);
    }
  });

  setTabIcon(tabId, Boolean(detectionEntry.detectedFramework));
  sendResponse({ ok: true });
  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "loading") {
    return;
  }

  clearDetectionForTab(tabId);
  setTabIcon(tabId, false);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearDetectionForTab(tabId);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    {
      [STORAGE_KEYS.DETECTIONS_BY_TAB]: {},
      [STORAGE_KEYS.DETECTION_HISTORY]: [],
      [STORAGE_KEYS.TOTAL_DETECTIONS]: 0
    },
    (data) => {
      chrome.storage.local.set({
        [STORAGE_KEYS.DETECTIONS_BY_TAB]: data[STORAGE_KEYS.DETECTIONS_BY_TAB] || {},
        [STORAGE_KEYS.DETECTION_HISTORY]: data[STORAGE_KEYS.DETECTION_HISTORY] || [],
        [STORAGE_KEYS.TOTAL_DETECTIONS]: data[STORAGE_KEYS.TOTAL_DETECTIONS] || 0
      });
    }
  );

  migrateLegacyKeys();
});

migrateLegacyKeys();
