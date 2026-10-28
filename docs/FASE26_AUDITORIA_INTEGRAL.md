# Fase 26 · auditoría adversarial integral

**Estado: abierta.** Rama `fase11/campana-historica`, HEAD inicial `3396c2b`. La Fase 25 consta en Git; los cambios previos sin relación (capturas de fases 22–25 y `RESCATE_SALAS_DATOS.json`) se conservaron. No se hizo commit ni push.

## Método y alcance real

Se inspeccionaron `main.ts`, `scene.ts`, colisiones, movimiento de mansión, combate, IA, cámara, entrada, persistencia, auditoría de salas y las actas de fases 24–25. La auditoría geométrica construyó las 29 escenas y recorrió 418 rutas con el motor físico. Se inspeccionó visualmente la captura del rellano de Fase 25. **No se realizó un recorrido visual nuevo de las 29 salas ni una partida completa en esta fase.**

| Sistema                                                | Comprobación de esta fase                                                                                                              | Resultado y límite                                                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Movimiento, escaleras e interacción                    | Reproducción de selección de `gallery-chart` antes de alcanzar la planta superior; nueva prueba unitaria y tramo de navegador añadido. | F26-001 corregido y validado en Linux Mint: 24/24 comprobaciones, sin errores JavaScript.                             |
| Colisiones y puertas                                   | `audit:rooms` construyó escenas y verificó destinos e interacciones de campaña.                                                        | 29 salas, 418 rutas, cero inaccesibles en simulación. No demuestra ausencia de clipping o puertas durante juego real. |
| IA y combate                                           | Reproducción del atasco de la Viuda, desvío físico, descenso y retroceso; cámara evaluada geométricamente.                             | F26-002 corregido y verificado en motor; navegador real y combate manual pendientes.                                  |
| Salud, cordura, inventario, puzles, guardado y finales | Revisión de rutas principales en código y suite existente; no se modificaron sus reglas.                                               | 260 pruebas unitarias aprobadas. No hubo nueva certificación de campaña ni finales.                                   |
| Menús, teclado, táctil y audio                         | Inspección de entrada y flujo de pausa; suite existente.                                                                               | Sin fallo nuevo reproducido. No hubo prueba táctil ni auditiva nueva en navegador real.                               |
| Rendimiento                                            | Se comparó el alcance de las métricas de Fase 25 con el objetivo de 30 FPS en Bajo.                                                    | No hay benchmark nuevo de Intel HD 620; F26-004 pendiente.                                                            |

## Salas: estado de inspección

`G` significa que la auditoría geométrica de esta ejecución no detectó una ruta inaccesible. `V` exige captura actual con cámara normal y revisión humana; `J` exige recorrido y mecánicas jugadas. Ninguna sala obtiene V o J nuevos por una simulación.

| Sala | Escenario                   |  G   | V / J nuevos                                     | Prioridad de revisión                  |
| ---: | --------------------------- | :--: | ------------------------------------------------ | -------------------------------------- |
|    0 | Mansión Veyr                | PASS | Pendientes; captura previa del rellano examinada | Alta: escalera, carta, Viuda, cámara   |
|    1 | Biblioteca prohibida        | PASS | Pendientes                                       | Alta: estanterías y sello              |
|    2 | Cripta de los nombres       | PASS | Pendientes                                       | Media                                  |
|    3 | Capilla del silencio        | PASS | Pendientes                                       | Media                                  |
|    4 | Ruinas del intervalo        | PASS | Pendientes                                       | Media                                  |
|    5 | Archivo familiar            | PASS | Pendientes                                       | Alta: mobiliario, genealogía           |
|    6 | Invernadero de vidrio negro | PASS | Pendientes                                       | Media                                  |
|    7 | Sótanos de la vigilia       | PASS | Pendientes                                       | Media                                  |
|    8 | Santuario de los nombres    | PASS | Pendientes                                       | Alta: combate romano                   |
|    9 | Claustro de la ceniza       | PASS | Pendientes                                       | Media                                  |
|   10 | Scriptorium del silencio    | PASS | Pendientes                                       | Alta: obstáculos entre pistas          |
|   11 | Taller de los rostros       | PASS | Pendientes                                       | Media                                  |
|   12 | Horno de las teselas        | PASS | Pendientes                                       | Media                                  |
|   13 | Muelle de los nombres       | PASS | Pendientes                                       | Media                                  |
|   14 | Archivo de la marea         | PASS | Pendientes                                       | Media                                  |
|   15 | Terraza del astro ausente   | PASS | Pendientes                                       | Media                                  |
|   16 | Cúpula de las tres horas    | PASS | Pendientes                                       | Media                                  |
|   17 | Cantera de los nombres      | PASS | Pendientes                                       | Media                                  |
|   18 | Cámara del arco             | PASS | Pendientes                                       | Media                                  |
|   19 | Hospital del camino         | PASS | Pendientes                                       | Media                                  |
|   20 | Enfermería de los nombres   | PASS | Pendientes                                       | Media                                  |
|   21 | Imprenta de frontera        | PASS | Pendientes                                       | Media                                  |
|   22 | Sala de las planchas        | PASS | Pendientes                                       | Media                                  |
|   23 | Casa Veyr de 1610           | PASS | Pendientes                                       | Media                                  |
|   24 | Galería de retratos         | PASS | Pendientes                                       | Media                                  |
|   25 | Teatro de autómatas         | PASS | Pendientes                                       | Media                                  |
|   26 | Tramoya de las voces        | PASS | Pendientes                                       | Media                                  |
|   27 | Archivo fotográfico         | PASS | Pendientes                                       | Alta: supervivencia con pocos recursos |
|   28 | Cuarto de revelado          | PASS | Pendientes                                       | Media                                  |

