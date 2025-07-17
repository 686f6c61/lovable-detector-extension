# Extensión detector de Lovable

Esta extensión de navegador está diseñada para detectar si un sitio web está construido utilizando el framework Lovable.

## Cómo funciona

La extensión opera analizando el código fuente de la página web que está visitando. Específicamente, busca metaetiquetas que contengan palabras clave indicativas del framework Lovable.

Cuando se detecta un sitio web construido con Lovable, el icono de la extensión en la barra de herramientas de su navegador cambiará, proporcionando una señal visual de la detección. La ventana emergente también proporciona más detalles sobre la detección.

## Características

*   **Detección de Lovable:** Identifica sitios web construidos con el framework Lovable.
*   **Indicador visual:** Cambia el icono de la extensión en la barra de herramientas al detectar.
*   **Información detallada:** La ventana emergente de la extensión confirma la detección.
*   **Estética hacker:** La interfaz de usuario de la extensión presenta un tema visual distintivo de estilo hacker.

## Instalación

Para instalar esta extensión:

1.  Descargue o clone este repositorio en su máquina local.
2.  Abra la página de gestión de extensiones de su navegador (por ejemplo, `chrome://extensions` para Chrome, `about:debugging#/runtime/this-firefox` para Firefox).
3.  Habilite el "Modo de desarrollador" o "Cargar extensión sin empaquetar" (la terminología exacta puede variar según el navegador).
4.  Haga clic en "Cargar extensión sin empaquetar" o "Cargar complemento temporal" y seleccione el directorio donde descargó esta extensión.

## Uso

Simplemente navegue por la web como lo haría normalmente. Si aterriza en una página construida con el framework Lovable, el icono de la extensión en la barra de herramientas de su navegador cambiará para indicar una detección.

Al hacer clic en el icono de la extensión, se abrirá una ventana emergente que confirmará la detección y le ofrecerá la opción de ver más detalles sobre el proyecto.

## Estructura del proyecto

*   `manifest.json`: El archivo de manifiesto, que proporciona metadatos y configuración para la extensión.
*   `background.js`: El script de fondo, que maneja eventos y la comunicación entre diferentes partes de la extensión.
*   `content.js`: El script de contenido, inyectado en las páginas web para realizar la lógica de detección.
*   `popup.html`: La estructura HTML para la ventana emergente de la extensión.
*   `popup.css`: Los estilos CSS para la ventana emergente de la extensión, incluida la estética hacker.
*   `popup.js`: La lógica JavaScript para la ventana emergente de la extensión, que maneja las interacciones de la interfaz de usuario y el cambio de tema.
*   `about.html`: Contiene la explicación detallada del proyecto, cargada dinámicamente en la ventana emergente.
*   `images/`: Contiene los iconos utilizados por la extensión.

## Contribución

No dude en bifurcar este repositorio y contribuir a su desarrollo. Para cambios importantes, por favor, abra primero un issue para discutir lo que le gustaría cambiar.

## Licencia

Este proyecto es de código abierto y está disponible bajo la [Licencia MIT](LICENSE).