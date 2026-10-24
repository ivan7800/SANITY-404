# Fase 18 — Optimización y correcciones

Fecha: 24 de octubre de 2026. Rama `fase11/campana-historica`. El informe registra el estado local al cerrar la fase, antes de la publicación conjunta de las fases 17, 18 y 18.1. Base de incidencias: [auditoría de fase 17](FASE17_AUDITORIA.md).

## Veredicto

**A17-01 sigue abierto y el criterio de aceptación no se cumple en todas las muestras válidas.** Las seis muestras nuevas a **881 × 793** (canvas **704 × 634**) pasaron 45 FPS en cada ventana de 60 fotogramas. Un segundo método ejecutó el juego dentro de un iframe de **1280 × 720** (canvas **1024 × 576**) en la Intel HD 620: la muestra de combate terminó viva con una peor ventana de **42,37 FPS**. El iframe está parcialmente recortado por la ventana exterior de 881 × 793, de modo que tampoco sustituye una ejecución independiente a 1280 × 720 ni permite atribuir la diferencia al código. La escalera y el jefe agotaron la salud durante su muestra y no se consideran aprobados. No se rebajó la calidad gráfica ni se desactivaron efectos para obtener estas cifras.

Se corrigieron los encuadres observados de las dos salas superiores y del jefe, la disposición del HUD a 480 × 320 y los avisos de error de guardado automático. El recorrido y el combate volvieron a pasar en el navegador Intel. [Retratos](capturas/fase18/fase18-retratos.png), [observatorio](capturas/fase18/fase18-observatorio.png), [jefe](capturas/fase18/fase18-jefe.png) y [HUD de 480 × 320](capturas/fase18/fase18-hud-480x320.png) son capturas reales tras los cambios.

## Perfil y diagnóstico de A17-01

El escenario superior de fase 17 dio **40,45** y **42,86 FPS** en su peor ventana de 60 fotogramas, en dos muestras de 600 intervalos a 1280 × 720. [Datos originales](capturas/fase17/auditoria/mediciones.json) y [repetición](capturas/fase17/auditoria/medicion-planta-superior.json).

La calidad Baja medida desactiva las sombras en `qualityProfile`; por tanto, actualizar mapas de sombras no explica esa caída. En la muestra nueva a 881 × 793 de planta superior hubo 72 llamadas de dibujo y 55.470 triángulos, menos que en combate (124 y 72.908). Las superficies comparten 18 mapas de 128 × 128 y el polvo solo sube posiciones a la GPU a 15 Hz. No aparece una explosión de geometría, materiales, luces ni trabajo de simulación al entrar arriba. A 881 × 793, el P95 de actualización superior fue **1,5 ms**, el de envío/render CPU **5,9 ms** y el de temporizador GPU **11,4 ms**. En el iframe a 1280 × 720, combate tuvo P95 de **1,1 ms** de actualización, **10,0 ms** de render CPU y **13,3 ms** de GPU, con 200 de 600 intervalos por encima de 25 ms. La presión de render/composición cerca del plazo de vsync es la **causa probable** de los saltos, aunque este perfil no separa GPU, controlador y compositor lo suficiente para confirmarlo. Por eso no se hizo una reducción indiscriminada de efectos ni una optimización especulativa.

Se añadió el tiempo de actualización a `FrameMetrics` para separar CPU de render y GPU en las próximas mediciones. La cámara evita planos en los que puerta o enemigo llenaban casi todo el encuadre; su efecto sobre rendimiento a 1280 × 720 sigue sin medir.

| Escenario | Fase 17, 1280 × 720: media / peor ventana 60 FPS | Fase 18, 881 × 793: media / peor ventana 60 FPS | P95 GPU fase 18, ms |
| --- | ---: | ---: | ---: |
| Exploración | 59,90 / 59,01 | 60,02 / 60,02 | 10,2 |
| Combate | 56,16 / 52,94 | 57,35 / 52,19 | 11,9 |
| Escalera | 54,80 / 51,43 | 58,56 / 56,26 | 11,8 |
| Planta superior | 52,56 / **40,45** | 59,73 / 58,08 | 11,4 |
| Cordura baja | 59,61 / 58,07 | 59,53 / 55,41 | 10,7 |
| Jefe | 54,96 / 46,75 | 59,53 / 57,16 | 11,1 |

