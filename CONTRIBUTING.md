# Guía de Contribución para Desarrolladores

## 📋 Información del Proyecto

**Nombre**: Te Pillé - Lovable Framework Detector
**Autor**: 686f6c61
**Repositorio**: https://github.com/686f6c61/lovable-detector-extension
**Versión**: 1.1
**Fecha**: 2025-11-19
**Licencia**: MIT

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Archivos

```
lovable-detector-extension/
├── manifest.json          # Configuración de la extensión (Manifest V3)
├── content.js             # Script inyectado en páginas web
├── background.js          # Service worker (background script)
├── popup.html             # Estructura HTML del popup
├── popup.css              # Estilos del popup
├── popup.js               # Lógica del popup
├── about.html             # Información del proyecto
├── images/                # Iconos de la extensión
│   ├── icon*.png         # Iconos por defecto
│   └── icon-detected*.png # Iconos cuando se detecta
├── README.md              # Documentación principal
├── CHANGELOG.md           # Registro de cambios
└── CONTRIBUTING.md        # Esta guía

Total líneas de código: ~946 (sin contar archivos de documentación)
```

---

## 🔄 Flujo de Datos

```
┌─────────────────┐
│  Página Web     │
└────────┬────────┘
         │ 1. DOM cargado
         ▼
┌─────────────────┐
│  content.js     │ ← Script inyectado
│  detectFramework()
└────────┬────────┘
         │ 2. chrome.runtime.sendMessage()
         ▼
┌─────────────────┐
│  background.js  │ ← Service Worker
│  - Storage
│  - Historial
│  - Estadísticas
│  - Cambio de icono
└────────┬────────┘
         │ 3. chrome.storage.local
         ▼
┌─────────────────┐
│  popup.js       │ ← Interfaz
│  - Lee storage
│  - Muestra datos
└─────────────────┘
```

---

## 📁 Descripción de Archivos

### 1. `manifest.json`
- **Propósito**: Configuración principal de la extensión
- **Manifest Version**: 3 (última versión)
- **Permisos**:
  - `storage`: Almacenamiento local de datos
  - `tabs`: Gestión de pestañas
  - `host_permissions`: Acceso a todas las URLs
- **Content Security Policy**: Protección contra XSS

### 2. `content.js`
- **Propósito**: Detección de Lovable en páginas web
- **Funciones principales**:
  - `detectFramework()`: 6 métodos de detección
  - `sendDetectionMessage()`: Comunicación con background
  - `debounce()`: Optimización de re-detecciones
- **APIs utilizadas**:
  - `document.querySelector()`: Búsqueda de elementos
  - `MutationObserver`: Detección de cambios dinámicos
  - `chrome.runtime.sendMessage()`: Envío de mensajes

### 3. `background.js`
- **Propósito**: Lógica central y persistencia de datos
- **Funciones principales**:
  - Recepción de mensajes desde content scripts
  - Actualización de iconos
  - Gestión de historial (máximo 100 entradas)
  - Estadísticas de detecciones
  - Limpieza al cambiar tabs
- **Listeners**:
  - `chrome.runtime.onMessage`: Mensajes de content script
  - `chrome.tabs.onActivated`: Cambio de tab activo
  - `chrome.runtime.onInstalled`: Primera instalación

### 4. `popup.html`
- **Propósito**: Estructura del popup
- **Vistas**:
  - `#result`: Detección positiva
  - `#no-result`: Sin detección
  - `#history-content`: Historial
  - `#about-content`: Información del proyecto

### 5. `popup.js`
- **Propósito**: Lógica e interactividad del popup
- **Funciones principales**:
  - `loadStatistics()`: Carga y muestra estadísticas
  - `loadHistory()`: Carga historial de detecciones
  - `escapeHtml()`: Sanitización contra XSS
  - `formatDate()`: Formateo de timestamps
  - `truncateUrl()`: Acorta URLs largas
- **Navegación**: Gestión de vistas múltiples
- **Caché**: `aboutHtmlCache` para about.html

### 6. `popup.css`
- **Propósito**: Estilos y animaciones
- **Tema**: Estética hacker (negro, verde neón, cyan, magenta)
- **Animaciones CSS**:
  - `fadeIn`: Entrada suave
  - `pulse`: Pulsación del borde
  - `glow`: Resplandor en títulos
  - `spin`: Rotación del spinner
- **Responsive**: Media queries para 320px y 400px

---

## 🔧 Tecnologías Utilizadas

- **JavaScript ES6+**: Sintaxis moderna
- **Chrome Extension API**: Manifest V3
- **HTML5**: Estructura semántica
- **CSS3**: Animaciones y responsive design
- **MutationObserver API**: Detección de cambios DOM
- **Fetch API**: Carga de recursos
- **Storage API**: Persistencia de datos

---

## 💾 Estructura de Datos en Storage

```javascript
// Storage Local
{
  // Detección actual
  "detectedFramework": "Lovable",        // string | null
  "detectedAt": 1732012345678,           // timestamp
  "url": "https://example.com",          // string

  // Historial (array de objetos)
  "detectionHistory": [
    {
      "framework": "Lovable",
      "url": "https://example.com",
      "timestamp": 1732012345678
    },
    // ... hasta 100 entradas
  ],

  // Estadísticas
  "totalDetections": 42                   // number
}
```

---

## 🎨 Convenciones de Código

### JavaScript

1. **Nombres de variables**: camelCase
   ```javascript
   const detectedFramework = "Lovable";
   ```

