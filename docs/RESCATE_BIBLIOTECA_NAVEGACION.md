# Biblioteca: navegación alrededor de `seal1`

**Estado (26-10-2026):** corrección y regresiones implementadas. La ruta corregida sigue pendiente de ejecución válida en Linux Mint. SANITY-404 permanece **NO APTO PARA PUBLICACIÓN**.

## Evidencia y causa

La ejecución real comunicada de Linux Mint con `SANITY_HARDWARE=1` registró 59,04 FPS, GPU mediana de 7,00 ms y `test:rescue:browser` PASS. `test:browser` falló en la biblioteca desde `(-0,81, -3,78149)` hacia `(0, -6)` con `RouteBlocked: ruta repetida`.

El colisionador de `seal1` mide aproximadamente `0,95 × 0,70 m` y está centrado en `(0, -4,5)`. Con el radio físico del jugador de `0,34 m`, ocupa `|x| < 0,815` y `-5,19 < z < -3,81`. El jugador está libre en la posición registrada, pero avanzar directamente hacia el sur golpea el sello. A* genera primero un desvío a `x=-0,9`, a solo `0,09 m` del origen; ese segmento es transitable. El controlador Playwright omitía todo desplazamiento de menos de `0,1 m`, continuaba hacia el sur y repetía una ruta que nunca había ejecutado correctamente. La causa es la ejecución de los waypoints, no la geometría del sello ni el rendimiento medido en Linux Mint.

## Cambios

- El controlador camina cada eje hasta cruzar la coordenada del waypoint. Ya no considera completados los desvíos cortos por una tolerancia de 10 cm.
- `sanityInspect()` expone el identificador del objeto seleccionado. `browser-smoke` espera y comprueba ese identificador antes de cada pulsación de E, incluida la puerta `next` de la biblioteca.
- La regresión unitaria reproduce la posición exacta, confirma el choque frontal, simula pasos físicos a 59,04 FPS alrededor del sello y comprueba que en `(0,-6)` se selecciona `next`.
- El diagnóstico de navegador en modo QA coloca al actor en la posición reportada, intenta avanzar contra el sello y luego lo rodea con WASD. Este posicionamiento solo existe en QA; la prueba de campaña sigue empezando desde Nueva partida. Las futuras trazas QA se guardan con nombre único para conservar fallos anteriores.

## Verificación actual

| Prueba | Resultado |
| --- | --- |
| `npm test` | PASS: 43 archivos, 214 pruebas. |
| `npm run build` | PASS: TypeScript y Vite. |
| `npm run format:check` | PASS. |
| `test:rescue:browser` en sandbox | Chrome abortó al iniciar: `crashpad setsockopt EPERM` / `SIGTRAP`. No llegó al juego. |
| `test:browser` en sandbox | Llegó a Nueva partida, pero Chromium usó ANGLE/Vulkan SwiftShader con 2,82 FPS. El personaje murió durante el primer trayecto del vestíbulo, antes de la biblioteca. No valida esta corrección. |

Para repetir ambas pruebas en el terminal normal de Linux Mint con Vite en el puerto 5174:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:rescue:browser && SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:browser
```

La prueba aislada debe registrar `libraryRoute.selected: "next"`, conservar `seal1` y terminar con cero errores JavaScript. La prueba completa debe atravesar la biblioteca y terminar con código 0. Aún no hay evidencia de ese resultado con el código corregido.