[Datos brutos finales: 600 intervalos por escenario](capturas/fase18/fase18-mediciones-final-881x793.json). Se calentaron 100 fotogramas y se calculó cada ventana móvil de 60 intervalos; el renderer WebGL informó `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`. Se conserva una [muestra intermedia](capturas/fase18/fase18-mediciones-881x793.json) para distinguirla del código final. Las escenas son breves y mayormente estáticas; la salud al final de cada muestra y los tiempos CPU/GPU figuran en los JSON.

La [medición adicional con iframe de 1280 × 720](capturas/fase18/fase18-mediciones-iframe-1280x720.json) usó el mismo renderer Intel y canvas interno que fase 17, calentó 100 fotogramas y registró 600 intervalos por escenario. El iframe se recortó en la ventana exterior; esta es una comprobación de carga a la resolución interna, no una comparación pareada de ventana. La columna «válida» exige salud positiva y partida sin pausa al terminar.

| Escenario | Media FPS | Peor ventana 60 FPS | Salud final | Válida |
| --- | ---: | ---: | ---: | --- |
| Exploración | 60,02 | 60,02 | 100 | Sí |
| Combate | 44,96 | **42,37** | 4 | **Sí; incumple** |
| Escalera | 45,53 | 34,30 | 0 | No: terminó en pantalla de muerte |
| Planta superior | 50,80 | 46,77 | 40 | Sí; margen estrecho |
| Cordura baja | 58,18 | 46,17 | 46 | Sí; margen estrecho |
| Jefe | 50,09 | 46,77 | 0 | No: terminó en animación de muerte |

La [repetición aislada de combate](capturas/fase18/fase18-combate-iframe-repeticion.json) dio 41,44 FPS de media y 32,16 FPS en la peor ventana, pero llegó a salud cero y solo se conserva como diagnóstico, no como segunda muestra válida. El combate con teclado que venció al jefe se informa aparte y no se confunde con la muestra estática de rendimiento.

## Correcciones y comprobaciones

| Incidencia | Cambio | Evidencia y estado |
| --- | --- | --- |
| A17-01 · P1 | Perfil por fase de fotograma y dos tamaños de canvas; sin recorte gráfico no justificado. | **Abierto**: combate incumple 45 FPS en un iframe de canvas 1024 × 576; faltan la medición independiente comparable y el aislamiento de GPU/controlador/compositor. |
| A17-02 · P2 | Cámara detrás del vano en pasillo, posiciones distintas dentro de retratos y observatorio, encuadre del jefe desde el corredor; dos pistas existentes se situaron en los muebles laterales, dentro del radio de interacción. | Las [capturas anteriores](capturas/fase17/auditoria/recorrido-retratos.png) y [del jefe](capturas/fase17/auditoria/jefe.png) se contrastaron con las tres capturas nuevas. El jefe y ambas pistas se ven desde las posiciones ensayadas; la cámara no necesitó corrección por colisión (`cameraCorrected=false`). **Resuelto en esos puntos**; no se inspeccionaron todos los ángulos en movimiento. |
| A17-03 · P2 | HUD compacto para ancho ≤600 y alto ≤400, tipografía de ayuda de 11 px, vitales condensados, objetivo y aviso separados; paneles de menú desplazables. | Captura real de iframe a **480 × 320**: salud, cordura, resistencia, objetivo, ayuda y escena se muestran sin solapamiento en la posición ensayada. En Opciones, el panel tenía 525 px de contenido y 304 px visibles; al enfocar el botón final se desplazó 221 px y quedó dentro de pantalla. **Resuelto en 480 × 320**; no se probó lector de pantalla ni zoom extremo. |
| A17-04 · P2 | Todos los guardados automáticos de `main.ts` comprueban `writeSave` y muestran el fallo después de cualquier aviso síncrono del mismo evento. El guardado manual conserva su confirmación específica. | Revisión de llamadas y guardado/carga real correcto. **Corregido en código**; no se forzó una cuota de `localStorage` en navegador. |

La navegación física entre plantas se conservó. Con eventos de teclado enviados a los listeners del juego: partida en planta 0 `(5, -1,5)`, subida a planta 1, retratos, observatorio, recogida de ambos documentos, guardado en `(1,94144, -5,77356)`, recarga en esas coordenadas y descenso a planta 0. Las puertas abiertas de ambas salas se cruzaron. En otro encuentro se observaron las fases **1, 2 y 3** de la Raíz, cuatro golpes efectivos y victoria con **18 de salud**; la consola solo mostró mensajes de conexión de Vite. [Traza de recorrido y combate](capturas/fase18/recorrido-navegador.json). Los eventos inyectados usan los listeners reales del juego, pero no acreditan tacto de mando físico o teclado humano.

