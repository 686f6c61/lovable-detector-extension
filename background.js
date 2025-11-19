/**
 * ============================================================================
 * Te Pillé - Lovable Framework Detector
 * ============================================================================
 *
 * Background Script - Service Worker (Manifest V3)
 *
 * @file        background.js
 * @description Service worker que maneja la lógica central de la extensión.
 *              Recibe mensajes de content scripts, gestiona el almacenamiento,
 *              actualiza iconos y mantiene el historial de detecciones.
 *
 * @author      686f6c61 (https://github.com/686f6c61)
 * @repository  https://github.com/686f6c61/lovable-detector-extension
 * @version     1.1
 * @date        2025-11-19
 * @license     MIT
 *
 * @requires    Chrome Extension API (chrome.runtime, chrome.storage, chrome.action, chrome.tabs)
 *
 * Flujo de trabajo:
 * 1. Recibe mensajes del content script con resultados de detección
 * 2. Actualiza el icono de la extensión según el resultado
 * 3. Almacena información en chrome.storage.local
 * 4. Mantiene historial de detecciones (máximo 100 entradas)
 * 5. Limpia datos al cambiar de tab
 * 6. Inicializa storage en primera instalación
 *
 * Estructura de datos en storage:
 * - detectedFramework: string | null     - Framework detectado en tab actual
 * - detectedAt: number                   - Timestamp de la detección
 * - url: string                          - URL donde se detectó
 * - detectionHistory: Array<Object>      - Historial de detecciones
 * - totalDetections: number              - Contador total
 *
 * ============================================================================
 */

/**
 * Listener principal para mensajes del content script.
 *
 * Este listener se ejecuta cada vez que un content script envía un mensaje
 * mediante chrome.runtime.sendMessage(). Maneja tanto detecciones positivas
 * como negativas, actualiza iconos y storage.
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} request - Objeto con los datos del mensaje
 * @param {boolean} request.detected - true si se detectó framework, false si no
 * @param {string} [request.framework] - Nombre del framework detectado (solo si detected=true)
 * @param {Object} sender - Información sobre quién envió el mensaje
 * @param {Object} sender.tab - Información del tab que envió el mensaje
 * @param {number} sender.tab.id - ID del tab
 * @param {string} sender.tab.url - URL del tab
 * @param {Function} sendResponse - Función para enviar respuesta (no usada actualmente)
 *
 * @example
 * // Desde content script:
 * chrome.runtime.sendMessage({ detected: true, framework: "Lovable" });
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // === VALIDACIÓN DE SEGURIDAD ===
    // Verifica que el mensaje proviene de un tab válido
    // Esto previene mensajes de fuentes no autorizadas
    if (!sender.tab || !sender.tab.id) {
      console.error("❌ Remitente inválido: sin información de tab");
      return;
    }

    const tabId = sender.tab.id;
    const tabUrl = sender.tab.url || "unknown";

    // === RAMA: FRAMEWORK DETECTADO ===
    if (request.detected) {
      console.log(`✅ Framework detectado: ${request.framework} en ${tabUrl}`);

      // --- 1. Almacenar datos de detección actual ---
      const detectionData = {
        detectedFramework: request.framework,  // Nombre del framework (ej: "Lovable")
        detectedAt: Date.now(),                // Timestamp Unix en milisegundos
        url: tabUrl                            // URL completa del sitio
      };

      chrome.storage.local.set(detectionData, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error guardando datos:", chrome.runtime.lastError.message);
          return;
        }
        console.log(`💾 Detección almacenada: ${request.framework} para ${tabUrl}`);
      });

      // --- 2. Actualizar historial de detecciones ---
      chrome.storage.local.get({ detectionHistory: [] }, (data) => {
        const history = data.detectionHistory || [];
        const newEntry = {
          framework: request.framework,
          url: tabUrl,
          timestamp: Date.now()
        };

        // Evita duplicados: actualiza entrada existente para la misma URL
        const existingIndex = history.findIndex(entry => entry.url === tabUrl);
        if (existingIndex !== -1) {
          history[existingIndex] = newEntry;
          console.log(`🔄 Entrada actualizada en historial para ${tabUrl}`);
        } else {
          history.push(newEntry);
          console.log(`➕ Nueva entrada añadida al historial`);
        }

        // Mantiene solo las últimas 100 detecciones para no saturar el storage
        const trimmedHistory = history.slice(-100);

        chrome.storage.local.set({ detectionHistory: trimmedHistory }, () => {
          if (chrome.runtime.lastError) {
            console.error("❌ Error guardando historial:", chrome.runtime.lastError.message);
          }
        });
      });

      // --- 3. Incrementar contador de estadísticas ---
      chrome.storage.local.get({ totalDetections: 0 }, (data) => {
        const newTotal = (data.totalDetections || 0) + 1;
        chrome.storage.local.set({ totalDetections: newTotal });
        console.log(`📊 Total de detecciones: ${newTotal}`);
      });

      // --- 4. Cambiar icono a versión "detectado" ---
      // Usa iconos verdes/diferentes para indicar detección visual
      chrome.action.setIcon({
        path: {
          "16": "images/icon-detected16.png",
          "48": "images/icon-detected48.png",
          "128": "images/icon-detected128.png"
        },
        tabId: tabId  // Aplica solo a este tab específico
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error configurando icono:", chrome.runtime.lastError.message);
        } else {
          console.log("🎨 Icono actualizado a versión 'detectado'");
        }
      });

    // === RAMA: NO SE DETECTÓ FRAMEWORK ===
    } else {
      console.log(`ℹ️ No se detectó framework en ${tabUrl}`);

      // --- 1. Limpiar datos de detección actual ---
      chrome.storage.local.remove("detectedFramework", () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error limpiando detección:", chrome.runtime.lastError.message);
        }
      });

      // --- 2. Restaurar icono a versión por defecto ---
      chrome.action.setIcon({
        path: {
          "16": "images/icon16.png",
          "48": "images/icon48.png",
          "128": "images/icon128.png"
        },
        tabId: tabId  // Aplica solo a este tab específico
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error configurando icono:", chrome.runtime.lastError.message);
        } else {
          console.log("🎨 Icono restaurado a versión por defecto");
        }
      });
    }
  } catch (error) {
    // Captura cualquier error inesperado en el listener
    console.error("❌ Error en listener de mensajes:", error);
  }
});

// ============================================================================
// GESTIÓN DE CAMBIOS DE TAB
// ============================================================================

/**
 * Listener que se ejecuta cuando el usuario cambia de tab activo.
 *
 * Limpia los datos de detección almacenados para asegurar que el popup
 * muestre información actualizada del tab actual, no del anterior.
 * El content script del nuevo tab volverá a enviar la detección si aplica.
 *
 * @listens chrome.tabs.onActivated
 * @param {Object} activeInfo - Información sobre el tab activado
 * @param {number} activeInfo.tabId - ID del tab que se activó
 * @param {number} activeInfo.windowId - ID de la ventana que contiene el tab
 *
 * Flujo:
 * 1. Usuario cambia de tab
 * 2. Se dispara este evento
 * 3. Se limpia detectedFramework del storage
 * 4. Content script del nuevo tab detecta y envía mensaje
 * 5. Popup muestra datos actualizados
 */
