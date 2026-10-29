# F35.10 — Arranque de Electron en Windows CI

## Evidencia y alcance

En la ejecución `40838210294`, el job web pasó y el job Windows falló antes de las comprobaciones funcionales. Según el JSON de evidencia examinado por el usuario, Electron arrancó con PID 6616, abrió el WebSocket del inspector Node, Playwright se conectó y apareció `Debugger attached`. `electron.launch()` agotó 180000 ms sin devolver `ElectronApplication`; `checks: []`, `runs: []` y `completed: false`. El JSON original y el registro completo del runner no están disponibles en esta copia local; la autenticación de `gh` no permite recuperarlos. No hay demostración de que el proceso principal ejecutara `desktop/main.mjs` ni de que Chromium anunciara su WebSocket DevTools.

La versión fijada en `package-lock.json` es Playwright 1.64.1; `desktop/package.json` fija Electron 45.1.0. La implementación instalada de Playwright espera, por orden, `Debugger listening on ws://...`, conexión al inspector Node, `DevTools listening on ws://...`, conexión a Chromium y evaluación de `__playwright_run()` en el proceso principal. Por eso, `Debugger attached` solo demuestra la primera conexión. El punto exacto posterior que se bloqueó en Windows sigue pendiente de observar.

## Causa demostrada y corrección

La prueba pasaba `executablePath` a `electron.launch()`. En Playwright 1.64.1, esa rama **no añade** `-r .../electron/loader.js`; la rama que usa el ejecutable Electron por defecto sí lo añade. El cargador define `__playwright_run()` y coordina `app.whenReady()` con la conexión de Playwright. Esta diferencia de configuración está demostrada por el código instalado y se corrige añadiendo explícitamente el cargador de la misma instalación de `playwright-core` a los argumentos de Electron. Aún no está demostrado que esa omisión fuera la única causa del timeout observado en Windows: requiere la siguiente ejecución nativa.

`desktop/main.mjs` conserva la ruta `sanity://game/index.html`, el protocolo, la ventana, los permisos y los guardados. En modo QA únicamente, registra hitos desde `main-loaded` hasta `window-loaded` o un fallo de arranque, con PID y marca temporal en stderr y en un JSONL temporal. Los errores de inicialización y de `loadURL()` terminan con código 1 y mensaje explícito. `launchElectron()` añade al informe JSON las etapas del lanzamiento y los hitos del proceso principal. Limita `electron.launch()` a 45 s y `firstWindow()` a 15 s; el cierre normal tiene un límite de 15 s. En un fallo, intenta cerrar la aplicación y, si persiste, termina el PID de esa ejecución (`taskkill /PID ... /T /F` en Windows). Los fallos de limpieza quedan registrados. No se han ampliado los tiempos de espera ni retirado aserciones de recursos, visibilidad o persistencia.

Archivos modificados: `desktop/main.mjs`, `scripts/phase34-electron-qa.mjs`, `scripts/phase34-electron-smoke.mjs`, `scripts/phase34-electron-save-smoke.mjs` y `tests/phase34-electron-qa.test.mjs`. El test nuevo comprueba que el cargador resuelto contiene la función de arranque que Playwright invoca.

## Verificaciones locales

Ejecutadas en una copia aislada del clon privado, sin modificar el repositorio público:

- `npm test`: 309/309 pruebas PASS (incluye el nuevo test; el objetivo inicial de 308 sigue cubierto).
- `npm run audit:rooms`: 29 salas y 418 rutas, 0 inaccesibles.
- `npm run build:web`: PASS.
- `npm run build:desktop:assets`: PASS.
- `npm run verify:distribution`: web y desktop PASS.
- Validación sintáctica del workflow mediante PyYAML: PASS, jobs `web` y `windows`.
- `npm run format:check` y `git diff --check`: PASS tras formatear.
- `npm run test:desktop:smoke` y `npm run test:desktop:save`: ambos intentados y bloqueados en este sandbox. Electron termina con `sandbox_host_linux.cc:41 ... Operation not permitted (1)`; la misma orden directa reproduce esa restricción antes de cargar la aplicación. Ambos scripts escribieron el JSON de fallo, incluso ante las promesas internas rechazadas de Playwright. No se consideran pruebas nativas Windows ni regresiones demostradas del producto.

Se enlazaron las dependencias ya instaladas en el workspace para ejecutar las validaciones locales; la instalación limpia `npm ci` y `npm ci --prefix desktop` continúa siendo una comprobación del workflow.

## Riesgo pendiente y comprobación en GitHub Actions

No se dispone de Windows local para reproducir el timeout. En la siguiente ejecución **manual y autorizada** del workflow en el repositorio privado, comprobar:

1. Que `Verify Electron resources and persistence on Windows runner` pasa los dos scripts sin cambiar las aserciones.
2. En el artefacto `sanity-404-windows-qa`, que cada intento contiene `electron.launch.resolved`, `firstWindow.resolved` y los hitos `main-loaded`, `app-ready`, `window-created`, `window-loaded`.
3. Que los dos arranques del smoke verifican recursos HTTP 200, menú, partida nueva y almacenamiento al reabrir; que la prueba de guardado verifica `E`, el dato persistido y `Continuar` después de reabrir.
4. Si falla, comparar el último hito del proceso principal con el registro de Playwright: ausencia de `main-loaded` implica fallo anterior al punto de entrada; ausencia de `app-ready` tras `waiting-for-ready` apunta a la sincronización; ausencia de `DevTools listening` con hitos posteriores apunta al puerto Chromium o su conexión. Consultar `cleanupError` y confirmar que el PID no queda activo.
5. Solo tras pasar estas comprobaciones, continuar la auditoría NSIS del workflow. No interpretar un resultado Linux como sustituto del runner Windows.

El workflow se mantiene manual (`workflow_dispatch`), exige repositorio privado antes del instalador y no publica ni despliega. Esta preparación local no ejecutó ningún workflow remoto.
