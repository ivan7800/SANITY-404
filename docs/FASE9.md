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

## Corrección del benchmark (21 de octubre de 2026)

La muestra anterior de `phase9-performance.json` usó Chrome 155 instalado mediante Playwright en modo headless. Los nueve identificadores WebGL son `ANGLE ... SwiftShader Device (Subzero)`, así que sus 2,2–3,2 FPS son **renderizado por software** y no sirven para valorar la Intel HD 620. Playwright 1.64.1 no estaba usando su Chromium descargado: el script anterior fijaba `/usr/bin/google-chrome` (versión 155.0.8059.84); el ejecutable que anuncia `chromium.executablePath()` bajo `~/.cache/ms-playwright/chromium-1248/` no está instalado en este entorno. El Chrome visible y `glxinfo -B` detectan Mesa Intel HD Graphics 620, controlador Mesa 25.2.8. La diferencia decisiva fue la modalidad de lanzamiento y el backend WebGL efectivo, no una diferencia de versión entre dos ejecutables que se hubieran medido.

El script corregido abre Chrome visible con `--headed`, solicita el sandbox de Chromium y elimina el flag `--enable-unsafe-swiftshader` que Playwright añade por defecto. No fuerza `--ignore-gpu-blocklist`, `--disable-web-security` ni cambia la calidad del juego. Lee el identificador WebGL 2 sin máscara y clasifica SwiftShader, llvmpipe, lavapipe y otros renderizadores de software. En modo visible exige una GPU física reconocible **antes** de medir FPS; si la GPU es software o desconocida, deja una fila `rejected` en el JSON y termina con error. El modo headless sigue disponible para pruebas funcionales y se etiqueta como software o desconocido cuando corresponda. `--playwright-chromium` permite comparar el binario descargado de Playwright si está instalado; por defecto se usa Chrome instalado.

La validación anterior comparaba el tiempo del juego con el reloj real, aunque el bucle del juego limita cada intervalo a 200 ms. Por eso, en SwiftShader, 60 s reales produjeron solo 15–39 s de juego y las nueve filas fallaron. Ahora se compara el tiempo del juego con la suma de intervalos limitados; en hardware se exige además al menos el 90 % del reloj real. Se registran pausas o muertes durante toda la muestra, cambios de sala, eventos psicológicos y proporción de fotogramas con el enemigo visible y en actividad. El combate usa movimiento defensivo y tónicos del inventario cuando la salud baja de 65; se registra `tonicsUsed`. Una muerte o un combate inactivo invalida la muestra. El proceso sale con error si cualquiera de las nueve filas es inválida. La medición conserva exploración, combate y evento psicológico en 1927, 189 y 1348.

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

Antes de medir, compruebe `glxinfo -B` y `google-chrome --version` en la misma sesión X11. El script ejecuta nueve escenarios de 60 segundos cada uno en perfil Bajo y ventana de 1280 × 720. El JSON registra versión y ruta de Chrome, renderer y vendor WebGL, clase de GPU, FPS medio, mínimo instantáneo y peor bloque móvil de 60 fotogramas, tiempos de fotograma p50/p95/p99, duración, tiempo del juego, resolución interna y escala, draw calls, triángulos, recursos GPU y memoria JS cuando Chrome la expone. Confirme `gpuType: "physical"`, renderer Intel, `scenarioValid: true` y `errors: []` en las nueve filas. El proceso devuelve código distinto de cero ante rechazo o invalidez. Las salidas de muestra en `/tmp` o `phase9-hd620.json` no se versionan automáticamente.

### Medición visible en Intel HD 620

Se realizaron dos pasadas de 60 s por escenario con Chrome 155.0.8059.84 visible en X11, ANGLE/OpenGL sobre Mesa Intel HD Graphics 620 (KBL GT2), Mesa 25.2.8, viewport 1280 × 720 y canvas 1024 × 576 en calidad Baja. La [segunda pasada completa](capturas/fase9/hardware-60s.json) conserva datos por fila. Las nueve filas tienen `gpuType: physical`, `scenarioValid: true`, `errors: []`, tiempo de juego próximo a 60 s y los eventos psicológicos exigidos. En combate se consumieron 9, 5 y 8 tónicos respectivamente; el enemigo estuvo visible y activo durante toda la muestra.