chrome.tabs.onActivated.addListener((activeInfo) => {
  try {
    // Obtiene información del tab activado
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error("❌ Error obteniendo info del tab:", chrome.runtime.lastError.message);
        return;
      }

      console.log(`🔄 Tab activado: ${tab.url || 'Nueva pestaña'}`);

      // Limpia el estado de detección actual
      // El content script volverá a detectar si hay Lovable en el nuevo tab
      chrome.storage.local.remove("detectedFramework", () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error limpiando detección al cambiar tab:", chrome.runtime.lastError.message);
        } else {
          console.log("🧹 Detección actual limpiada, esperando nueva detección...");
        }
      });
    });
  } catch (error) {
    console.error("❌ Error en listener de activación de tab:", error);
  }
});

// ============================================================================
// INICIALIZACIÓN DE LA EXTENSIÓN
// ============================================================================

/**
 * Listener que se ejecuta cuando la extensión es instalada o actualizada.
 *
 * Inicializa el storage local con estructuras de datos vacías para:
 * - Historial de detecciones
 * - Contador de estadísticas
 *
 * @listens chrome.runtime.onInstalled
 * @param {Object} details - Detalles sobre la instalación
 * @param {string} details.reason - Razón del evento: 'install', 'update', 'chrome_update', 'shared_module_update'
 * @param {string} [details.previousVersion] - Versión anterior (solo en 'update')
 *
 * Posibles valores de details.reason:
 * - 'install': Primera instalación de la extensión
 * - 'update': Actualización a nueva versión
 * - 'chrome_update': Chrome se actualizó
 * - 'shared_module_update': Módulo compartido se actualizó
 */
chrome.runtime.onInstalled.addListener((details) => {
  try {
    if (details.reason === 'install') {
      // === PRIMERA INSTALACIÓN ===
      console.log("🎉 Extensión instalada por primera vez, inicializando storage...");

      // Inicializa estructura de datos
      chrome.storage.local.set({
        detectionHistory: [],   // Array vacío para el historial
        totalDetections: 0      // Contador en 0
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error inicializando storage:", chrome.runtime.lastError.message);
        } else {
          console.log("✅ Storage inicializado correctamente");
          console.log("📊 Historial: [], Total: 0");
        }
      });

    } else if (details.reason === 'update') {
      // === ACTUALIZACIÓN DE VERSIÓN ===
      console.log(`🔄 Extensión actualizada de v${details.previousVersion} a v1.1`);
      // Aquí podrían agregarse migraciones de datos si fueran necesarias
    }
  } catch (error) {
    console.error("❌ Error en listener de instalación:", error);
  }
});

// ============================================================================
// INICIO DEL SERVICE WORKER
// ============================================================================
console.log("🚀 Te Pillé - Background Service Worker iniciado");
console.log("📡 Escuchando mensajes de content scripts...");
console.log("👁️ Monitoreando cambios de tabs...");
