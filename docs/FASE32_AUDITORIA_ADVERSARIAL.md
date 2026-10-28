# Fase 32 · auditoría adversarial

Fecha: 28-10-2026. Rama: `fase11/campana-historica`. Se conservaron todos los cambios locales F30–F31. La interfaz F31 obtuvo **26/26 PASS en Linux Mint, cero errores JavaScript y salida 0**, según la ejecución real comunicada por el usuario; no se repitió ni se cambió su aspecto.

## Método y alcance demostrado

- Se inspeccionaron `parseSave`, `readSave`, `writeSave`, la migración v1, `validCampaign`, `validPhase2`, inventario, reinicio tras muerte, puertas e interacciones de `main.ts`.
- Se reprodujeron dos defectos de guardado mediante una [regresión roja](capturas/fase32/guardados-regresion-roja.log): duplicados y salud cero. La misma prueba pasó tras corregirlos ([salida verde](capturas/fase32/guardados-regresion-verde.log)). Un experimento de validación estricta del orden de capítulos se revirtió: sus [salidas roja](capturas/fase32/progreso-regresion-roja.log) y [verde temporal](capturas/fase32/progreso-regresion-verde.log) se conservan como historial, pero esa versión no es el código final. La restricción rompía pruebas de capítulos aislados y no demostraba una ruta jugable fuera de orden.
- La auditoría geométrica existente construye **29 escenas y 418 rutas de estados de campaña** con el motor de colisión. No es una partida real ni prueba sesiones prolongadas. Su informe es `RESCATE_SALAS_DATOS.json`.
- La campaña de doce capítulos y la Viuda pasaron en Linux Mint antes de F32, según el usuario. La validación nativa posterior a esta corrección sigue pendiente.
- Resultado final local: 287/287 unitarias, compilación, formato y auditoría de 29 salas/418 rutas PASS. `browser-smoke` tampoco arrancó en el sandbox por crashpad; la [traza íntegra](capturas/fase32/browser-smoke-sandbox.log) queda conservada para distinguir el bloqueo del entorno del fallo nativo de sincronización.

## Resultados por prioridad

| Prioridad | Resultado de F32 | Estado |
|---|---|---|
| Guardados corruptos, antiguos e incompletos | Duplicados y salud cero: reproducidos y corregidos. Migración v1 incompleta preservada en prueba. v2 sin campaña ya se rechaza. | Corrección unitaria dirigida PASS; navegador PENDING. |
| Softlocks 12 capítulos / 29 salas | 418 rutas hipotéticas, 10 tramos consecutivos, 23 destinos directos del script y 4 puertas con requisitos: sin inaccesibles en auditoría. | PASS geométrico; recorrido adversarial real PENDING. |
| Interacciones repetidas / fuera de orden | Código de nota, sello, objeto y puzles contiene guardas de duplicación. La apertura de portales se comprueba con regresión de escena; la manipulación de un guardado no demuestra un salto posible mediante controles normales. | Pulsaciones repetidas y orden real PENDING nativo. |
| Muerte, carga y recuperación | Un guardado con salud cero habilitaba Continuar y podía devolver inmediatamente a la muerte. Ahora se rechaza sin borrar el valor almacenado; la partida válida anterior no se sobrescribe. | Regresión PASS; flujo visual nativo PENDING. |
| Combate, Viuda, colisiones y cordura | Sin cambios de dificultad o IA. Viuda PASS comunicado para revisión previa; regresiones unitarias incluidas en la suite. | PENDING nativo tras F32. |
| Transiciones / persistencia | Auditoría estática y round trips de campaña incluidos en 418 rutas; guardados reales del recorrido anterior no son prueba de este árbol. | PENDING nativo. |
| Navegador y sesión prolongada | Chrome del sandbox termina antes de abrir página por `crashpad setsockopt EPERM`/`SIGTRAP`; [traza íntegra](capturas/fase32/chromium-launch.log). | BLOCKED local; Linux Mint PENDING. |

## Decisión técnica

### Browser-smoke y Nueva partida

La ejecución nativa comunicada mostró `draw.frame=23` con `started=false`, `paused=true`, `overlayHidden=false` y `titleTransitionClosed=true`. La espera `draw.frame>5` medía actividad del render del título, no el comienzo de la partida. El flujo de `beginFromMenu` cierra el telón y llama a `begin` tras 440 ms; `begin` pone `started=true` y `resume` oculta el overlay. Por tanto, el fallo se explica por una carrera de sincronización de `browser-smoke`, sin evidencia de defecto del juego. La espera corregida exige inicio, juego sin pausa, overlay oculto, telón abierto, sala 0, salud positiva, tiempo de partida avanzado y un fotograma posterior al del menú. Si expira en diez segundos, conserva JSON y captura en `docs/capturas/fase32/`. La regresión reproduce exactamente los valores observados en Linux Mint. La repetición nativa comunicada superó `browser-smoke`.

### Browser-phase10 y restauración WebGL

La siguiente ejecución nativa de `npm run test:browser` llegó a `browser-phase10` y falló buscando el botón exacto «Volver». El test lo busca tras `restoreContext()`, pero el manejador `webglcontextrestored` muestra `menu()`, cuyo control de reanudación es `#resume` «Volver al juego». Three.js cancela `webglcontextlost` para permitir la restauración; esto se verificó en el código instalado y coincide con la [especificación WebGL](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/). No se cambió el motor. La prueba corregida valida nombre, id, estado pausado, eventos de pérdida/restauración y reanudación física. Si el evento no llega o la pantalla es otra, guarda diagnóstico y captura. La corrección sigue pendiente de ejecución nativa.

Tras este cambio: 287/287 unitarias, compilación y formato PASS; `node --check scripts/browser-phase10.mjs` y `git diff --check` PASS. La ejecución local de la prueba de navegador terminó antes de abrir página por crashpad; [traza íntegra](capturas/fase32/browser-phase10-sandbox.log). El recorrido nativo anterior de `browser-smoke` y `browser-systems` obtuvo PASS, sin errores JavaScript; el usuario comunicó 58,75 FPS medios en 600 muestras con Intel HD 620 para el escenario medido.

### Guardados

Un estado con salud cero no puede ser creado por un guardado manual legítimo durante el juego normal: la muerte interrumpe la actualización antes de interactuar. Aceptarlo en `readSave` dejaba disponible «Continuar» y el botón «Reintentar» volvía a cargar ese mismo estado muerto. Rechazarlo protege el flujo sin conceder salud artificial ni modificar el valor local almacenado. Los duplicados de inventario, lecturas, recogidas y enemigos no se generan con las interacciones normales y pueden conceder recursos o progreso incoherente.

La compatibilidad v1 se mantiene: un guardado antiguo incompleto de sala 8 con 12 de salud y un tónico migra a v2 sin perder esos datos. La compatibilidad de otros guardados reales requiere la prueba nativa aislada preparada en `scripts/browser-phase32-saves.mjs`.
