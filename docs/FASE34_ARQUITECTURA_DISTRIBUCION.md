# Fase 34 · arquitectura de distribución

Estado: AppImage y DEB probados manualmente según confirmación del usuario; web local verificada; instalador Windows y ejecución nativa Windows pendientes. El timeout de producción web permanece abierto.

## Inventario previo

- Juego: TypeScript, Vite 7 y Three.js; sin dependencia de Electron previa.
- Web: `vite.config.ts` usa `/SANITY-404/` en producción para GitHub Pages. `pages.yml` se limita a `main` o activación manual; esta fase no lo ejecuta.
- Guardados: `src/systems/save.ts` valida `sanity404-save` antes de escribir y al leer. Ajustes en `sanity404-settings`, ambos en `localStorage`. No se modificó el formato ni se migraron partidas.
- Recursos: `public/` contiene iconos originales SVG. No hay service worker ni manifest PWA en el árbol inspeccionado. La recarga web depende del servidor estático y la caché del navegador.

## Diseño implementado

- `npm run build:web` conserva la base `/SANITY-404/` y genera `dist/`.
- `npm run build:desktop:assets` usa modo Vite `desktop`, base `./` y genera `desktop/dist-desktop/`.
- `desktop/main.mjs` sirve el bundle local con el protocolo seguro `sanity://game/`; la página no recibe Node ni preload, el contexto está aislado y sandbox está activo. Se bloquean navegación externa, ventanas emergentes y permisos.
- El origen estable permite persistencia de `localStorage` entre arranques del mismo perfil Electron; la prueba de cierre y reapertura está en `scripts/phase34-electron-smoke.mjs` y aún requiere ejecución nativa.
- `desktop/paths.mjs` limita peticiones al bundle y rechaza rutas codificadas o ajenas. El paquete usa iconos propios PNG/ICO derivados del símbolo del juego.
- El protocolo delega en `serveAsset`, que devuelve 200 para recursos existentes, 404 para rutas ausentes y 405 para métodos distintos de GET. La ejecución estática del manejador sirvió los siete archivos del bundle de escritorio con estado 200. El proceso principal registra `did-fail-load`, `console-message`, `render-process-gone` y el estado de cada recurso; el registro detallado solo se conserva en el perfil aislado de QA, sin exponer controles al renderer de producción.
- `desktop/package.json` aísla Electron y electron-builder del runtime web. Las versiones directas están fijadas y la instalación nativa dejó `desktop/package-lock.json`, conservado sin modificarlo.
- `.github/workflows/distribution-verify.yml` compila y adjunta artefactos en PR o ejecución manual. No publica releases ni despliega web.
- `npm run clean:artifacts` muestra los directorios generados sin borrarlos; `npm run clean:artifacts -- --apply` elimina solo `dist/`, `desktop/dist-desktop/` y `desktop/release/` cuando se solicita explícitamente. No se ejecutó la opción de borrado.

## Seguridad y límites

Las dos plataformas usan almacenes de origen diferentes; no hay importación automática de guardados. Un archivo web antiguo sigue bajo el origen del sitio. Un guardado Electron se mantiene bajo `sanity://game` y el perfil local del sistema. La compatibilidad de contenido la decide el parser actual del juego. El protocolo solo sirve archivos del bundle; ningún servidor Vite es necesario al ejecutar la aplicación empaquetada.

La prueba de recursos comprueba bases y hashes del bundle; no sustituye arranque de instaladores ni pruebas de campaña en Windows/Linux.

## Estado de la ventana y de la prueba

El HTML inicial contiene una sección en flujo normal. Tras iniciar el juego, `src/main.ts` la reemplaza por `#viewport` y `#overlay`, posicionados como `fixed`; por ello `<body>` puede tener altura cero aunque el menú sea visible y operable. El anterior `locator("body").waitFor()` exigía visibilidad geométrica de `<body>` y podía informar un falso fallo. El smoke actual espera el botón accesible «Nueva partida» visible, comprueba la ventana, el menú, el documento, todos los recursos, la partida y la reapertura. Guarda dimensiones, `display`, `visibility`, `opacity`, contenido y eventos de ambos procesos para distinguir ese caso de una página realmente vacía. La hipótesis de altura cero requiere confirmación en la nueva traza nativa.

El empaquetador F34 usa el Electron ya extraído y un hook que omite el colector de módulos solo mientras `desktop/package.json` no declare dependencias de ejecución. Así se evita un fallo reproducido de electron-builder 26.18.0 con una aplicación cuyo renderer está completamente empaquetado por Vite. El AppImage y el DEB actuales se inventariaron en `FASE34_LINUX.md`; el usuario confirmó ambos funcionales. El bloqueo anterior de descarga de `fpm` describe una ejecución previa, no el estado actual del DEB.

## Incidente de instalación del ejecutable

Electron 45.1.0 quedó instalado como paquete npm, pero `desktop/node_modules/electron/dist/electron` y `path.txt` faltaban. `npm config get ignore-scripts` devolvió `false`; el paquete instalado declara `install-electron` como comando, sin `postinstall`, por lo que `npm rebuild electron` podía terminar con código 0 sin extraer el binario. El ZIP de la versión estaba en la caché local. Al cargar el módulo `electron`, su `index.js` ejecutó `install.js` y creó el ejecutable y `path.txt`. El smoke ahora resuelve el ejecutable mediante el módulo, comprueba que existe y que es ejecutable, y emite un diagnóstico si la extracción falla. No se añadió ninguna ruta de usuario ni se modificó el sandbox de producción.
