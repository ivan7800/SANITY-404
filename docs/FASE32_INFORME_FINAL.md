# Fase 32 · informe provisional

**VEREDICTO: NO CERTIFICADA.** Se corrigieron dos defectos de guardado reproducidos, pero faltan las pruebas nativas F32 de recuperación, campaña, Viuda y sesión prolongada. No se declara GOLD MASTER.

`browser-smoke` tenía además una carrera reproducida en Linux Mint: aceptaba fotogramas del título antes de que `beginFromMenu` iniciara la partida. La espera ahora exige estado jugable y registra captura y diagnóstico si falla. La repetición nativa pasó ese tramo; no se modificó la lógica del juego.

La repetición nativa comunicada después superó `browser-smoke` y `browser-systems`; `browser-phase10` falló al buscar «Volver» tras restaurar WebGL. El menú actual muestra «Volver al juego» (`#resume`). La prueba ahora exige ese control, verifica la secuencia real de pérdida/restauración y guarda estado, árbol accesible, botones y captura si falla. **Este cambio todavía no se ha validado en Linux Mint.**

| Medida | Evidencia disponible |
|---|---|
| Defectos reproducidos y corregidos | 2: duplicados aceptados y salud cero cargable. Regresión roja conservada; casos dirigidos verdes. |
| Suite unitaria | 287/287 PASS en 64 archivos tras la corrección de `browser-smoke`. La regresión del fotograma 23 pasó. |
| Producción y estilo | `npm run build` PASS; `npm run format:check` PASS. |
| Geometría | `npm run audit:rooms` PASS: 29 salas, 418 rutas hipotéticas, cero inaccesibles. |
| Navegador F32 en Codex | BLOCKED antes de abrir página por crashpad EPERM/SIGTRAP; [traza inicial](capturas/fase32/chromium-launch.log), [browser-smoke](capturas/fase32/browser-smoke-sandbox.log) y [browser-phase10](capturas/fase32/browser-phase10-sandbox.log). Vite tampoco pudo abrir el puerto 5174 en este sandbox. |
| Navegador real comunicado | `browser-smoke` y `browser-systems` PASS; `browser-phase10` FAIL por espera de nombre obsoleto. Intel HD 620, 58,75 FPS medios en 600 muestras del escenario medido, cero errores JS. Repetición tras corrección PENDING. |
| Campaña completa y Viuda F32 | PENDING; sus PASS reales comunicados son anteriores a la corrección F32. |
| Interfaz F31 | 26/26 PASS, cero errores JS, salida 0 en Linux Mint según el usuario; no se repitió ni se modificó su diseño. |

Código F32: `src/systems/state.ts`, `scripts/browser-smoke.mjs`, `scripts/browser-phase10.mjs`, `tests/phase32-save-adversarial.test.ts`, `tests/phase32-progression-adversarial.test.ts`, `tests/phase32-browser-smoke-start.test.mjs` y `scripts/browser-phase32-saves.mjs`. El resto de modificaciones locales F30–F31 se conservó. Evidencia: [guardados rojo](capturas/fase32/guardados-regresion-roja.log), [verde](capturas/fase32/guardados-regresion-verde.log), auditoría geométrica y registro de lanzamiento Chrome. El [experimento de progreso](capturas/fase32/progreso-regresion-roja.log) se revirtió por incompatibilidad; no consta defecto de salto jugable. Los comandos exactos están en `FASE32_PLAN_PRUEBAS_NATIVAS.md`.

Siguiente decisión: ejecutar primero la prueba de guardados en contexto aislado, después rescate/navegador/Viuda y campaña completa. Si alguna prueba falla, registrar el estado y corregir la causa antes de cambiar el veredicto.