| Época | Escenario | FPS medio | Peor bloque de 60 frames | FPS mínimo instantáneo | P95 / P99 (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| 1927 | Exploración | 60,01 | 59,03 | 30,03 | 16,7 / 16,8 |
| 1927 | Combate | 57,76 | 50,02 | 29,85 | 16,8 / 33,4 |
| 1927 | Psicológico | 59,19 | **37,91** | 8,57 | 16,7 / 16,8 |
| 189 | Exploración | 60,02 | 60,01 | 59,52 | 16,7 / 16,8 |
| 189 | Combate | 59,96 | 59,03 | 29,94 | 16,7 / 16,8 |
| 189 | Psicológico | 59,99 | 59,03 | 29,94 | 16,7 / 16,8 |
| 1348 | Exploración | 59,79 | 48,67 | 29,94 | 16,7 / 16,8 |
| 1348 | Combate | 59,89 | 58,08 | 29,94 | 16,7 / 16,8 |
| 1348 | Psicológico | 59,99 | 59,03 | 29,94 | 16,7 / 16,8 |

El peor bloque de 60 intervalos equivale aproximadamente a un segundo de juego a 60 Hz. **No se cumple todavía el objetivo de 45 FPS en todos los bloques medidos**: el evento psicológico de 1927 cayó a 37,91 FPS en un bloque. El FPS mínimo instantáneo describe un único intervalo, no la tasa sostenida. La [primera pasada aislada](capturas/fase9/hardware-60s-first.json), sin métrica móvil, dio 57,31–60,02 FPS medios y confirmó las nueve filas válidas; una muestra inicial de 10 s coincidió con build y tests y mostró valores menores en 189, por lo que no se usa como comparación de rendimiento. Dos minutos por escenario en total siguen sin representar sesiones de varias horas, estados térmicos distintos o todas las rutas de la campaña.

Para una comparación antes/después válida, ejecute el mismo script, duración, resolución, versión de Chrome, alimentación eléctrica y configuración de energía sobre un commit anterior y sobre esta rama. Realice varias pasadas y compare las nueve escenas por separado. El FPS mínimo observado corresponde al peor intervalo entre dos fotogramas y puede recoger una pausa del sistema operativo; consulte también p95 y p99. Un minuto por escenario aporta evidencia útil, pero no garantiza estabilidad durante una sesión completa.

## Verificaciones en este entorno

| Verificación | Resultado |
| --- | --- |
| `npm run format:check` | Superada |
| `npm test` | 40 archivos y 178 pruebas superadas, incluidas las nuevas pruebas del benchmark |
| `npm run build` | Superada |
| `npm run test:launcher` | Superada en esta revisión |
| `npm run test:browser` | Superada fuera del sandbox: campaña, guardado, puzles, muerte, reintento, desenlaces y sistemas, sin errores JavaScript |
| Medición local Fase 9 | Dos pasadas visibles completas con Intel HD 620; nueve escenarios válidos en ambas. La segunda está archivada arriba. Dentro del sandbox Chrome sigue terminando con `SIGTRAP` en Crashpad. |

## Limitaciones pendientes

- Repetir audio, controles físicos, menús y accesibilidad con revisión humana. Las pruebas de navegador cubren la campaña y sistemas automatizables, pero no reemplazan esa revisión.
- Investigar el bloque de 37,91 FPS durante el evento psicológico de 1927 y revisar calidad visual y estabilidad durante sesiones largas. No se declara cumplido el objetivo de 45 FPS sostenidos para los nueve escenarios.
- El benchmark no fuerza artificialmente un combate largo: si el enemigo muere o la partida se pausa, el escenario queda marcado como inválido y debe repetirse o analizarse manualmente.
