# Fase 30 · rendimiento reproducible

## Referencia histórica y ausencia de medición nueva

La traza anterior de Viuda en Intel HD Graphics 620 registró **12,71 FPS medios**, fotograma mediano **50 ms**, GPU mediana **29,16 ms**, GPU p95 **74,02 ms**, **117 draw calls** y **80 786 triángulos** en Medio, 1440 × 900, durante solo 36 muestras. No describe el rendimiento general ni demuestra un cuello de botella único. F30 todavía no tiene FPS nuevos: Chromium del sandbox murió antes de abrir página.

## Benchmark F30

`scripts/benchmark-phase30.mjs` y el plan puro `phase30-benchmark-plan.mjs` preparan **12 muestras**: menú, sala sencilla, vestíbulo, escalera, Viuda y manifestación de cordura, cada una en Medio y Bajo. Ventana 1440 × 900; duración predeterminada 4 s, configurable entre 2 y 15 s. Cada caso usa contexto de navegador nuevo y registra GPU detectada, resolución interna, perfil, duración real, número de fotogramas, FPS medio y percentil bajo 1 %, mediana y p95 de fotograma, tiempos CPU/GPU disponibles, draw calls, triángulos, memoria WebGL, salud, entidad, errores y captura. El escenario de cordura usa `setSanity` y cámara de **QA aislado**; no es una partida de campaña. El informe registra `effectFrames` para distinguir una manifestación activa de su recuperación. `renderer.info.memory` no mide toda la memoria del proceso.

`node scripts/benchmark-phase30.mjs --describe` y `tests/phase30-benchmark.test.mjs` comprueban los seis escenarios, los dos perfiles, la duración, resolución, doce casos previstos, filtros válidos y los doce estados BLOCKED si Chrome no inicia. **No prueban FPS.** Un caso en el que el personaje muere, la Viuda deja de estar activa, no aparece el efecto o hay errores JS termina FAIL. Si el renderizador no identifica Intel bajo `SANITY_HARDWARE=1`, el caso se bloquea.

El intento de sandbox usó un servidor que pasó automáticamente de 5174 a 5175 por puerto ocupado. Se detuvo ese servidor. Un segundo arranque con `--strictPort` terminó con `Port 5174 is already in use`; `curl` a 5174 devolvió conexión rechazada y el sandbox no permitió identificar el ocupante. La [traza íntegra inicial](capturas/fase30/benchmark-sandbox-crashpad.json) conserva las líneas de Chrome: `crashpad ... setsockopt: Operation not permitted (1)` y `SIGTRAP`. Medio y Bajo quedaron BLOCKED antes de toda muestra. En próximos intentos, Vite debe abrir exactamente 5174 con `--strictPort`; nunca reutilizar otro puerto silenciosamente.

## Ejecución Intel en Linux Mint

Terminal 1:

```bash
cd /home/ivan/Proyectos/SANITY-404-FASE11
npm run dev -- --port 5174 --strictPort
```

Terminal 2:

```bash
cd /home/ivan/Proyectos/SANITY-404-FASE11
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE30_OUTPUT=docs/capturas/fase30/benchmark-intel node scripts/benchmark-phase30.mjs
```

El resultado solo será interpretable si los doce casos terminan con estado PASS, GPU Intel y condiciones equivalentes. Si aparece una caída de FPS, repetir el caso con `SANITY_PHASE30_SCENARIOS=...` y medir antes de optimizar luces, sombras o resolución. No se afirma el umbral de 30 FPS en Bajo.