## Corrección implementada

La planta superior empieza lógicamente al entrar en el descansillo. Antes, la selección de objetos usaba `player.position.y > 1.4`: en el último tramo de la escalera, el cuerpo ya estaba alto pero `state.floor` seguía en 0. `World.nearest` elegía `gallery-chart` y los obstáculos superiores desde `(5,3, -4,95)`. Ahora `main.ts` pasa la planta lógica explícita y `World.nearest` conserva la altura para la línea de visión. La prueba unitaria falló antes y pasó después. La prueba de escalera añade una parada real antes del desembarco y exige que no se seleccione la carta; conserva el paso y la interacción después de llegar al rellano.

## Verificación ejecutada

| Prueba                                  | Resultado                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test -- --maxWorkers=1`            | **PASS: 54 archivos, 260/260 pruebas**                                                                                                                                   |
| `npm run build`                         | **PASS**                                                                                                                                                                 |
| `npm run format:check`                  | **PASS**                                                                                                                                                                 |
| `git diff --check`                      | **PASS**                                                                                                                                                                 |
| `npm run audit:rooms`                   | **PASS: 29 salas, 418 rutas, cero inaccesibles**. El informe preexistente `RESCATE_SALAS_DATOS.json` se respaldó y restauró para no sobrescribir cambios locales ajenos. |
| `test:mansion:stair:browser` en sandbox | **No iniciado**: Chromium falló antes de crear página por `crashpad setsockopt EPERM` / `SIGTRAP`. Sin resultado jugable.                                                |

Con Vite en el puerto 5174, repetir en el terminal normal de Linux Mint:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_MANSION_STAIR_OUTPUT=docs/capturas/fase26/escalera-linux-mint npm run test:mansion:stair:browser
```

La ejecución debe registrar el paso nuevo «La carta del rellano no se selecciona desde otra planta», la interacción posterior con la carta, la subida y la bajada; guardar `recorrido.json` y `fallo.png` si falla. Los resultados 22/22 de Fase 25 pertenecen a la versión anterior del script.

Para una referencia reproducible de rendimiento del vestíbulo en **perfil Bajo** y Chromium con GPU física, el benchmark existente admite escenarios separados. Son estados aislados de medición, no certificación de campaña; exige una sesión gráfica X11 y Vite en el mismo puerto:

```bash
mkdir -p docs/capturas/fase26
node scripts/performance-phase10.mjs --url=http://127.0.0.1:5174/ --only=1927:exploration --seconds=60 --headed --hardware --min-fps=30 --output=docs/capturas/fase26/vestibulo-rendimiento.json
node scripts/performance-phase10.mjs --url=http://127.0.0.1:5174/ --only=1927:combat --seconds=60 --headed --hardware --min-fps=30 --output=docs/capturas/fase26/combate-rendimiento.json
```

El benchmark debe completarse y declarar Intel antes de interpretar FPS, p95 de fotograma o tiempos de GPU. Todavía falta una medición equivalente durante escalera y galería con movimiento real.

## Continuación del 28-10-2026 · Viuda del rellano

La regresión con `World(0)` y los obstáculos superiores reales reprodujo el atasco desde `(5,9, -6,2)`: la Viuda se detenía alrededor de x=5,05, frente al atril, sin llegar a un objetivo al oeste. El atril no se retiró ni se redujo su colisionador. Su caja ocupa aproximadamente x=3,99–4,71 y z=-6,33…-5,87; con el radio del actor de 0,34 m, hay que bordear su extremo sur.

