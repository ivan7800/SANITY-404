# Fase 31 · QA y límites

## Pruebas locales

Con los cambios finales: `npm test -- --maxWorkers=1` **281/281 PASS** en 61 archivos; `npm run build` PASS; `npm run format:check` PASS; `npm run audit:rooms` **29 salas, 418 rutas, cero inaccesibles**; `git diff --check` PASS. Las regresiones dirigidas de pasos, escalera y aviso contextual pasan 9/9: colisión inmóvil, deslizamiento, 29 índices de sala, timbres representativos, una llamada de tono por paso, separación de escalera/galería y verbos de interacción. La primera suite completa detectó la pérdida del timbre de 63 Hz de la escalera; se restauró sin modificar la expectativa y la suite final pasó.

El bundle JS principal pasó de **268,07 kB / 93,97 kB gzip** en la compilación anterior de esta sesión a **269,30 kB / 94,46 kB gzip** tras F31. Es tamaño de descarga, **no FPS ni tiempo GPU**. EXP-01/02/03 no crean luces, geometría ni voces adicionales por paso. No se ha medido el coste real en Intel.

El lanzamiento de Chrome con las opciones del proyecto falló antes de abrir una página por `crashpad setsockopt EPERM` y `SIGTRAP`; [traza íntegra](capturas/fase31/chromium-launch.log). Por ello pruebas de navegador, escucha, capturas comparativas y benchmark F31 están **BLOCKED en Codex**, pendientes de Linux Mint.

## Repetición en Linux Mint

En un terminal, arrancar Vite sin cambio silencioso de puerto:

```bash
cd /ruta/al/repositorio/SANITY-404
npm run dev -- --port 5174 --strictPort
```

En otro terminal, con Intel HD Graphics 620 y Chromium real:

```bash
cd /ruta/al/repositorio/SANITY-404
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:phase26:widow:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ node scripts/browser-remaster.mjs --output-dir=docs/capturas/fase31/ui
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final --output-dir=docs/capturas/fase31/campana
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE30_OUTPUT=docs/capturas/fase31/benchmark-intel node scripts/benchmark-phase30.mjs
```

Escuchar con auriculares los pasos al caminar contra la pared, al deslizarse, al subir escaleras, al cruzar el rellano y en las salas 11, 16 y 28. Comparar perfiles Bajo/Medio en las mismas condiciones. El resultado de campaña completa y de Viuda comunicado por el usuario es anterior a F31; no se toma como prueba de esta revisión. Capturas, escucha y FPS de F31: **pendientes**.

El script de interfaz ahora llega físicamente a `save0`, comprueba que su aviso conserve el nombre, no duplique «guardar» y permanezca dentro de 1440×900, y toma una captura. Esa aserción **aún no se ha ejecutado**. Comprobar además en navegador una nota, un objeto, un portal bloqueado y una elección persistente, y revisar legibilidad a 390×844. La suite completa, compilación y formato volvieron a pasar tras este ajuste; la auditoría geométrica previa sigue siendo aplicable porque no se cambió geometría ni navegación.
