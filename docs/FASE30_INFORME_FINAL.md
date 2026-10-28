# Fase 30 · informe de continuidad

## Veredicto

**NO-GO. Fase 30 en curso. GOLD MASTER no certificado.** La compilación y las regresiones disponibles pasan, pero faltan la campaña actual, la persecución real de la Viuda, la inspección visual y las mediciones Intel equivalentes.

**Actualización 28-10, F30-007:** la campaña real volvió a fallar al iniciar Nueva partida porque el script interpretó un fotograma del menú como juego activo y luego esperó un selector inexistente. El personaje permaneció en `(0,5)` mientras una sombra lo mataba. La carrera está corregida en el script y la regresión unitaria pasa; la nueva ejecución de campaña en Linux Mint está pendiente. Véanse la [traza original](capturas/fase30/campana/campana-completa-trace.json) y el diagnóstico en `FASE30_AUDITORIA_INTEGRAL.md`.

## Resultado cuantitativo

| Medida | Resultado actual |
|---|---|
| Capítulos certificados tras cambios F26–F30 | 0/12; hay antecedente real anterior de 12/12 y final histórico. |
| Salas verificadas geométricamente | 29/29; inspección visual actual 0/29. |
| Rutas estáticas de auditoría | 418/418; no se confunden con movimiento de navegador. |
| Bugs F30 corregidos | 3: transición de audio, guardado de puzle imposible, sobrescritura de guardado cargable. |
| Bugs/riesgos altos abiertos | Viuda real, rendimiento Intel, repetición de campaña completa. |
| FPS F30 | Sin medición: Chrome bloqueado antes de página. |

Pruebas finales con el código F30: `npm test -- --maxWorkers=1` **277/277 PASS** en 58 archivos; `npm run build` PASS; `npm run format:check` PASS; `npm run audit:rooms` **29 salas, 418 rutas, cero inaccesibles**; `git diff --check` PASS. El bundle de producción no contiene `sanityQa`, `sanityInspect`, `sanityBenchmarkState` ni `setSanity`; sus recursos usan la base `/SANITY-404/`. El intento de benchmark del sandbox tiene salida 1 por `crashpad EPERM`/`SIGTRAP`; [evidencia íntegra](capturas/fase30/benchmark-sandbox-crashpad.json). El arranque Vite con `--strictPort` también falló porque 5174 figuraba ocupado; no se cambió automáticamente de puerto.

Tras F30-007: `npm test -- --maxWorkers=1` **278/278 PASS** en 59 archivos; compilación, formato y auditoría de 29 salas/418 rutas PASS. El lanzamiento local de Chrome con las opciones exactas del script volvió a fallar antes de abrir página por `crashpad setsockopt EPERM` y `SIGTRAP`; no hay nueva evidencia de FPS ni campaña completa.

## Comandos pendientes para Linux Mint

Primero, en un terminal dedicado, confirmar que el puerto está libre y arrancar Vite **sin cambio automático**:

```bash
cd /ruta/al/repositorio/SANITY-404
npm run dev -- --port 5174 --strictPort
```

En otro terminal, con la página abierta en ese puerto:

```bash
cd /ruta/al/repositorio/SANITY-404
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE26_WIDOW_OUTPUT=docs/capturas/fase30/viuda-intel npm run test:phase26:widow:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE30_OUTPUT=docs/capturas/fase30/benchmark-intel node scripts/benchmark-phase30.mjs
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final --output-dir=docs/capturas/fase30/campana
```

La última orden es la única certificación de campaña continua. Usa Nueva partida, controles reales, guardados y recargas; no debe ejecutarse con un guardado preparado. Cada resultado debe conservar su JSON, capturas, código de salida y renderizador. El final anticipado requiere otra prueba específica.