`src/systems/actor-path.ts` calcula un desvío corto en cuadrícula de 0,2 m y comprueba cada celda y tramo con las reglas físicas compartidas y `upperWalkable`. La IA solo calcula esa ruta cuando el avance directo se bloquea, con un intervalo mínimo de un segundo entre intentos. Los puntos se recorren mediante `mansionMove`, que valida colisionadores de ambas plantas. Se corrigió también el retroceso de combate: antes podía bajar a y=0 a una Viuda golpeada hacia la galería; la prueba falló con esa caída y ahora conserva y=2,64. No cambian salud, daño, alcance, velocidad, atril ni decisiones de campaña.

La prueba aislada de persecución hacia `(2,4, -5,8)` verifica la capacidad del motor para rodear el atril, pero **esa posición no mantiene activa a la Viuda en una partida normal**: el sistema cambia al Huésped en la galería occidental. Otra regresión comprueba por separado un objetivo en la zona activa de la Viuda, `(3,8, -5,2)`, y que combate sin atravesar el atril. La cámara de combate mantiene ambos centros proyectados dentro del encuadre en esa posición; la prueba geométrica no descarta oclusión visual de las siluetas.

| Comprobación posterior                                      | Resultado                                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/phase26-widow-navigation.test.ts`                    | **5/5 PASS**: desvío, encuentro activo, escalera, retroceso y encuadre geométrico.                                                                                                                                                 |
| `npm test -- --maxWorkers=1`                                | **265/265 PASS, 55 archivos**. Una regresión de compatibilidad en `mansion-threats.test.ts` apareció en la primera pasada y fue corregida; 16/16 pruebas dirigidas antiguas y nuevas pasaron antes de repetir la suite completa.   |
| `npm run build`, `npm run format:check`, `git diff --check` | **PASS** tras la corrección del motor.                                                                                                                                                                                             |
| `npm run audit:rooms`                                       | **PASS**, 29 salas y 418 rutas, cero inaccesibles. El JSON previo se restauró después de la ejecución.                                                                                                                             |
| Navegador aislado de la Viuda en sandbox                    | **No iniciado**: tras corregir un import de Node detectado al preparar el script, Chrome terminó antes de crear la página por `crashpad setsockopt EPERM` / `SIGTRAP`. Registro local: `/tmp/sanity-phase26-widow/recorrido.json`. |

Con Vite en `127.0.0.1:5174`, ejecutar en Linux Mint:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_PHASE26_WIDOW_OUTPUT=docs/capturas/fase26/viuda-linux-mint npm run test:phase26:widow:browser
```

La prueba abre un estado **aislado de QA** en la planta superior, fija la posición inicial del jugador y deja que la Viuda se mueva y ataque mediante el motor normal. Registra muestras de posición y colisión, errores JavaScript, renderizador y capturas antes/después. No certifica el combate manual, la campaña ni FPS. El recorrido físico de escalera ya fue validado; la persecución y una inspección visual dinámica de la cámara siguen pendientes de Linux Mint.

## Ejecución real en Linux Mint · sincronización de la Viuda

El [recorrido de escalera](capturas/fase26/escalera-linux-mint/recorrido.json) terminó con `completed: true`, **24/24 comprobaciones PASS**, 17 tramos, cero errores JavaScript y salida 0. Incluyó la nueva comprobación de que la carta astral no puede seleccionarse desde otra planta.

El [primer recorrido de la Viuda](capturas/fase26/viuda-linux-mint/recorrido.json) usó Chromium con `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)` y falló antes de medir la persecución: `shade !== widow`. La aserción leía `sanityInspect()` en el mismo `page.evaluate` que llamaba `openRoom(0, 1)` y situaba al jugador en `(3,8, -5,2)`. `loadRoom()` crea primero la sombra; el ciclo posterior llama a `syncMansionThreat()`. La propia instantánea de fallo, tomada después de ese ciclo, muestra ya `combat.kind: widow`, `aiState: chase`, enemigo visible en `(5,88, 2,64, -6,19)`, y 100 PS del jugador. La [captura del fallo](capturas/fase26/viuda-linux-mint/fallo.png) muestra a la Viuda. Esta evidencia respalda una carrera del test, **no un fallo demostrado en la regla de aparición**.

El script espera ahora una condición observable: sala 0, planta 1, regla esperada `widow`, enemigo seleccionado `widow`, `combat.kind: widow`, identificador `mansion-widow`, visibilidad y juego activo. Registra tipo, identificador, nombre, posición, jugador, pausa y fotograma antes y después de sincronizar; si la espera vence, conserva el estado real. La aserción estricta permanece. `sanityInspect()` expone estos campos solo para diagnóstico y la prueba de `mansionThreatAt` cubre `(3,8, -5,2)`. Los archivos previos se archivan antes de repetir la prueba, para no perder la traza fallida.

