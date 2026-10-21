# Fase 9 — Optimización, pulido cinematográfico y estabilidad

## Cambios integrados

- La cámara solo actualiza su matriz de proyección cuando cambia el campo de visión. Conserva la interpolación, la corrección contra obstáculos y los dos modos de cámara.
- El polvo mantiene su movimiento pero transfiere posiciones a GPU como máximo unas 15 veces por segundo. En el perfil Bajo conserva 32 partículas y ningún mapa de sombras dinámicas.
- El HUD evita modificar texto y estilos cuando el valor visible sigue igual. La señal de interacción también evita escrituras DOM repetidas.
- Roma (189) usa una profundidad cálida y una luz principal desplazada que refuerza la arquitectura; Francia (1348) usa niebla más húmeda y una luz de vela desplazada. La mansión (1927) conserva el contraste frío con luces cálidas locales. Los cambios usan las luces existentes y no añaden pases de posprocesado ni nuevas sombras.
- Se añadió `tests/phase9.test.ts` para verificar la identidad cromática de las tres épocas en Bajo, las sombras desactivadas, la actualización de proyección y la cadencia de transferencia del polvo.
- Se añadió `scripts/performance-phase9.mjs` y `npm run benchmark:phase9` para medir exploración, combate y sucesos psicológicos en las tres épocas.

## Auditoría y problemas detectados

- La escena ya agrupaba cajas rígidas por material, reutilizaba materiales de esas cajas, recortaba la resolución en Bajo y limitaba la actualización de sombras. Estos mecanismos se conservaron.
- La cámara recalculaba la proyección cada fotograma incluso con FOV constante.
- El atributo de posiciones del polvo se marcaba para subir a GPU en cada actualización.
- El HUD escribía valores y estilos en el DOM en cada actualización aunque no hubieran cambiado.
- La niebla tenía una sola paleta para todas las épocas, lo que reducía su identidad visual.
- En este sandbox, Chromium no arranca: Crashpad informa `setsockopt: Operation not permitted` y el proceso termina con `SIGTRAP`. Esto impide ejecutar las pruebas de navegador y medir FPS reales aquí. No hay resultados antes/después comparables ni evidencia para afirmar 45 FPS sostenidos en Intel HD 620.

## Medición reproducible en HP EliteBook 840 G4

Desde un terminal normal de Linux Mint, con Chrome instalado y aceleración gráfica activa:

```bash
git switch fase9/optimizacion-pulido
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

En otro terminal:

```bash
npm run benchmark:phase9 -- --url=http://127.0.0.1:5173/ --seconds=60 --headed --output=phase9-hd620.json
```

El script ejecuta nueve escenarios de 60 segundos cada uno en perfil Bajo y ventana de 1280 × 720. En exploración recorre cuatro direcciones; en combate ataca periódicamente; en el escenario psicológico carga cordura baja y espera el acontecimiento de cada época. El JSON registra GPU, FPS medio, mínimo observado, tiempos de fotograma p95/p99, duración, resolución interna y escala, draw calls, triángulos, recursos GPU y memoria JS cuando Chrome la expone. Compruebe que el campo `gpu` identifique la Intel HD 620 y que `errors` esté vacío. `scenarioValid` indica si la partida siguió activa y, en combate, si el enemigo estuvo presente al menos el 80 % de la medición. No use muestras inválidas para valorar el objetivo de rendimiento.

Para una comparación antes/después válida, ejecute el mismo script, duración, resolución, versión de Chrome, alimentación eléctrica y configuración de energía sobre un commit anterior y sobre esta rama. Realice varias pasadas y compare las nueve escenas por separado. La medición en modo headless puede comportarse de forma distinta a la partida visible; `--headed` es la opción recomendada para el portátil objetivo. El FPS mínimo observado corresponde al peor intervalo entre dos fotogramas y puede recoger una pausa del sistema operativo; consulte también p95 y p99. Un minuto por escenario aporta evidencia útil, pero no garantiza estabilidad durante una sesión completa.

## Verificaciones en este entorno

| Verificación | Resultado |
| --- | --- |
| `npm run format:check` | Superada |
| `npm test` | 39 archivos y 175 pruebas superadas, incluidas Fases 8 y 9 y pruebas de las tres épocas |
| `npm run build` | Superada |
| `npm run test:launcher` | Superada al repetirla de forma aislada; la primera ejecución concurrente falló en la comprobación de salida del lanzador |
| Navegador: smoke, sistemas, histórico, Fase 8, Fase 7 y Fase 2 (general, combate y cordura) | No ejecutables: Chromium termina con `SIGTRAP` antes de abrir una página |
| Medición local Fase 9 | No disponible: mismo fallo de Chromium |

## Limitaciones pendientes

- Confirmar las pruebas de navegador, guardado/carga, controles, transición de época, audio, menús y accesibilidad en un entorno donde Chromium pueda arrancar. Las pruebas unitarias existentes verifican parte de estos sistemas, pero no reemplazan la ejecución interactiva.
- Medir en Intel HD Graphics 620 real y revisar calidad visual y estabilidad durante sesiones largas. No se declara cumplido el objetivo de 45 FPS.
- El benchmark no fuerza artificialmente un combate largo: si el enemigo muere o la partida se pausa, el escenario queda marcado como inválido y debe repetirse o analizarse manualmente.
