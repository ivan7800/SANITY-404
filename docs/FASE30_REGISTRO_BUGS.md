# Fase 30 · registro de defectos

| ID | Gravedad | Estado | Reproducción, causa, corrección y regresión |
|---|---|---|---|
| F30-001 | Media · audio | Corregido, prueba automatizada PASS; escucha real PENDING | Ejecutar `Audio.silence(10,5)` y cambiar de sala en tiempo de audio 12. `setRoom` reiniciaba el temporizador lógico, pero no cancelaba la recuperación de ganancia programada para la sala anterior; el ambiente nuevo podía permanecer casi inaudible. Ahora cancela la automatización anterior y recupera el bus a ganancia 1. `tests/mansion-atmosphere.test.ts` verifica la envolvente. |
| F30-002 | Alta · partida bloqueada por datos corruptos | Corregido, prueba automatizada PASS | `phase2.steps[1]=3` sin `genealogy` en `solved` era aceptado por `parseSave`. `advancePuzzle` buscaba `order[3]`, inexistente, y toda respuesta era errónea. `validPhase2` ahora exige coherencia entre paso 3 y `solved`, y entre `astronomy` y su atajo. `tests/state.test.ts` falló antes del arreglo y pasa después. Las partidas válidas no cambian de esquema. |
| F30-003 | Alta · pérdida de guardado | Corregido, prueba automatizada PASS | `writeSave` devolvía éxito y sobrescribía un guardado cargable con un estado interno que `readSave` rechazaba después. `writeSave` valida el serializado antes de llamar a `localStorage.setItem`. `tests/save.test.ts` falló antes y pasa después; prueba que el valor anterior queda intacto. |
| F30-004 | Alta · Viuda | PENDING | La última ejecución Intel conocida mostró aparición, movimiento y golpe, pero la prueba de persecución falló por tres muestras iguales. La corrección del muestreo de F26 aún requiere repetición real. No se declara resuelto. |
| F30-005 | Alta · rendimiento Intel | BLOCKED | Benchmark F30: Chrome terminó antes de abrir página por `crashpad setsockopt EPERM` y `SIGTRAP`. [Traza original](capturas/fase30/benchmark-sandbox-crashpad.json). Doce casos preparados; falta ejecutar en Intel HD 620. |
| F30-006 | Alta · campaña actual | PENDING | La campaña de doce capítulos tiene una traza real anterior a las Fases 26–30, pero ningún recorrido completo con el árbol local actual. Repetir sin estados preparados. |

No hay defecto de juego inferido del bloqueo de Chrome. Ninguno de estos resultados acredita GOLD MASTER.