La repetición con esta corrección **todavía no se ha ejecutado en Linux Mint**. El intento con Vite en 5175 dentro del sandbox terminó con código 1 antes de crear página por `crashpad setsockopt EPERM` / `SIGTRAP`; traza: `/tmp/sanity-phase26-widow-sync/recorrido.json`. Por tanto, la persecución, las colisiones observadas en navegador y la cámara durante combate siguen pendientes de certificación real.

## Tres prioridades siguientes

1. Repetir la prueba aislada de la Viuda en Linux Mint y revisar sus capturas con la cámara normal.
2. Jugar manualmente el combate de la Viuda en el rellano y evaluar oclusiones, defensa y daño antes de cerrar F26-002 y F26-003.
3. Medir el perfil Bajo en Intel HD 620 durante vestíbulo, escalera, galería y combate; después priorizar el cuello de botella demostrado.

**GOLD MASTER no certificado.** La Fase 26 sigue abierta: las correcciones de gravedad alta necesitan navegador real y falta inspección jugable y visual amplia.

## Continuación · muestras físicas y rendimiento de la Viuda, 28-10-2026

La [segunda traza real](capturas/fase26/viuda-linux-mint/recorrido.json) confirma `widow`/`mansion-widow`, movimiento de 0,396 m desde la sincronización, golpe real de 17 PS y estado final `recover`. El test guardó solo **3 muestras frente a 6 requeridas**; sus posiciones idénticas corresponden al intervalo posterior a la aproximación. La captura previa y el intervalo de 100 ms se ejecutaban antes de comenzar el registro físico. Se sustituyó por muestreo en cada `requestAnimationFrame`, iniciado inmediatamente después de situar al jugador. El informe incluye fases de IA, jugador, Viuda, distancias, ruta, colisión y errores por muestra. Se mantienen y refuerzan las aserciones físicas. La prueba determinista de `phase26-widow-navigation.test.ts` verifica el desvío completo alrededor del atril con los colisionadores reales; la repetición de navegador y el combate manual siguen pendientes. En el encuentro normal, alejar al jugador hasta el extremo occidental cambia legítimamente el tipo de amenaza, de modo que la prueba aislada del motor y la prueba de encuentro activo cubren condiciones distintas.

La traza breve midió 12,71 FPS, fotograma mediano 50 ms, GPU mediana 29,16 ms, GPU p95 74,02 ms, 117 llamadas de dibujo y 80 786 triángulos en **Medio, 1440 × 900, sombras activas**. Son solo 36 muestras de rendimiento e incluyen inicio del escenario; no hay atribución causal. Se añadió `benchmark:phase26:widow`: dos navegadores limpios, mismo encuentro y ventana de 1440 × 900, perfiles Medio y Bajo, cuatro segundos por defecto, con FPS calculados de fotogramas reales y el diagnóstico CPU/GPU del motor. El perfil Bajo reduce resolución interna y apaga sombras según `qualityProfile`; el informe registra la resolución efectiva. Una prueba que termine tras morir o pierda la Viuda se marca inválida. La duración breve evita que la muerte cambie la carga de combate, pero deberá repetirse y ampliarse si los datos muestran alta variabilidad. La memoria reportada es la de recursos WebGL; no equivale a memoria total del proceso.

**Verificación de esta continuación:** `npm test -- --maxWorkers=1` **265/265 PASS**, `npm run build` PASS, `npm run format:check` PASS, `npm run audit:rooms` **29 salas, 418 rutas, cero inaccesibles**. El JSON preexistente de auditoría fue restaurado tras la ejecución. El navegador del sandbox no creó página: Chrome salió con `crashpad setsockopt EPERM`/`SIGTRAP`; no hay nueva certificación física ni FPS comparativos de Intel.

Con Vite en el puerto 5174, ejecutar en el terminal gráfico de Linux Mint:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_PHASE26_WIDOW_OUTPUT=docs/capturas/fase26/viuda-linux-mint npm run test:phase26:widow:browser
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_PHASE26_BENCHMARK_OUTPUT=docs/capturas/fase26/viuda-benchmark-intel.json npm run benchmark:phase26:widow
```

Revisar `recorrido.json`, `antes.png`, `despues.png` o `fallo.png`, y la comparación Medio/Bajo antes de decidir si F26-002, F26-003 y F26-004 pueden cerrarse. **GOLD MASTER no certificado.**
