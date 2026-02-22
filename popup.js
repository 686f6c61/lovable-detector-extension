let aboutHtmlCache = null;

document.addEventListener("DOMContentLoaded", () => {
  const resultDiv = document.getElementById("result");
  const noResultDiv = document.getElementById("no-result");
  const aboutContentDiv = document.getElementById("about-content");
  const aboutTextDiv = document.getElementById("about-text");
  const loadingIndicator = document.getElementById("loading-indicator");
  const viewProjectLink = document.getElementById("view-project-link");
  const backButton = document.getElementById("back-button");
  const historyContent = document.getElementById("history-content");
  const historyList = document.getElementById("history-list");
  const evidenceSection = document.getElementById("evidence-section");
  const evidenceList = document.getElementById("evidence-list");
  const toggleHistoryLink = document.getElementById("toggle-history-link");
  const toggleHistoryLinkNoResult = document.getElementById("toggle-history-link-no-result");
  const backFromHistory = document.getElementById("back-from-history");
  const footer = document.querySelector(".footer");

  let currentTabDetection = null;

  function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = String(text);
    }
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function truncateUrl(url, maxLength = 50) {
    const value = String(url || "");
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength - 3)}...`;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  function getActiveTabId(callback) {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !Array.isArray(tabs) || tabs.length === 0) {
          callback(null);
          return;
        }

        const activeTab = tabs[0];
        callback(typeof activeTab.id === "number" ? activeTab.id : null);
      });
    } catch (error) {
      console.error("Error getting active tab:", error);
      callback(null);
    }
  }

  function loadCurrentTabDetection(callback) {
    getActiveTabId((tabId) => {
      if (tabId === null) {
        currentTabDetection = null;
        callback(null);
        return;
      }

      chrome.storage.local.get({ detectionsByTab: {} }, (data) => {
        if (chrome.runtime.lastError) {
          console.error("Error loading detectionsByTab:", chrome.runtime.lastError.message);
          currentTabDetection = null;
          callback(null);
          return;
        }

        const detectionsByTab = data.detectionsByTab || {};
        currentTabDetection = detectionsByTab[String(tabId)] || null;
        callback(currentTabDetection);
      });
    });
  }

  function loadStatistics() {
    chrome.storage.local.get({ totalDetections: 0 }, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading statistics:", chrome.runtime.lastError.message);
        return;
      }

      const total = data.totalDetections || 0;
      const currentUrl = currentTabDetection && currentTabDetection.url ? currentTabDetection.url : "-";
      safeSetText("total-detections", total);
      safeSetText("total-detections-no-result", total);
      safeSetText("current-url", truncateUrl(currentUrl, 30));
    });
  }

  function loadHistory() {
    chrome.storage.local.get({ detectionHistory: [] }, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading history:", chrome.runtime.lastError.message);
        historyList.innerHTML = '<p class="loading-text">Error cargando historial</p>';
        return;
      }

      const history = data.detectionHistory || [];
      if (history.length === 0) {
        historyList.innerHTML = '<p class="loading-text">No hay detecciones previas</p>';
        return;
      }

      history.sort((a, b) => b.timestamp - a.timestamp);
      const historyHtml = history
        .map((item) => {
          const url = escapeHtml(truncateUrl(item.url || "-", 60));
          const framework = escapeHtml(item.framework || "Lovable");
          const timestamp = formatDate(item.timestamp || Date.now());
          return `
            <div class="history-item">
              <span class="history-url">${url}</span>
              <span class="history-time">${framework} · ${timestamp}</span>
            </div>
          `;
        })
        .join("");

      historyList.innerHTML = historyHtml;
    });
  }

  function renderEvidence(detection) {
    if (!evidenceSection || !evidenceList) {
      return;
    }

    evidenceList.innerHTML = "";
    const signals = Array.isArray(detection && detection.signals) ? detection.signals : [];
    const evidenceItems = [];

    if (signals.length > 0) {
      evidenceItems.push(...signals.slice(0, 6));
    } else {
      evidenceItems.push("Sin señales detalladas para esta detección.");
    }

    if (Number.isFinite(detection && detection.confidence)) {
      evidenceItems.push(`Confianza estimada: ${detection.confidence}%`);
    }

    for (const itemText of evidenceItems) {
      const li = document.createElement("li");
      li.className = "evidence-item";
      li.textContent = itemText;
      evidenceList.appendChild(li);
    }

    evidenceSection.style.display = "block";
  }

  function showMainView() {
    historyContent.style.display = "none";
    aboutContentDiv.style.display = "none";
    footer.style.display = "block";
    resultDiv.style.display = "none";
    noResultDiv.style.display = "none";

    loadCurrentTabDetection((detection) => {
      if (detection && detection.detectedFramework) {
        safeSetText("framework-name", detection.detectedFramework);
        renderEvidence(detection);
        resultDiv.style.display = "block";
      } else {
        if (evidenceSection) {
          evidenceSection.style.display = "none";
        }
        noResultDiv.style.display = "block";
      }

      loadStatistics();
    });
  }

  function showHistory() {
    resultDiv.style.display = "none";
    noResultDiv.style.display = "none";
    aboutContentDiv.style.display = "none";
    footer.style.display = "none";
    historyContent.style.display = "block";
    loadHistory();
  }

  function showAbout() {
    resultDiv.style.display = "none";
    noResultDiv.style.display = "none";
    historyContent.style.display = "none";
    footer.style.display = "none";
    aboutContentDiv.style.display = "block";
    loadingIndicator.style.display = "block";
    aboutTextDiv.innerHTML = "";

    if (aboutHtmlCache) {
      aboutTextDiv.innerHTML = aboutHtmlCache;
      loadingIndicator.style.display = "none";
      return;
    }

    fetch(chrome.runtime.getURL("about.html"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        aboutHtmlCache = html;
        aboutTextDiv.innerHTML = html;
      })
      .catch((error) => {
        console.error("Error loading about.html:", error);
        aboutTextDiv.innerHTML = '<p class="loading-text">Error cargando información del proyecto</p>';
      })
      .finally(() => {
        loadingIndicator.style.display = "none";
      });
  }

  if (viewProjectLink) {
    viewProjectLink.addEventListener("click", (event) => {
      event.preventDefault();
      showAbout();
    });
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      showMainView();
    });
  }

  if (toggleHistoryLink) {
    toggleHistoryLink.addEventListener("click", (event) => {
      event.preventDefault();
      showHistory();
    });
  }

  if (toggleHistoryLinkNoResult) {
    toggleHistoryLinkNoResult.addEventListener("click", (event) => {
      event.preventDefault();
      showHistory();
    });
  }

  if (backFromHistory) {
    backFromHistory.addEventListener("click", () => {
      showMainView();
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (historyContent.style.display === "block") {
      if (changes.detectionHistory) {
        loadHistory();
      }
      return;
    }

    if (aboutContentDiv.style.display === "block") {
      return;
    }

    if (changes.detectionsByTab || changes.totalDetections) {
      showMainView();
    }
  });

  showMainView();
});