2. **Nombres de funciones**: camelCase + verbos
   ```javascript
   function detectFramework() { }
   function loadStatistics() { }
   ```

3. **Constantes**: UPPERCASE_SNAKE_CASE (si son verdaderas constantes)
   ```javascript
   const MAX_HISTORY_ENTRIES = 100;
   ```

4. **Comentarios JSDoc**: Obligatorios en funciones principales
   ```javascript
   /**
    * Descripción de la función
    * @param {type} param - Descripción
    * @returns {type} Descripción
    */
   ```

5. **Manejo de errores**: Siempre usar try-catch
   ```javascript
   try {
     // código
   } catch (error) {
     console.error("❌ Error:", error);
   }
   ```

6. **Validación de Chrome API**: Verificar chrome.runtime.lastError
   ```javascript
   chrome.storage.local.get(data, (result) => {
     if (chrome.runtime.lastError) {
       console.error("Error:", chrome.runtime.lastError.message);
       return;
     }
     // usar result
   });
   ```

### CSS

1. **Organización**: Secciones con comentarios
   ```css
   /* ============================================================================
    * NOMBRE DE SECCIÓN
    * ============================================================================ */
   ```

2. **Clases**: kebab-case
   ```css
   .loading-spinner { }
   .history-item { }
   ```

3. **IDs**: kebab-case
   ```css
   #result { }
   #no-result { }
   ```

### HTML

1. **Indentación**: 2 espacios
2. **Comentarios**: Secciones claramente marcadas
   ```html
   <!-- ========================================================================
        NOMBRE DE SECCIÓN
        ======================================================================== -->
   ```

---

## 🧪 Testing

### Testing Manual

1. **Instalación**:
   ```bash
   # En Chrome/Edge:
   # 1. Ir a chrome://extensions
   # 2. Activar "Modo de desarrollador"
   # 3. Click en "Cargar extensión sin empaquetar"
   # 4. Seleccionar carpeta del proyecto
   ```

2. **Probar detección**:
   - Visitar sitio construido con Lovable
   - Verificar cambio de icono
   - Abrir popup y verificar mensaje "¡Te Pillé!"

3. **Probar historial**:
   - Visitar múltiples sitios Lovable
   - Abrir popup > Ver historial
   - Verificar que aparecen todas las URLs

4. **Probar estadísticas**:
   - Verificar contador total
   - Verificar URL actual

### Debugging

**Console logs**:
```javascript
// content.js
console.log("🔍 Iniciando detección...");
console.log("✓ Lovable detectado");
console.log("✗ No detectado");

// background.js
console.log("✅ Framework detectado:", framework);
console.log("💾 Detección almacenada");
console.log("📊 Total:", total);

// popup.js
console.log("📤 Cargando estadísticas...");
```

**Chrome DevTools**:
- **Content script**: F12 en la página web
- **Background script**: chrome://extensions > "service worker"
- **Popup**: Click derecho en popup > Inspeccionar

---

## 🚀 Añadiendo Nuevas Funcionalidades

### Ejemplo: Añadir detección de otro framework

1. **Modificar content.js**:
   ```javascript
   function detectFramework() {
     // Detecciones existentes...

     // Nueva detección para "NuevoFramework"
     const nuevoMeta = document.querySelector('meta[name="generator"][content*="nuevo"]');
     if (nuevoMeta) {
       console.log("✓ NuevoFramework detectado");
       return "NuevoFramework";
     }

     return null;
   }
   ```

2. **Actualizar manifest.json**:
   ```json
   {
     "version": "1.2",
     "description": "Detecta sitios con Lovable y NuevoFramework"
   }
   ```

3. **Actualizar CHANGELOG.md**:
   ```markdown
   ## [1.2] - YYYY-MM-DD
   ### Añadido
   - Detección de NuevoFramework
   ```

---

## 📝 Checklist antes de Commit

- [ ] Código comentado con JSDoc
- [ ] Sin console.log() innecesarios
- [ ] Manejo de errores con try-catch
- [ ] Validación de chrome.runtime.lastError
- [ ] Código formateado correctamente
- [ ] CHANGELOG.md actualizado
- [ ] README.md actualizado si aplica
- [ ] Extensión testeada manualmente

---

## 🔐 Seguridad

### Protecciones Implementadas

1. **XSS Prevention**:
   - CSP en manifest.json
   - Uso de `textContent` en vez de `innerHTML`
   - Función `escapeHtml()` para sanitización

2. **Validación de Mensajes**:
   - Verificación de `sender.tab` en background.js

3. **Permisos Mínimos**:
   - Solo permisos necesarios en manifest

### Buenas Prácticas

- **NO** usar `eval()`
- **NO** usar `innerHTML` con datos del usuario
- **SÍ** validar todos los inputs
- **SÍ** usar `textContent` para texto plano

---

## 🐛 Reporte de Bugs

Al reportar un bug, incluir:

1. **Versión de la extensión**: (Ver manifest.json)
2. **Navegador**: Chrome/Edge + versión
3. **Sistema operativo**: Windows/Mac/Linux
4. **Pasos para reproducir**:
   - Paso 1
   - Paso 2
   - Paso 3
5. **Comportamiento esperado**: Qué debería pasar
6. **Comportamiento actual**: Qué está pasando
7. **Screenshots**: Si aplica
8. **Console logs**: Copiar errores de la consola

---

## 📞 Contacto

- **GitHub**: https://github.com/686f6c61
- **Issues**: https://github.com/686f6c61/lovable-detector-extension/issues

---

## 📜 Licencia

MIT License - Ver archivo LICENSE para detalles