## Pruebas y límites de ejecución

- `npm test -- --maxWorkers=2 --testTimeout=15000`: **175/175**, 37 archivos: las 174 pruebas existentes más una regresión de pasillo superior. Se actualizaron además las aserciones del encuadre del jefe.
- `npm run build`: TypeScript estricto y Vite correctos; JS del juego 234,43 kB y Three 525,11 kB sin comprimir.
- `npm run format:check`: correcto.
- `git diff --check`: correcto.

El Chrome lanzado desde `scripts/audit-phase18.mjs` terminó con `SIGTRAP` en este entorno aislado; Firefox headless terminó con `SIGSEGV`. El navegador Chrome DevTools conectado sí ejecutó WebGL en Intel HD 620. Su operación de cambiar tamaño pidió una aprobación que la política del entorno no permite, por lo que no se obtuvo una **ventana exterior independiente** de 1280 × 720. Para medir el tamaño interno se usó [el marco de auditoría con iframe](../audit-iframe-harness.html), un iframe 1280 × 720 servido por Vite dentro de la ventana disponible. El recorte externo y la composición del iframe son diferencias materiales respecto a fase 17. Tampoco pudieron repetirse `npm run test:browser` ni los tres scripts Playwright de ruta, jefe y medición desde esta sesión. Las comprobaciones alternativas descritas arriba se hicieron en el navegador Intel y se guardaron por separado.

## Reproducción pendiente en el equipo de fase 17

En la raíz del repositorio, con Chrome en `/usr/bin/google-chrome`, WebGL Intel y `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` en marcha:

```bash
npm test -- --maxWorkers=2 --testTimeout=15000
npm run build
npm run format:check
node scripts/audit-phase18.mjs
node scripts/audit-phase18.mjs --only=planta-superior
node scripts/audit-route-phase18.mjs
node scripts/audit-boss-phase18.mjs
```

`audit-phase18.mjs` exige que el renderer contenga `Intel` y `620`, usa 1280 × 720, calidad Baja, 100 fotogramas de calentamiento y 600 intervalos por escenario. Escribe en `docs/capturas/fase18/intel-1280x720/`, sin sobrescribir la auditoría original. Para reproducir el método de iframe, abrir `/audit-harness.html` con el mismo servidor, sembrar cada guardado del arreglo `scenarios` de `audit-phase18.mjs` en `localStorage`, recargar el iframe y tomar 100 + 600 intervalos de `requestAnimationFrame` en `iframe.contentWindow`. La aceptación exige **cada** peor ventana de 60 fotogramas ≥45 FPS, comparación visual y recorridos sin regresiones. El fallo válido de combate debe investigarse con una ejecución independiente y perfil GPU/compositor antes de cambiar calidad o geometría.

## Puntuación y pendientes

| Área | Fase 17 | Fase 18 | Motivo |
| --- | ---: | ---: | --- |
| Técnica y guardados | 8,5 | 8,7 | 175 pruebas finales; avisos de autoguardado corregidos, verificación de cuota pendiente. |
| Jugabilidad y progresión | 8,2 | 8,5 | Dos plantas, documentos, guardado/carga y jefe repetidos. |
| Enemigos | 8,0 | 8,1 | Jefe verificado; otros comportamientos visuales siguen parcialmente cubiertos. |
| Visual 3D | 6,8 | 7,8 | Pistas y jefe visibles en los encuadres ensayados; quedan ángulos no inspeccionados. |
| Rendimiento Intel HD 620 | 7,0 | 6,8 | Combate falla una ventana válida a canvas 1024 × 576 en iframe; el P1 original no está cerrado. |
| Accesibilidad y UX | 6,8 | 7,6 | HUD compacto comprobado a 480 × 320; lector de pantalla y zoom extremo pendientes. |

**Puntuación global orientativa: 7,8/10**, condicionada por A17-01. No equivale a certificación ni autoriza declarar 9,5/10 o 45 FPS sostenidos a la resolución objetivo. Permanecen pendientes la medición independiente a 1280 × 720, el diagnóstico y corrección del tramo lento de combate, una inspección visual en movimiento de más ángulos superiores, una prueba prolongada de estabilidad y la verificación de accesibilidad asistida.
