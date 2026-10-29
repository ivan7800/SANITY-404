# F35.11 — Diagnóstico independiente del arranque Electron en Windows

## Hechos confirmados

En el run privado `40841056385`, `electron.launch()` agotó 45000 ms. Electron se inició, Playwright conectó al inspector Node y apareció `Debugger attached`; el argumento `-r .../playwright-core/lib/server/electron/loader.js` ya estaba presente. El informe tenía `main: []` y ninguna comprobación funcional. La ausencia de hitos no demuestra por sí sola que `desktop/main.mjs` no se ejecutara: también podría haber fallado la escritura del archivo de diagnóstico antes del primer registro. No se dispone localmente del JSON original ni del log completo del runner; `gh auth status` indica token inválido.

`desktop/package.json` declara `main.mjs` como punto de entrada. `npm --prefix desktop start` ejecuta `electron .`. Las pruebas existentes resuelven el binario de `desktop/node_modules/electron`, pasan el directorio `desktop/` y fijan un directorio temporal de datos mediante `SANITY_QA_USER_DATA`. El proceso principal registra `main-loaded`, `waiting-for-ready`, `app-ready`, `window-created` y `window-loaded` solo en modo QA. La señal de carga ahora incluye URL y la de ventana incluye visibilidad. El instalador conserva el mismo punto de entrada, recursos, ASAR, configuración de guardados y mecánicas; el registro queda inactivo en una aplicación empaquetada.

Playwright 1.64.1 y Electron 45.1.0 están fijados por los lockfiles. La documentación oficial de Playwright declara soporte experimental para Electron 21 o posterior y advierte que desactivar el fuse `nodeCliInspect` puede causar timeouts. En este run, la conexión al inspector Node demuestra que ese canal funciona; no demuestra que Chromium anunciara o aceptara su puerto DevTools. Electron documenta `--inspect`, `--remote-debugging-port`, `--enable-logging=file` y que en Windows el archivo es la forma fiable de recoger logs de procesos hijos. No hay evidencia suficiente para afirmar una incompatibilidad general entre las dos versiones.

Fuentes: [Playwright Electron](https://playwright.dev/docs/api/class-electron), [opciones de línea de comandos de Electron](https://www.electronjs.org/docs/latest/api/command-line-switches).

## Prueba independiente

`npm run test:desktop:startup` ejecuta directamente el Electron instalado, sin importar ni iniciar Playwright, en dos modos consecutivos:

1. `plain`: aplicación real con registro de Chromium a archivo y sin puertos de depuración.
2. `debug-flags`: mismos recursos y datos aislados, más `--inspect=0 --remote-debugging-port=0`, los argumentos de inspección usados por Playwright.

Cada modo crea un directorio temporal, señala el PID del proceso lanzado, recoge stdout, stderr, el log de Chromium y el JSONL del proceso principal. Exige los cinco hitos en orden, una ventana visible y `sanity://game/index.html` cargado. Un proceso vivo sin código principal o sin ventana **falla**. Cada modo tiene un límite de 25 s, devuelve estado global no cero si falla y termina el árbol del proceso al acabar (`taskkill /PID /T /F` en Windows). El JSON `docs/capturas/fase34/electron-independent-native/diagnostico.json` se escribe incluso si falla una comprobación. Los tests unitarios cubren que un PID sin hitos, los hitos desordenados y una carga fallida no se acepten.

El workflow manual añade esta etapa después del build y de `verify:distribution`, antes de los smoke tests Playwright. El artefacto QA se sube con `always()` e incluye el diagnóstico independiente aunque se detenga el job. Las pruebas de recursos y persistencia de Playwright permanecen intactas.

## Lectura del próximo resultado Windows

- Si `plain` falla antes de `main-loaded`, revisar ejecución real del binario, entorno GUI del runner, variables de Electron, argumentos, cwd y stderr/archivo de Chromium. Si hay `main-loaded` pero no `app-ready`, revisar el ciclo de Electron. Si llega a `app-ready` pero no a `window-loaded`, revisar `BrowserWindow`, protocolo y carga de recursos.
- Si `plain` pasa y `debug-flags` falla, investigar los argumentos de inspector Node o Chromium y sus puertos. Los campos `debuggerListening` y `devToolsListening` muestran si se anunciaron sus WebSockets; en Windows el log de archivo complementa stderr.
- Si ambos pasan y `electron.launch()` sigue sin devolver, el bloqueo queda aislado en la integración Playwright, su cargador o la conexión CDP. Comparar el registro de lanzamiento Playwright con los hitos del nuevo diagnóstico y comprobar si aparece `DevTools listening`.
- Si ambos pasan y los smoke tests pasan, continuar las verificaciones existentes de recursos, guardado, reapertura y paquete NSIS.

No se puede certificar el entorno gráfico de `windows-2022` sin ejecutar el nuevo paso allí. Tampoco se considera que la creación de un PID valide la interfaz gráfica.

## Validación local

- `npm run audit:rooms`: 29 salas y 418 rutas comprobadas, 0 inaccesibles.
- `npm run build:web`: PASS.
- `npm run build:desktop:assets`: PASS.
- `npm run test:desktop:startup`: ambos modos generaron JSON y fallaron antes de `main-loaded` por `sandbox_host_linux.cc: Operation not permitted (1)`. Es la restricción del sandbox Linux; no es prueba nativa Windows.
- La primera ejecución de `npm test`, simultánea con auditoría y builds, tuvo un timeout de 5 s en una prueba de portales no relacionada con Electron (310 PASS, 1 timeout).
- `npm test` repetido sin otras tareas pesadas: 311/311 PASS en 72 archivos. El timeout anterior fue sensible a la carga concurrente local; no se cambió la prueba ni el límite.
- `npm run verify:distribution`: web y desktop PASS.
- Validación sintáctica del workflow con PyYAML: PASS; jobs `web` y `windows` presentes.
- `npm run format:check`: PASS.
- `git diff --check`: PASS.

Esta preparación no ejecuta Actions, no publica artefactos ni modifica el repositorio público principal.
