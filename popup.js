/**
 * ============================================================================
 * Te Pillé - Lovable Framework Detector
 * ============================================================================
 *
 * Popup Script - Interfaz de usuario de la extensión
 *
 * @file        popup.js
 * @description Controla toda la lógica e interactividad del popup de la extensión.
 *              Gestiona vistas múltiples (detección, historial, about), carga de
 *              estadísticas, navegación y sanitización de datos.
 *
 * @author      686f6c61 (https://github.com/686f6c61)
 * @repository  https://github.com/686f6c61/lovable-detector-extension
 * @version     1.1
 * @date        2025-11-19
 * @license     MIT
 *
 * @requires    Chrome Extension API (chrome.storage, chrome.runtime)
 * @requires    DOM API
 * @requires    Fetch API
 *
 * Vistas disponibles:
 * - Vista principal (result/no-result): Muestra estado de detección actual
 * - Vista de historial: Lista de sitios Lovable detectados previamente
 * - Vista about: Información del proyecto
 *
 * Funcionalidades:
 * - Carga y muestra estadísticas de detecciones
 * - Gestiona historial de detecciones con timestamps
 * - Lazy loading con caché de about.html
 * - Sanitización HTML para prevenir XSS
 * - Loading states con spinners animados
 * - Formateo de fechas y URLs
 *
 * ============================================================================
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

/**
 * Caché para el contenido de about.html.
 * Evita cargar el archivo múltiples veces, mejorando la performance.
 * @type {string|null}
 */
let aboutHtmlCache = null;

// ============================================================================
// INICIALIZACIÓN DEL POPUP
// ============================================================================

