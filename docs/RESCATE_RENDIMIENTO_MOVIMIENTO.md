# Rescate: movimiento del vestíbulo y rendimiento WebGL

**Fecha:** 26 de octubre de 2026. **Estado:** corrección implementada; navegador y campaña pendientes de nueva ejecución válida. El juego permanece **NO APTO PARA PUBLICACIÓN**.

## Evidencia recibida de Linux Mint

| Prueba | Resultado |
| --- | --- |
| `test:rescue:browser` anterior | PASS comunicado: 29 salas abiertas en QA, 6 choques físicos, cero errores JavaScript. Es diagnóstico aislado, no campaña desde Nueva partida. |
| `test:browser` anterior | FAIL en vestíbulo, `x=-1,1475`, `z=4,46`, siguiente waypoint `x=-3,5`; 45 s de espera. |
| Renderizado de esa ejecución | 3,53 FPS medios; GPU mediana 258,82 ms y P95 297,05 ms. |

## Causa del bloqueo

El colisionador real de `save0` está centrado en `(-2, 5)` y mide aproximadamente `0,95 × 0,70 m`. Con el radio del jugador `0,34 m`, la zona bloqueada se extiende hasta `x=-1,185` y `z=4,31` por el lado de aproximación. A `(-1,1475, 4,46)` el jugador está libre, pero el segmento hacia `x=-3,5` cruza el escritorio. **El motor bloqueó correctamente el movimiento.**

La prueba calculaba una ruta al comienzo y caminaba los waypoints sin validar el siguiente segmento desde la posición real después de cada pulsación. Su espera de 45 s confundía un tramo físicamente obstruido con movimiento lento. Una regresión reproduce exactamente la posición y confirma que el segmento directo está bloqueado, mientras A* encuentra un rodeo hacia `z≈4,1`.

Una ejecución posterior dentro del sandbox encontró además un error de tolerancia **en la nueva protección del test**. Después del guardado, el jugador quedó en `x=-1,183866923,z=5`, aproximadamente 1 mm fuera de `save0`. A* asignó correctamente el radio físico `0,34 m` al primer tramo, pero el guardia de ejecución usó `0,345 m` y declaró bloqueado el propio punto de partida. La ruta se repetía sin movimiento. El guardia usa ahora el menor valor entre su margen y el radio asignado por el planificador; la regresión exacta demuestra que `0,345 m` rechaza ese punto y `0,34 m` permite el tramo legítimo.

## Rendimiento y deltaTime

La versión anterior de `browser-smoke.mjs` lanzaba Chrome con `--use-angle=swiftshader`, por lo que **forzaba renderizado WebGL por software** incluso en un ordenador con Intel HD Graphics 620. Los 258,82 ms de GPU de esa ejecución no sirven para atribuir un defecto de GPU al juego sobre hardware real. El bucle del juego limitaba cada fotograma a `0,2 s`; a 3,53 FPS transcurren unos `0,283 s`, de modo que la simulación avanzaba al **70,6 % del tiempo real**. Eso ralentizaba el desplazamiento, pero no explica una detención completa de 45 s ante el escritorio.

La prueba estándar ya no fuerza SwiftShader. `SANITY_HARDWARE=1` abre Chrome visible con la GPU del escritorio; `SANITY_SOFTWARE=1` mantiene una opción explícita para reproducir renderizado por software. `browser-smoke.mjs` registra ahora el renderer WebGL, los dispositivos y estados de GPU comunicados por CDP cuando estén disponibles, además de FPS y tiempos de GPU del juego. En el sandbox, Chrome eligió **ANGLE/Vulkan SwiftShader** incluso sin forzarlo: CDP informó `gpu_compositing: disabled_software`, `webgl: unavailable_software`; la ejecución registró **2,78 FPS medios** y 316,6 ms de mediana de fotograma. El temporizador GPU no estuvo disponible. Esa medición tampoco representa la Intel HD Graphics 620. **Aún no hay una nueva medición válida en la GPU física con este código.**

El límite de deltaTime subió a `0,35 s` para cubrir los `0,283 s` observados; se mantienen subpasos máximos de `0,025 s` en `update` y barridos de colisión de `0,08 m`. Una interrupción de pestaña o GPU mayor de `0,35 s` sigue acotada para evitar saltos peligrosos. A 3,53 FPS, jugador, enemigos y combate avanzan ahora según el tiempo real del fotograma.

## Correcciones y regresión

`browser-smoke.mjs` comprueba cada waypoint con la geometría actual antes de pulsar una dirección. Observa el movimiento por fotograma, detecta cuatro fotogramas seguidos sin avance, suelta la tecla y replantea A* desde la posición real. Conserva un límite de seis replanteamientos para detectar bucles. La comprobación final admite `0,35 m` para destinos libres, acorde con el radio físico del jugador; las interacciones con objetos sólidos conservan el radio legítimo de interacción. Un fallo imprime la ruta, la posición, el objeto que obstaculiza, el estado y las métricas.

La prueba unitaria cubre el segmento exacto `(-1,1475,4,46) → (-3,5,4,46)`, el rodeo válido, el punto de 1 mm junto a `save0`, el movimiento real a 3,53 FPS y las opciones de lanzamiento de Chrome. `browser-rescue.mjs` incorpora además una reproducción rápida **solo QA** que coloca al actor en esa posición libre, camina primero hacia el norte y luego hacia el oeste con controles normales y comprueba la posición final. Esa prueba de diagnóstico no modifica una partida normal ni acredita campaña.

## Validación pendiente

Las nuevas regresiones unitarias pasan. El navegador del sandbox reprodujo el rechazo incorrecto de `0,345 m` y registró la GPU por software. Tras corregir ese último error, nuevos intentos de `test:browser` y `test:rescue:browser` terminaron antes de cargar la página con `crashpad setsockopt EPERM`/`SIGTRAP`; Vite también recibió `listen EPERM` en una sesión aislada. La corrección final de navegador **requiere ejecución en Linux Mint**. Ejecutar con Vite activo en el puerto 5173:

```bash
SANITY_HARDWARE=1 npm run test:browser
SANITY_HARDWARE=1 npm run test:rescue:browser
```

Conservar el JSON y el renderer WebGL impresos por la prueba. Si Chrome informa SwiftShader o llvmpipe, esa ejecución no mide la Intel HD Graphics 620. El resultado de publicación permanece **NO APTO** hasta superar la batería y la campaña real completa.
