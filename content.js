const FRAMEWORK_NAME = "Lovable";
const DETECTION_THRESHOLD = 5;
const RELEVANT_ATTRIBUTES = new Set([
  "id",
  "class",
  "src",
  "href",
  "content",
  "data-proxy-url",
  "aria-label"
]);

const SIGNAL_DEFINITIONS = [
  {
    id: "lovable-subdomain",
    label: "Host .lovable.app",
    weight: 5,
    strong: true,
    test: () => location.hostname.toLowerCase().endsWith(".lovable.app")
  },
  {
    id: "flock-script",
    label: "Script ~flock.js",
    weight: 5,
    strong: true,
    test: () => Boolean(
      document.querySelector('script[src*="/~flock.js" i], script[src*=".lovable.app/~flock.js" i]')
    )
  },
  {
    id: "analytics-proxy",
    label: "Proxy analytics lovable",
    weight: 4,
    strong: true,
    test: () => Boolean(
      document.querySelector(
        'script[data-proxy-url*="/~api/analytics" i], script[data-proxy-url*=".lovable.app/~api/analytics" i]'
      )
    )
  },
  {
    id: "badge-root",
    label: "Elemento #lovable-badge",
    weight: 4,
    strong: true,
    test: () => Boolean(document.getElementById("lovable-badge"))
  },
  {
    id: "badge-project-link",
    label: "Link a lovable.dev/projects",
    weight: 4,
    strong: true,
    test: () => Boolean(
      document.querySelector('a[href*="lovable.dev/projects" i], [aria-label*="Edit with Lovable" i]')
    )
  },
  {
    id: "meta-author",
    label: "Meta author Lovable",
    weight: 2,
    strong: false,
    test: () => Boolean(document.querySelector('meta[name="author" i][content*="lovable" i]'))
  },
  {
    id: "meta-description-generated",
    label: "Meta Lovable Generated Project",
    weight: 2,
    strong: false,
    test: () => Boolean(
      document.querySelector('meta[name="description" i][content*="Lovable Generated Project" i]')
    )
  },
  {
    id: "twitter-site-lovable",
    label: "Twitter site lovable",
    weight: 2,
    strong: false,
    test: () => Boolean(document.querySelector('meta[name="twitter:site" i][content*="lovable" i]'))
  },
  {
    id: "lovable-resource-domain",
    label: "Recurso desde .lovable.app",
    weight: 3,
    strong: false,
    test: () => Boolean(document.querySelector('[src*=".lovable.app" i], [href*=".lovable.app" i]'))
  },
  {
    id: "badge-selectors",
    label: "Selectores de badge",
    weight: 3,
    strong: false,
    test: () => Boolean(document.querySelector('#lovable-badge-cta, #lovable-badge-close'))
  }
];

const MAX_SCORE = SIGNAL_DEFINITIONS.reduce((sum, signal) => sum + signal.weight, 0);
let lastMessageSignature = null;

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function collectSignals() {
  const hits = [];
  for (const signal of SIGNAL_DEFINITIONS) {
    let matched = false;
    try {
      matched = signal.test();
    } catch (error) {
      console.warn(`[Te Pille] Signal failed: ${signal.id}`, error);
    }
    if (matched) {
      hits.push(signal);
    }
  }
  return hits;
}

function detectLovable() {
  const hits = collectSignals();
  const score = hits.reduce((sum, hit) => sum + hit.weight, 0);
  const strongHits = hits.filter((hit) => hit.strong).length;
  const detected = strongHits > 0 || score >= DETECTION_THRESHOLD;

  let confidence = Math.round((score / MAX_SCORE) * 100);
  if (detected && strongHits > 0) {
    confidence = Math.max(confidence, 72);
  }
  if (!detected) {
    confidence = Math.min(confidence, 49);
  }

  return {
    detected,
    framework: detected ? FRAMEWORK_NAME : null,
    score,
    confidence: Math.max(0, Math.min(99, confidence)),
    signals: hits.map((hit) => hit.label),
    strongSignalCount: strongHits
  };
}

function sendDetectionMessage(result, reason) {
  try {
    chrome.runtime.sendMessage(
      {
        type: "LOVABLE_DETECTION",
        reason,
        detected: result.detected,
        framework: result.framework,
        score: result.score,
        confidence: result.confidence,
        signals: result.signals,
        checkedAt: Date.now()
      },
      () => {
        if (chrome.runtime.lastError) {
          console.debug("[Te Pille] Message not delivered:", chrome.runtime.lastError.message);
        }
      }
    );
  } catch (error) {
    console.error("[Te Pille] sendDetectionMessage failed:", error);
  }
}

function runDetection(reason) {
  const result = detectLovable();
  const signature = `${location.href}|${result.detected}|${result.score}|${result.signals.join(",")}`;

  if (signature !== lastMessageSignature) {
    lastMessageSignature = signature;
    sendDetectionMessage(result, reason);
  }
}

function elementLooksRelevant(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const tagName = element.tagName;
  if (tagName === "SCRIPT" || tagName === "LINK" || tagName === "META") {
    return true;
  }

  if (typeof element.id === "string" && element.id.toLowerCase().includes("lovable")) {
    return true;
  }

  if (typeof element.className === "string" && element.className.toLowerCase().includes("lovable")) {
    return true;
  }

  if (
    element.matches &&
    element.matches(
      '[src*="lovable" i], [href*="lovable" i], [data-proxy-url*="lovable" i], [aria-label*="lovable" i]'
    )
  ) {
    return true;
  }

  if (!element.querySelector) {
    return false;
  }

  return Boolean(
    element.querySelector(
      'script[src*="lovable" i], link[href*="lovable" i], meta[content*="lovable" i], [id*="lovable" i], [class*="lovable" i], [data-proxy-url*="lovable" i]'
    )
  );
}

function hasRelevantMutation(records) {
  for (const record of records) {
    if (record.type === "attributes" && RELEVANT_ATTRIBUTES.has(record.attributeName || "")) {
      return true;
    }

    if (record.type !== "childList") {
      continue;
    }

    for (const node of record.addedNodes) {
      if (elementLooksRelevant(node)) {
        return true;
      }
    }

    for (const node of record.removedNodes) {
      if (elementLooksRelevant(node)) {
        return true;
      }
    }
  }

  return false;
}

function scheduleNavigationDetection(reason) {
  setTimeout(() => runDetection(reason), 350);
}

function patchHistoryMethod(methodName) {
  const originalMethod = history[methodName];
  if (typeof originalMethod !== "function") {
    return;
  }

  history[methodName] = function patchedHistoryMethod(...args) {
    const result = originalMethod.apply(this, args);
    scheduleNavigationDetection(`history:${methodName}`);
    return result;
  };
}

const debouncedMutationDetection = debounce(() => runDetection("dom-mutation"), 900);

try {
  const observer = new MutationObserver((records) => {
    if (hasRelevantMutation(records)) {
      debouncedMutationDetection();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: Array.from(RELEVANT_ATTRIBUTES)
  });
} catch (error) {
  console.error("[Te Pille] MutationObserver setup failed:", error);
}

patchHistoryMethod("pushState");
patchHistoryMethod("replaceState");

window.addEventListener("popstate", () => scheduleNavigationDetection("history:popstate"));
window.addEventListener("hashchange", () => scheduleNavigationDetection("history:hashchange"));

if (document.readyState === "complete" || document.readyState === "interactive") {
  runDetection("initial");
} else {
  document.addEventListener("DOMContentLoaded", () => runDetection("domcontentloaded"), { once: true });
}
