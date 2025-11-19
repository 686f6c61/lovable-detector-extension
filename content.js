
/**
 * ============================================================================
 * Te Pillé - Lovable Framework Detector
 * ============================================================================
 *
 * Content Script - Script de detección inyectado en páginas web
 *
 * @file        content.js
 * @description Script de contenido que se inyecta en todas las páginas web
 *              para detectar si fueron construidas con el framework Lovable.
 *              Utiliza múltiples métodos de detección y monitorea cambios
 *              dinámicos en el DOM.
 *
 * @author      686f6c61 (https://github.com/686f6c61)
 * @repository  https://github.com/686f6c61/lovable-detector-extension
 * @version     1.1
 * @date        2025-11-19
 * @license     MIT
 *
 * @requires    Chrome Extension API
 * @requires    DOM API
 * @requires    MutationObserver API
 *
 * Flujo de ejecución:
 * 1. Se ejecuta automáticamente cuando la página termina de cargar (document_idle)
 * 2. Ejecuta detectFramework() para buscar indicadores de Lovable
 * 3. Envía resultado al background script mediante chrome.runtime.sendMessage
 * 4. Inicia MutationObserver para detectar cambios dinámicos en el DOM
 * 5. Re-ejecuta detección si el DOM cambia (con debounce de 1 segundo)
 *
 * ============================================================================
 */

/**
 * Detecta si la página web actual fue construida con el framework Lovable.
 *
 * Utiliza 11 métodos diferentes de detección para máxima precisión:
 * 1. Meta tag "keywords" con contenido "lovable"
 * 2. Meta tag "generator" con contenido "lovable"
 * 3. Meta tag "author" con contenido "lovable"
 * 4. Meta tag "description" con contenido "lovable"
 * 5. Scripts con dominio lovable.app
 * 6. Links con dominio lovable
 * 7. URLs con lovable-uploads (CDN de Lovable)
 * 8. Comentarios HTML que contengan "lovable"
 * 9. Clases CSS o IDs que contengan "lovable"
 * 10. Atributos data (data-lovable, data-framework)
 * 11. Análisis completo del código fuente HTML
 *
 * Todas las búsquedas son case-insensitive para mayor flexibilidad.
 * Incluye detección especial para SPAs (Single Page Applications).
 *
 * @function detectFramework
 * @returns {string|null} Retorna "Lovable" si se detecta el framework, null en caso contrario
 *
 * @example
 * const framework = detectFramework();
 * if (framework) {
 *   console.log(`Detectado: ${framework}`);
 * }
 */
function detectFramework() {
  try {
    // === MÉTODO 1: Meta Tag Keywords ===
    // Busca: <meta name="keywords" content="...lovable...">
    // El flag 'i' hace la búsqueda case-insensitive
    const lovableKeywords = document.querySelector('meta[name="keywords" i][content*="lovable" i]');
    if (lovableKeywords) {
      console.log("✓ Lovable detectado mediante meta tag keywords");
      return "Lovable";
    }

    // === MÉTODO 2: Meta Tag Generator ===
    // Busca: <meta name="generator" content="Lovable">
    // Muchos frameworks incluyen esta etiqueta para identificarse
    const lovableGenerator = document.querySelector('meta[name="generator" i][content*="lovable" i]');
    if (lovableGenerator) {
      console.log("✓ Lovable detectado mediante meta tag generator");
      return "Lovable";
    }

    // === MÉTODO 3: Meta Tag Author ===
    // Busca: <meta name="author" content="Lovable">
    // Detecta cuando el autor es Lovable
    const lovableAuthor = document.querySelector('meta[name="author" i][content*="lovable" i]');
    if (lovableAuthor) {
      console.log("✓ Lovable detectado mediante meta tag author");
      return "Lovable";
    }

    // === MÉTODO 4: Meta Tag Description ===
    // Busca: <meta name="description" content="...lovable...">
    // Algunas páginas mencionan el framework en la descripción
    const lovableDescription = document.querySelector('meta[name="description" i][content*="lovable" i]');
    if (lovableDescription) {
      console.log("✓ Lovable detectado mediante meta tag description");
      return "Lovable";
    }

    // === MÉTODO 5: Scripts con dominio lovable.app ===
    // Busca: <script src="https://...lovable.app/...">
    // Detecta scripts cargados desde dominios de Lovable
    const lovableScripts = document.querySelector('script[src*="lovable.app" i]');
    if (lovableScripts) {
      console.log("✓ Lovable detectado mediante script con dominio lovable.app");
      return "Lovable";
    }

    // === MÉTODO 6: Links con dominio lovable ===
    // Busca: <link href="https://...lovable..." rel="...">
    // Detecta hojas de estilo u otros recursos de Lovable
    const lovableLinks = document.querySelector('link[href*="lovable" i]');
    if (lovableLinks) {
      console.log("✓ Lovable detectado mediante link con dominio lovable");
      return "Lovable";
    }

    // === MÉTODO 7: URLs con lovable-uploads ===
    // Busca recursos alojados en CDN de Lovable
    // Ejemplo: /lovable-uploads/...
    const lovableUploads = document.querySelector('[src*="lovable-upload" i], [href*="lovable-upload" i]');
    if (lovableUploads) {
      console.log("✓ Lovable detectado mediante recursos lovable-uploads");
      return "Lovable";
    }

    // === MÉTODO 8: Comentarios HTML ===
    // Busca comentarios en el código HTML: <!-- Built with Lovable -->
    // Usa regex para buscar en todo el documento
    const htmlContent = document.documentElement.outerHTML;
    if (/<!--.*lovable.*-->/i.test(htmlContent)) {
      console.log("✓ Lovable detectado mediante comentarios HTML");
      return "Lovable";
    }

    // === MÉTODO 9: Clases CSS e IDs ===
    // Busca elementos con clases o IDs que contengan "lovable"
    // Ejemplo: <div class="lovable-container"> o <div id="lovable-app">
    const lovableClasses = document.querySelector('[class*="lovable" i], [id*="lovable" i]');
    if (lovableClasses) {
      console.log("✓ Lovable detectado mediante clases CSS o IDs");
      return "Lovable";
    }

    // === MÉTODO 10: Atributos Data ===
    // Busca atributos data-lovable o data-framework="lovable"
    // Ejemplo: <div data-lovable="true"> o <div data-framework="lovable">
    const lovableData = document.querySelector('[data-lovable], [data-framework*="lovable" i]');
    if (lovableData) {
      console.log("✓ Lovable detectado mediante atributos data");
      return "Lovable";
    }

    // === MÉTODO 11: Análisis de código fuente completo ===
    // Busca la palabra "lovable" en cualquier parte del HTML (última verificación)
    if (/lovable/i.test(htmlContent)) {
      console.log("✓ Lovable detectado mediante análisis completo del código fuente");
      return "Lovable";
    }

    // No se detectó ningún framework conocido
    console.log("✗ No se detectó ningún framework conocido");
    return null;

  } catch (error) {
    // Captura cualquier error durante la detección
    console.error("❌ Error durante la detección del framework:", error);
    return null;
  }
}

