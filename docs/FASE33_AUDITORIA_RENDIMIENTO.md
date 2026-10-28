# Fase 33 · auditoría de rendimiento

## Referencia comprobable anterior al cambio

`docs/capturas/fase30/benchmark-intel/resultados.json` registra Chromium 156 con ANGLE Intel HD Graphics 620, 1440 × 900, cuatro segundos por escena. Son muestras breves de QA aislado, no una campaña. Diez de doce casos terminaron PASS; Bajo en sala sencilla y vestíbulo falló porque la página o el navegador se cerraron. No se atribuye ese cierre a la GPU ni al juego sin una repetición.

| Escenario | Medio FPS / GPU mediana | Bajo FPS / GPU mediana |
|---|---:|---:|
| Menú | 23,66 / 30,17 ms | 47,62 / 9,88 ms |
| Sala sencilla | 33,24 / 18,41 ms | FAIL · página cerrada |
| Vestíbulo | 25,30 / 28,84 ms | FAIL · página cerrada |
| Escalera | 19,27 / 33,47 ms | 52,55 / 10,05 ms |
| Viuda | 22,88 / 28,81 ms | 54,54 / 8,05 ms |
| Cordura | 27,42 / 25,74 ms | 55,29 / 8,06 ms |

El caso de escalera en Medio registró 117 draw calls y la muestra de menú 135; los resultados contienen triángulos, CPU, memoria WebGL y p95 por escena. La muestra posterior comunicada por el usuario de **58,75 FPS en 600 fotogramas** corresponde a otro recorrido y no es una comparación equivalente.

## Diagnóstico del código

- `renderScale` limita DPR y píxeles; Bajo usa 0,8 y desactiva sombras, Medio usaba 1,0 con sombras 1024, Alto 1,25 con sombras 2048.
- `ShadowBudget` evita actualizar mapas de sombra si la pose está estable. `Atmosphere` sube el búfer de polvo a 15 Hz. Ambos sistemas ya reducen trabajo.
- Los seis conjuntos de mapas de superficies se comparten; el presupuesto declarado es 1,57 MiB. `World.dispose` libera geometrías y materiales; la regresión F33 cubre tres escenas.
- La diferencia Medio/Bajo incluye resolución, sombras y materiales normales; los datos no permiten adjudicar toda la pérdida a uno solo. GPU mediana de 28–33 ms en tres escenas Medio indica que reducir píxeles es un experimento razonable, no una mejora demostrada todavía.

## Comparación nativa posterior

F33 cambia la escala interna de Medio a **0,9**, conservando sombras, luces, niebla y geometría. A 1440 × 900 pasa de 1.296.000 a 1.049.760 píxeles internos: **19 % menos píxeles** por cálculo. La [medición nativa](capturas/fase33/benchmark-intel/resultados.json) registró las doce combinaciones de seis escenarios y dos perfiles, cuatro segundos por muestra, con renderer `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`.

| Escenario | Medio F33 FPS | Bajo F33 FPS |
|---|---:|---:|
| Menú | 23,52 | 50,81 |
| Sala sencilla | 40,43 | 59,53 |
| Vestíbulo | 29,02 | 59,03 |
| Escalera | 27,28 | 53,55 |
| Viuda | 29,02 | 48,57 |
| Cordura | 30,51 | 57,03 |

La comparación F30/F33 es orientativa: la versión, la variación entre ejecuciones y los dos cierres F30 impiden adjudicar la diferencia exclusivamente a la nueva escala. Medio sigue por debajo de 30 FPS medios en menú, vestíbulo, escalera y Viuda. La calidad visual necesita inspección humana. El intento en Codex quedó BLOCKED antes de abrir página: `docs/capturas/fase33/benchmark-sandbox/resultados.json`.
