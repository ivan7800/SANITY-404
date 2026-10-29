# Fase 35 · estabilidad del build web

Fecha inicial: 28-10-2026; actualización F35.6: 29-10-2026. El repositorio no contenía una especificación de F35.1–F35.3. Se tomó como alcance la incidencia de timeout web abierta en Fase 34, la recuperación de WebGL y una regresión de producción reproducible. Las secciones F35.1–F35.4 conservan el estado de sus ejecuciones; F35.6 recoge el resultado posterior. No se hizo push, merge, despliegue ni release.

## F35.1 · Timeout y navegación

Los scripts de producción comprueban menú, guardado real, recarga y «Continuar» (`phase34-web-production-smoke.mjs`); escenarios de juego visibles sin `sanityInspect` (`browser-systems.mjs`); y navegaciones repetidas con estado HTTP, tiempos de carga, errores, peticiones pendientes y memoria (`phase35-web-navigation.mjs`). Los artefactos existentes de la sesión previa registran **12/12**, **20/20 con GC forzada** y **50/50** navegaciones locales sin errores de JavaScript, HTTP, recursos, cierre de página ni peticiones pendientes. En la muestra de 50, el menú estuvo listo entre 905 y 1674 ms (p95: 1574 ms). Evidencia: `capturas/fase35/web-production-navigation.json`, `web-production-navigation-gc.json` y `web-production-navigation-stress.json`.

Estas trazas preceden a la corrección de F35.2 y cubren `vite preview` local, no la URL desplegada. No reproducen el timeout comunicado, pero tampoco permiten cerrar esa incidencia remota.

## F35.2 · Recuperación de WebGL

`src/main.ts` cancela `webglcontextlost` para permitir la restauración, pausa la partida, impide reanudar y evita renderizar mientras no hay contexto. Al restaurarse, reaplica la calidad y la sombra y vuelve al menú de pausa. `phase35-webgl-production.mjs` inyecta una pérdida real mediante `WEBGL_lose_context` y comprueba aviso, cancelación del evento, restauración, reanudación y redimensionado. El script ahora escribe un resultado incluso si Chrome falla al arrancar.

La ejecución dinámica del caso **queda sin certificar en este entorno**. El sandbox rechaza abrir puertos locales (`listen EPERM`) y Chrome termina antes de crear una página (`Crashpad setsockopt: Operation not permitted`, `SIGTRAP`). El resultado de este intento está en `capturas/fase35/webgl-file/resultado.json`. El resultado anterior de `capturas/fase35/webgl-production/resultado.json` falló porque el navegador se cerró durante la espera; tampoco es un PASS. La compilación TypeScript y el bundle verifican que la corrección es válida a nivel estático.

## F35.3 · Verificación y entrega

| Comprobación                              | Resultado de esta revisión                         |
| ----------------------------------------- | -------------------------------------------------- |
| `npm test -- --maxWorkers=1`              | 307/307, 70 archivos, PASS                         |
| `npm run build:web`                       | PASS                                               |
| `npm run build:desktop:assets`            | PASS                                               |
| `npm run verify:distribution`             | PASS, siete archivos por destino                   |
| `npm run format:check`                    | PASS                                               |
| `npm run audit:rooms`                     | 29 salas, 418 rutas, cero inaccesibles             |
| Navegador del build final en este sandbox | BLOQUEADO por puertos y Chrome; no se declara PASS |
| Windows x64 real                          | PENDIENTE; sin EXE local certificado               |

La prueba de producción se reproduce en un equipo que permita Chrome y servidores locales:

```bash
npm run build:web
npm run preview -- --host 127.0.0.1 --port 5180 --strictPort
# En otra terminal:
SANITY_TEST_URL=http://127.0.0.1:5180/SANITY-404/ npm run test:web:production
SANITY_TEST_URL=http://127.0.0.1:5180/SANITY-404/ SANITY_NAV_RUNS=50 SANITY_NAV_OUTPUT=docs/capturas/fase35/web-production-navigation-final.json node scripts/phase35-web-navigation.mjs
```

Para cerrar la incidencia original hacen falta una repetición del timeout con URL, duración, paso de espera y traza, y una prueba de la URL remota tras un despliegue autorizado. La recuperación de WebGL necesita una ejecución en Chrome que permita `WEBGL_lose_context`. Windows conserva los criterios de aceptación de `FASE34_MATRIZ_QA.md`.

## F35.4 · Validación real y distribución Windows