/**
 * Implementa la técnica de debounce para limitar la frecuencia de ejecución de una función.
 *
 * El debounce es útil para eventos que se disparan frecuentemente (como scroll, resize, input).
 * Esta función asegura que la función objetivo solo se ejecute después de que haya pasado
 * cierto tiempo desde la última invocación.
 *
 * @function debounce
 * @param {Function} func - La función a la que se aplicará debounce
 * @param {number} wait - Milisegundos que deben pasar sin nueva invocación antes de ejecutar
 * @returns {Function} Versión debounced de la función original
 *
 * @example
 * const debouncedSearch = debounce(() => {
 *   console.log('Buscando...');
 * }, 500);
 * // Se ejecutará solo 500ms después de la última llamada
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    // Función que se ejecutará después del delay
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    // Cancela el timeout anterior si existe
    clearTimeout(timeout);
    // Programa una nueva ejecución
    timeout = setTimeout(later, wait);
  };
}

/**
 * Envía el resultado de la detección al background script.
 *
 * Esta función se comunica con el service worker (background.js) mediante
 * chrome.runtime.sendMessage para notificar si se detectó Lovable o no.
 * El background script actualizará el icono y almacenará la información.
 *
 * @function sendDetectionMessage
 * @param {string|null} framework - Nombre del framework detectado ("Lovable") o null si no hay detección
 *
 * @fires chrome.runtime.sendMessage
 *
 * @example
 * sendDetectionMessage("Lovable");  // Notifica detección positiva
 * sendDetectionMessage(null);       // Notifica que no se detectó nada
 */
