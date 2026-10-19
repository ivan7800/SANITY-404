# Fase 5 — estabilidad, rendimiento y QA

## Alcance y arquitectura revisada

`src/main.ts` coordina el bucle de simulación, los cambios de sala, la interfaz y el renderizador. `src/world` construye las once salas y sus objetos; `src/systems` gestiona combate, progreso, cordura y partidas v1; `src/render` define calidad, iluminación, materiales y métricas. Se conservaron las tres épocas, la campaña de 1927, los finales y el formato de guardado v1.

## Hallazgos y correcciones

| Hallazgo                                                                                                                                                              | Corrección                                                                                                   | Regresión                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| La esquiva consultaba `combat.windup`, que representa el aviso del **enemigo**. Quedaba bloqueada justo antes del golpe rival.                                        | Consulta la animación ofensiva propia y el aturdimiento; el aviso enemigo permite esquivar.                  | `tests/phase4-5.test.ts` y prueba de mando virtual en Chromium. |
| Al recoger un objeto o registrar un descubrimiento se retiraba su malla de la escena sin liberar sus geometrías y materiales.                                         | `World.remove` libera los recursos del objeto una sola vez y conserva las texturas procedurales compartidas. | `tests/world.test.ts`.                                          |
| La búsqueda de interacción creaba un array y lo ordenaba en cada subpaso de simulación.                                                                               | Recorre los objetos una vez y compara distancias al cuadrado.                                                | `tests/world.test.ts` y suites de navegador.                    |
| Cada lámpara creaba una esfera permanentemente invisible y las apagadas creaban además una luz que no se añadía a la escena.                                          | Se omiten esas asignaciones.                                                                                 | Compilación y suites de escenas y navegador.                    |
| La prueba de Fase 1 intentaba cruzar una mesa con colisión real. La prueba del guardián ignoraba el coste de mantener la guardia.                                     | El recorrido de QA rodea la mesa; el combate de QA recupera resistencia y usa tónicos entre ventanas.        | `test:phase1` y `browser-phase2-combat.mjs`.                    |
| `npm audit` detectó tres avisos en las dependencias de desarrollo de Vitest 3.2.7, incluido [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9). | Vitest 4.1.11, versión corregida que pasó la suite completa; sin cambio en dependencias de producción.       | `npm audit --json`: cero avisos tras la actualización.          |

Las texturas procedurales permanecen cacheadas y compartidas durante la sesión; `World.remove` no las destruye al recoger un objeto. La actualización de Vitest fue un cambio mayor de herramienta de pruebas y se validó con todas las pruebas del proyecto.

## Método de medición

`node scripts/performance-phase5.mjs --runs=2 --frames=240` mide en cada ejecución una muestra de 240 intervalos `requestAnimationFrame` en la mansión (0), Roma (8), claustro (9) y scriptorium (10). `--combat` sitúa al personaje en `(0,0)`, espera a que el enemigo inicie un ataque y mantiene la defensa. Cada muestra usa un contexto nuevo de Chrome, viewport 1280 × 720, perfil **Baja**, imagen interna 1024 × 576 y volumen cero. Se registra el nombre de la GPU, FPS medios, tiempos de fotograma P95/P99, llamadas de dibujo, triángulos, recursos WebGL y heap JavaScript tras forzar recolección. Los datos crudos están en `capturas/fase5/`.

Equipo medido: **Intel HD Graphics 620 (KBL GT2)** mediante ANGLE/OpenGL 4.6. Las dos pasadas en reposo de cada sala quedaron en torno a 60 FPS, límite de sincronización de pantalla. Las muestras de combate después de los cambios fueron:

| Sala             | FPS medios por pasada | P95 de fotograma por pasada | Draw calls | Geometrías / texturas WebGL |
| ---------------- | --------------------: | --------------------------: | ---------: | --------------------------: |
| Mansión (0)      |         59,50 / 52,94 |              16,7 / 33,3 ms |         88 |                     99 / 14 |
| Roma (8)         |         59,75 / 60,00 |              16,7 / 16,8 ms |         92 |                     94 / 14 |
| Claustro (9)     |         59,51 / 59,51 |              16,8 / 16,8 ms |         83 |                     84 / 14 |
| Scriptorium (10) |         59,26 / 60,00 |              16,8 / 16,7 ms |         91 |                     92 / 14 |

La referencia anterior de combate, recogida con el mismo script antes de retirar las esferas invisibles y corregir la esquiva, dio 57,83–58,54 FPS en mansión, 56,70–59,75 en Roma, 59,51 en claustro y 59,26–59,75 en scriptorium. Las llamadas de dibujo y los recursos WebGL por sala permanecieron iguales: las esferas eliminadas nunca llegaban a subirse a la GPU. Las dos pasadas son insuficientes para atribuir a estos cambios una mejora de FPS; la variación de la mansión muestra precisamente ese límite. El script no mide toda la campaña ni sesiones térmicas largas. El heap tras GC ronda 14–16 MB en estas muestras aisladas; no equivale a una prueba de ausencia de fugas tras horas de juego.

## Verificación

- `npm ci`, `npm run format:check`, `npm test` (**71/71**), `npm run build` y `npm audit --json` (cero avisos).
- `npm run test:browser`: campaña original, guardado/carga, combate, finales y ajustes reducidos.
- `npm run test:phase1` con el lanzador local activo: locomoción, puzle, colisiones, combate y Gamepad API simulada.
- `node scripts/browser-phase2.mjs`, `browser-phase2-branch.mjs`, `browser-phase2-combat.mjs` y `browser-phase2-sanity.mjs`: rama de 1927, puzles, guardián, cordura y desenlaces.
- `node scripts/browser-historical.mjs`: presencia de las tres épocas, portales, puzles romano y medieval, artefactos, elección excluyente y persistencia tras recargar.
- `npm run test:launcher`: Node por PATH/NVM, arranque concurrente, puerto alternativo, identidad y cierre autenticado.
- `node scripts/production-smoke-phase17.mjs` contra `vite preview`: juego, HUD y canvas de producción en Chrome/HD 620; observador de desarrollo ausente.
- `node scripts/firefox-phase17.mjs`: WebGL 2, movimiento y dos modos de cámara en Firefox 158; cero errores de consola.

Las pruebas de los dos capítulos históricos parten de guardados de ensayo en puntos concretos. No constituyen una partida continua desde el inicio hasta ambos artefactos. Las pruebas físicas de mando, Windows/Edge, escucha de audio y estabilidad térmica prolongada siguen pendientes por falta de esos dispositivos o por requerir una sesión humana larga.