El procedimiento ejecutable y los comandos individuales para Linux Mint están en [FASE35_4_LINUX_MINT_Y_WINDOWS.md](FASE35_4_LINUX_MINT_Y_WINDOWS.md). El runner `scripts/phase35-linux-mint-qa.sh` guarda códigos de salida, registros y evidencias en una carpeta con fecha, sin suprimir errores del navegador. El workflow Windows manual incorpora pruebas de arranque y persistencia en el runner y verificación del contenido real de `app.asar` y del instalador NSIS. No se ejecutó el workflow remoto ni se generó un nuevo EXE en esta revisión.

La ejecución del runner dentro de este sandbox terminó con código 1: Chrome `--version`, `build:web` y SHA-256 del bundle dieron código 0; Preview devolvió `EPERM` y código 1. Los archivos están en `capturas/fase35/f35-4-sandbox/`. El verificador del ASAR y de iconos dio código 0 con una estructura de prueba basada en el paquete Linux existente; ese ensayo valida el verificador, no un instalador Windows.

### Estado por tipo de resultado

| Estado                             | Comprobación                                                                                     | Evidencia o límite                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Superada**                       | Suite 307/307; builds web y escritorio; formato; recursos; auditoría de 29 salas y 418 rutas     | Ejecuciones locales de F35.3, con código 0.                                                                                            |
| **Superada en ejecución anterior** | 82 navegaciones de preview local                                                                 | JSON anteriores a la corrección WebGL; no certifican el build final.                                                                   |
| **Fallida**                        | Intento de iniciar Preview en este sandbox                                                       | `listen EPERM`; el servidor no llegó a servir la web.                                                                                  |
| **Fallida**                        | Intento de iniciar Chrome en este sandbox                                                        | Crashpad `Operation not permitted`, salida `SIGTRAP`; ninguna página abierta.                                                          |
| **Fallida en ejecución anterior**  | Prueba WebGL de producción                                                                       | El navegador se cerró durante la espera; `webgl-production/resultado.json`. No demuestra un fallo de restauración del juego corregido. |
| **Bloqueada**                      | Regresión gráfica del build final en este entorno                                                | Requiere servidor local y Chrome operativos. Script listo para Linux Mint fuera del sandbox.                                           |
| **Pendiente en hardware real**     | Timeout remoto, WebGL con GPU Linux Mint, EXE Windows x64, persistencia del EXE tras instalación | No se inventan resultados de estas ejecuciones.                                                                                        |

### Obstáculos priorizados para la versión 1.0

1. **P0 · Timeout web sin causa identificada.** Repetir con el build final y, cuando exista un despliegue autorizado, en la URL remota. Registrar traza, URL y paso exacto antes de corregir o cerrar.
2. **P0 · Recuperación WebGL sin validación dinámica del cambio.** El código se compiló, pero falta confirmar pérdida, aviso, restauración y reanudación con Chrome real. Si falla fuera del sandbox, tratarlo como defecto funcional.
3. **P0 si Windows forma parte de 1.0 · Instalador y persistencia no certificados.** El workflow está preparado; faltan ejecución manual privada, hash, instalación y partida guardada/reabierta en Windows x64 real.
4. **P1 · Cambio de perfil gráfico durante combate activo.** Riesgo heredado de F33, aún sin cierre reproducible en esta revisión.

No se asigna una puntuación de calidad ni se declara que el timeout remoto o Windows estén superados.

## F35.6 · Resultado Linux Mint y preparación Windows

La ejecución real de Linux Mint del 29-10-2026, 07:02:43–07:04:37 UTC, terminó con **11/11 etapas PASS y código global 0**. `docs/capturas/fase35/linux-mint-2026-10-29T07-02-43Z/exit-codes.tsv` registra Chrome, `npm ci`, build web, SHA-256, Preview, URL, smoke de producción, `game-systems`, 50 navegaciones, 20 con GC y WebGL. `game-systems.txt` confirma daño, muerte, «Reintentar», reinicio y desenlace; `webgl/resultado.json` registra pérdida y restauración del contexto, sin errores. El entorno usó Chrome 156 en `DISPLAY=:0`, `SANITY_HARDWARE=1`, `NoNewPrivs: 0` y `Seccomp: 0`.

Este resultado cierra la regresión de `game-systems` y la validación local de WebGL en esa máquina y ese build. La URL de GitHub Pages y el instalador Windows siguen pendientes. La preparación, descarga segura y aceptación nativa de Windows están en [FASE35_6_DISTRIBUCION_WINDOWS.md](FASE35_6_DISTRIBUCION_WINDOWS.md). El workflow ahora adjunta un manifiesto con commit, versiones, hashes de lockfiles, ASAR e instalador junto al EXE, sin publicar una release.
