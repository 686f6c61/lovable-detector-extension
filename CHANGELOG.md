# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.2] - 2025-11-19

### Añadido

#### Detección para SPAs (Single Page Applications)
- Interceptación de `history.pushState()` para detectar navegación en SPAs
- Interceptación de `history.replaceState()` para detectar cambios de URL
- Listener de `popstate` para detectar navegación atrás/adelante
- Polling de URL cada 500ms para detectar cambios de ruta
- Re-detección automática después de navegación SPA con delay de 500ms
- Caché del último framework detectado para evitar envíos duplicados

#### Métodos de Detección Adicionales
- Detección mediante meta tag author (`<meta name="author" content="Lovable">`)
- Detección de scripts con dominio lovable.app (`<script src="https://...lovable.app/...">`)
- Detección de links con dominio lovable (`<link href="https://...lovable...">`)
- Detección de recursos lovable-uploads (CDN de Lovable)
- Análisis completo del código fuente HTML como último recurso

Total de métodos de detección: **11** (antes eran 6)

### Mejorado
- Optimización de re-detecciones: solo envía mensaje si el estado cambió
- Logs mejorados con información de cambios de estado
- Detección más robusta para sitios con carga dinámica de contenido

### Técnico
- Sistema completo de detección SPA implementado
- Variables de estado para tracking de cambios
- Múltiples estrategias de detección de navegación

## [1.1] - 2025-11-19

### Añadido

#### Detección Mejorada
- Detección mediante meta tag generator (`<meta name="generator" content="lovable">`)
- Detección mediante meta tag description
- Detección mediante comentarios HTML que contengan "lovable"
- Detección mediante clases CSS e IDs que contengan "lovable"
- Detección mediante atributos data (data-lovable, data-framework)
- Detección case-insensitive en todos los métodos
- MutationObserver con debounce para detectar cambios dinámicos en el DOM

#### Interfaz de Usuario
- Sección de estadísticas mostrando:
  - Total de sitios Lovable detectados
  - URL actual detectada
- Historial de detecciones con:
  - Lista de las últimas 100 detecciones
  - URL y timestamp de cada detección
  - Interfaz con scroll personalizado
  - Navegación entre vista principal e historial
- Loading spinner animado al cargar información del proyecto
- Animaciones CSS:
  - Efecto fade-in en secciones
  - Efecto pulse en el borde del popup
  - Efecto glow en títulos
  - Transiciones suaves en links y botones
- Responsive design con media queries para 320px y 400px
- Mejoras visuales en hover de elementos interactivos

#### Funcionalidad
- Lazy loading con caché para about.html
- Historial persistente de detecciones (límite 100 entradas)
- Contador de total de detecciones
- Limpieza automática de storage al cambiar de tab
- Inicialización automática del storage al instalar la extensión

#### Seguridad
- Content Security Policy (CSP) configurada
- Sanitización HTML mediante `escapeHtml()` para prevenir XSS
- Validación de tabs antes de operaciones
- Manejo de errores con try-catch en todas las funciones críticas
- Callback de error en chrome.runtime.sendMessage
- Validación de respuestas HTTP en fetch

#### Performance
- Debounce de 1 segundo en detección por mutaciones DOM
- Caché de contenido de about.html
- MutationObserver optimizado para observar solo atributos relevantes
- Content script ejecutado en `document_idle`

### Cambiado

#### Manifest (v1.0 → v1.1)
- Versión incrementada a 1.1
- Permisos reorganizados: separación de `host_permissions`
- Eliminado permiso `activeTab` (no necesario)
- Eliminado permiso `scripting` (no necesario)
- Añadido permiso `tabs` para gestión de tabs
- Añadido `content_security_policy`
- Añadido `web_accessible_resources` para about.html
- Añadido `default_icon` en action
- Añadido `run_at: "document_idle"` en content_scripts

#### Background Script
- Añadida validación de sender.tab antes de usar tabId
- Almacenamiento de detección con timestamp y URL
- Gestión de historial con límite de 100 entradas
- Evita duplicados de URL en historial
- Contador de detecciones totales
- Listener para cambios de tab activo
- Listener de instalación para inicializar storage
- Manejo de errores completo en todos los callbacks

#### Content Script
- Refactorización completa de detectFramework()
- Añadidos 5 nuevos métodos de detección
- Función sendDetectionMessage() separada
- Implementación de debounce()
- MutationObserver para cambios dinámicos
- Try-catch en detección y envío de mensajes
- Callback de error en sendMessage

#### Popup Script
- Caché global para about.html
- Funciones utilitarias: safeSetText(), formatDate(), truncateUrl()
- Función escapeHtml() para sanitización
- Funciones loadStatistics() y loadHistory()
- Navegación entre vistas: principal, historial, about
- Manejo de errores en todos los event listeners
- Validación de elementos antes de manipular DOM

#### Popup CSS
- Añadidas 4 animaciones keyframes: fadeIn, pulse, glow, spin
- Nuevas clases para loading spinner
- Estilos para sección de historial
- Estilos para sección de estadísticas
- Media queries para responsive design
- Estilos de scrollbar personalizados
- Transiciones en elementos interactivos
- Efecto hover mejorado en botones y links

### Mejorado
- Documentación actualizada en README.md
- Comentarios JSDoc en funciones
- Organización y estructura del código
- Experiencia de usuario general
- Rendimiento de detección
- Seguridad contra vulnerabilidades comunes

## [1.0] - Fecha Original

### Inicial
- Detección básica mediante meta tag keywords
- Cambio de icono al detectar
- Popup con información de detección
- Estética hacker básica
- Vista de proyecto con about.html