/**
 * Event listener principal que se ejecuta cuando el DOM del popup está cargado.
 * Inicializa referencias a elementos, configura event listeners y carga datos.
 *
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {

  // === REFERENCIAS A ELEMENTOS DEL DOM ===
  // Se obtienen una sola vez al inicio para evitar búsquedas repetidas
  const body = document.body;
  const resultDiv = document.getElementById('result');                         // Vista de detección positiva
  const noResultDiv = document.getElementById('no-result');                   // Vista sin detección
  const aboutContentDiv = document.getElementById('about-content');           // Vista de información del proyecto
  const aboutTextDiv = document.getElementById('about-text');                 // Contenedor del HTML de about
  const loadingIndicator = document.getElementById('loading-indicator');      // Spinner de carga
  const viewProjectLink = document.getElementById('view-project-link');       // Link "Ver proyecto"
  const backButton = document.getElementById('back-button');                  // Botón volver desde about
  const historyContent = document.getElementById('history-content');          // Vista de historial
  const historyList = document.getElementById('history-list');                // Lista de detecciones
  const toggleHistoryLink = document.getElementById('toggle-history-link');   // Link "Ver historial" (con detección)
  const toggleHistoryLinkNoResult = document.getElementById('toggle-history-link-no-result');  // Link historial (sin detección)
  const backFromHistory = document.getElementById('back-from-history');       // Botón volver desde historial
  const footer = document.querySelector('.footer');                            // Footer con descripción

  // ============================================================================
  // FUNCIONES UTILITARIAS
  // ============================================================================

  /**
   * Establece el contenido de texto de un elemento de forma segura.
   * Usa textContent en lugar de innerHTML para prevenir XSS.
   *
   * @function safeSetText
   * @param {string} elementId - ID del elemento a modificar
   * @param {string} text - Texto a establecer
   *
   * @example
   * safeSetText('framework-name', 'Lovable');
   */
  function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Format timestamp to readable date
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date
   */
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Truncate URL for display
   * @param {string} url - Full URL
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated URL
   */
  function truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  }

  /**
   * Load and display statistics
   */
  function loadStatistics() {
    try {
      chrome.storage.local.get(['totalDetections', 'url'], (data) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading statistics:', chrome.runtime.lastError.message);
          return;
        }

        const total = data.totalDetections || 0;
        const currentUrl = data.url || '-';

        safeSetText('total-detections', total);
        safeSetText('total-detections-no-result', total);
        safeSetText('current-url', truncateUrl(currentUrl, 30));
      });
    } catch (error) {
      console.error('Error in loadStatistics:', error);
    }
  }

  /**
   * Load and display detection history
   */
  function loadHistory() {
    try {
      chrome.storage.local.get(['detectionHistory'], (data) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading history:', chrome.runtime.lastError.message);
          historyList.innerHTML = '<p class="loading-text">Error cargando historial</p>';
          return;
        }

        const history = data.detectionHistory || [];

        if (history.length === 0) {
          historyList.innerHTML = '<p class="loading-text">No hay detecciones previas</p>';
          return;
        }

        // Sort by timestamp descending (most recent first)
        const sortedHistory = history.sort((a, b) => b.timestamp - a.timestamp);

        // Create HTML for history items
        const historyHtml = sortedHistory.map(item => `
          <div class="history-item">
            <span class="history-url">${escapeHtml(truncateUrl(item.url, 60))}</span>
            <span class="history-time">${formatDate(item.timestamp)}</span>
          </div>
        `).join('');

        historyList.innerHTML = historyHtml;
      });
    } catch (error) {
      console.error('Error in loadHistory:', error);
      historyList.innerHTML = '<p class="loading-text">Error cargando historial</p>';
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show history view
   */
  function showHistory() {
    resultDiv.style.display = 'none';
    noResultDiv.style.display = 'none';
    aboutContentDiv.style.display = 'none';
    footer.style.display = 'none';
    historyContent.style.display = 'block';
    loadHistory();
  }

  /**
   * Hide history view and return to main view
   */
  function hideHistory() {
    historyContent.style.display = 'none';
    footer.style.display = 'block';

    chrome.storage.local.get('detectedFramework', (data) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting detection status:', chrome.runtime.lastError.message);
        return;
      }

      if (data.detectedFramework) {
        resultDiv.style.display = 'block';
      } else {
        noResultDiv.style.display = 'block';
      }
    });
  }

  // Initial display based on framework detection
  try {
    chrome.storage.local.get('detectedFramework', (data) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting framework detection:', chrome.runtime.lastError.message);
        noResultDiv.style.display = 'block';
        return;
      }

      if (data.detectedFramework) {
        safeSetText('framework-name', data.detectedFramework);
        resultDiv.style.display = 'block';
      } else {
        noResultDiv.style.display = 'block';
      }

      // Load statistics after initial display
      loadStatistics();
    });
  } catch (error) {
    console.error('Error in initial display:', error);
    noResultDiv.style.display = 'block';
  }

  // Event listener for 'View Project' link
  if (viewProjectLink) {
    viewProjectLink.addEventListener('click', (event) => {
      event.preventDefault();

      // Hide all main sections
      resultDiv.style.display = 'none';
      noResultDiv.style.display = 'none';
      footer.style.display = 'none';
      historyContent.style.display = 'none';

      // Show loading indicator
      aboutContentDiv.style.display = 'block';
      loadingIndicator.style.display = 'block';
      aboutTextDiv.innerHTML = '';

      // Load about.html with caching
      if (aboutHtmlCache) {
        // Use cached content
        aboutTextDiv.innerHTML = aboutHtmlCache;
        loadingIndicator.style.display = 'none';
      } else {
        // Fetch and cache content
        fetch(chrome.runtime.getURL('about.html'))
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          })
          .then(data => {
            aboutHtmlCache = data; // Cache the content
            aboutTextDiv.innerHTML = data;
            loadingIndicator.style.display = 'none';
          })
          .catch(error => {
            console.error('Error loading about.html:', error);
            aboutTextDiv.innerHTML = '<p class="loading-text">Error cargando información del proyecto</p>';
            loadingIndicator.style.display = 'none';
          });
      }
    });
  }

  // Event listener for 'Back' button from about section
  if (backButton) {
    backButton.addEventListener('click', () => {
      aboutContentDiv.style.display = 'none';
      footer.style.display = 'block';

      try {
        chrome.storage.local.get('detectedFramework', (data) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting detection status:', chrome.runtime.lastError.message);
            noResultDiv.style.display = 'block';
            return;
          }

          if (data.detectedFramework) {
            resultDiv.style.display = 'block';
          } else {
            noResultDiv.style.display = 'block';
          }
        });
      } catch (error) {
        console.error('Error in back button handler:', error);
        noResultDiv.style.display = 'block';
      }
    });
  }

  // Event listeners for history toggle links
  if (toggleHistoryLink) {
    toggleHistoryLink.addEventListener('click', (event) => {
      event.preventDefault();
      showHistory();
    });
  }

  if (toggleHistoryLinkNoResult) {
    toggleHistoryLinkNoResult.addEventListener('click', (event) => {
      event.preventDefault();
      showHistory();
    });
  }

  // Event listener for back button from history
  if (backFromHistory) {
    backFromHistory.addEventListener('click', () => {
      hideHistory();
    });
  }
});