function sendDetectionMessage(framework) {
  try {
    if (framework) {
      // Framework detectado - enviar mensaje positivo
      console.log(`📤 Enviando mensaje: Detectado ${framework}`);
      chrome.runtime.sendMessage(
        { detected: true, framework: framework },
        (response) => {
          // Verifica si hubo error en la comunicación
          if (chrome.runtime.lastError) {
            console.error("❌ Error enviando mensaje:", chrome.runtime.lastError.message);
          }
        }
      );
    } else {
      // No se detectó framework - enviar mensaje negativo
      console.log("📤 Enviando mensaje: No se detectó framework");
      chrome.runtime.sendMessage(
        { detected: false },
        (response) => {
          // Verifica si hubo error en la comunicación
          if (chrome.runtime.lastError) {
            console.error("❌ Error enviando mensaje:", chrome.runtime.lastError.message);
          }
        }
      );
    }
  } catch (error) {
    // Captura errores inesperados en el envío del mensaje
    console.error("❌ Error en sendDetectionMessage:", error);
  }
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

// Variable para almacenar el último framework detectado
let lastDetectedFramework = null;

// Ejecuta la detección inicial cuando el script se carga
console.log("🔍 Iniciando detección de Lovable...");
const framework = detectFramework();
lastDetectedFramework = framework;
sendDetectionMessage(framework);

// ============================================================================
// MONITOREO DE CAMBIOS DINÁMICOS EN EL DOM
// ============================================================================

/**
 * Función de detección con debounce aplicado.
 * Se ejecutará solo 1 segundo después del último cambio en el DOM.
 * Esto evita ejecutar la detección cientos de veces durante cambios masivos.
 */
const debouncedDetection = debounce(() => {
  console.log("🔄 Re-ejecutando detección por cambios en el DOM...");
  const newFramework = detectFramework();

  // Solo envía mensaje si el estado de detección cambió
  if (newFramework !== lastDetectedFramework) {
    console.log(`📊 Estado cambió de ${lastDetectedFramework} a ${newFramework}`);
    lastDetectedFramework = newFramework;
    sendDetectionMessage(newFramework);
  }
}, 1000); // Espera 1 segundo después del último cambio

/**
 * MutationObserver para detectar cambios dinámicos en el DOM.
 *
 * Observa:
 * - Adición/eliminación de nodos (childList: true)
 * - Cambios en todo el árbol DOM (subtree: true)
 * - Cambios en atributos específicos (attributes: true + attributeFilter)
 *
 * Esto es útil para sitios con contenido cargado dinámicamente mediante JavaScript,
 * SPAs (Single Page Applications), o frameworks que renderizan contenido de forma asíncrona.
 */
const observer = new MutationObserver(debouncedDetection);

// Inicia la observación del DOM
try {
  observer.observe(document.documentElement, {
    childList: true,     // Observa adición/eliminación de nodos hijos
    subtree: true,       // Observa todo el árbol DOM, no solo hijos directos
    attributes: true,    // Observa cambios en atributos
    attributeFilter: ['class', 'id', 'data-framework', 'data-lovable']  // Solo estos atributos
  });
  console.log("👁️ MutationObserver configurado y activo");
} catch (error) {
  console.error("❌ Error configurando MutationObserver:", error);
}

// ============================================================================
// DETECCIÓN DE NAVEGACIÓN SPA (Single Page Applications)
// ============================================================================

/**
 * Monitorea cambios de URL en SPAs sin recarga de página.
 *
 * Las SPAs usan History API para cambiar la URL sin recargar.
 * Esto detecta esos cambios y re-ejecuta la detección.
 */

let lastUrl = location.href;

/**
 * Observador de cambios en la URL mediante polling.
 * Verifica cada 500ms si la URL cambió.
 */
const urlCheckInterval = setInterval(() => {
  if (location.href !== lastUrl) {
    console.log(`🔀 Navegación SPA detectada: ${lastUrl} → ${location.href}`);
    lastUrl = location.href;

    // Re-ejecuta detección inmediatamente
    setTimeout(() => {
      console.log("🔍 Re-ejecutando detección por navegación SPA...");
      const newFramework = detectFramework();

      if (newFramework !== lastDetectedFramework) {
        console.log(`📊 Estado cambió tras navegación de ${lastDetectedFramework} a ${newFramework}`);
        lastDetectedFramework = newFramework;
        sendDetectionMessage(newFramework);
      }
    }, 500); // Espera 500ms para que el DOM se actualice
  }
}, 500); // Verifica cada 500ms

/**
 * Intercepta pushState y replaceState para detectar navegación SPA.
 * Estos métodos se usan en SPAs para cambiar la URL sin recargar.
 */
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

// Sobrescribe pushState
history.pushState = function(...args) {
  originalPushState.apply(this, args);
  console.log("🔀 pushState detectado, URL cambió");

  // Re-ejecuta detección después de un delay
  setTimeout(() => {
    console.log("🔍 Re-ejecutando detección por pushState...");
    const newFramework = detectFramework();

    if (newFramework !== lastDetectedFramework) {
      console.log(`📊 Estado cambió de ${lastDetectedFramework} a ${newFramework}`);
      lastDetectedFramework = newFramework;
      sendDetectionMessage(newFramework);
    }
  }, 500);
};

// Sobrescribe replaceState
history.replaceState = function(...args) {
  originalReplaceState.apply(this, args);
  console.log("🔀 replaceState detectado, URL cambió");

  // Re-ejecuta detección después de un delay
  setTimeout(() => {
    console.log("🔍 Re-ejecutando detección por replaceState...");
    const newFramework = detectFramework();

    if (newFramework !== lastDetectedFramework) {
      console.log(`📊 Estado cambió de ${lastDetectedFramework} a ${newFramework}`);
      lastDetectedFramework = newFramework;
      sendDetectionMessage(newFramework);
    }
  }, 500);
};

// Escucha el evento popstate (botón atrás/adelante del navegador)
window.addEventListener('popstate', () => {
  console.log("🔀 popstate detectado (navegación atrás/adelante)");

  setTimeout(() => {
    console.log("🔍 Re-ejecutando detección por popstate...");
    const newFramework = detectFramework();

    if (newFramework !== lastDetectedFramework) {
      console.log(`📊 Estado cambió de ${lastDetectedFramework} a ${newFramework}`);
      lastDetectedFramework = newFramework;
      sendDetectionMessage(newFramework);
    }
  }, 500);
});

console.log("🚀 Sistema de detección SPA configurado y activo");
