# Fase 22 — Certificación integral de campaña

**Fecha:** 25 de octubre de 2026. **Rama:** `fase11/campana-historica`. **Base publicada:** `28d6b02`. **Dictamen:** **NO APTO PARA VERSIÓN 1.0; campaña histórica integral no certificada.** No se ha modificado `main` ni se ha hecho commit, merge, push o despliegue.

## 1. Alcance y criterio de evidencia

Esta fase exige una única partida originada en **Nueva partida**, con los once capítulos históricos terminados en orden, combates ganados, puzles resueltos, artefactos recogidos y guardados/recargas legítimos antes del final histórico de 1927. Una prueba unitaria, un guardado preparado o un ataque que baja la salud de un enemigo no acredita una victoria ni una transición jugada. Se leyeron `FASE20_AUDITORIA_INTEGRAL.md`, `FASE21_CAMPANA_COMPLETA.md`, `FASE21_1_RENDIMIENTO_QA.md` y `CAMPANA-12.md` antes de probar.

El resultado de esta fase es **parcial**. `npm run test:browser` completó la **ruta corta limpia** de Élise desde Nueva partida hasta el final anticipado. Una ejecución posterior de `scripts/phase22-start-probe.mjs` desde un terminal normal de Linux Mint completó **Lucius** desde Nueva partida y abrió Aurelia. La traza válida se conserva en [`lucius-certificado-linux-mint.json`](capturas/fase22/lucius-certificado-linux-mint.json): `completed: true`, 42/42 checks, cero errores JavaScript y salida 0 comunicada por el usuario. La nueva opción acumulativa de Lucius+Aurelia aún no tiene ejecución válida; tampoco hay una partida completa del final histórico. Las pruebas dirigidas de Fase 21.1 con guardados preparados conservan su valor limitado y no se suman a estas rutas limpias.

## 2. Matriz de doce capítulos

**Leyenda:** `—` = sin medición o evidencia de esta fase; `no` = criterio sin acreditar en partida continua. La columna de recorrido exige entrada, introducción, exploración y salida reales. La recarga de 1927 corresponde solo al tramo inicial de la ruta corta, no al capítulo histórico completo. La duración de Lucius es tiempo de automatización, no tiempo humano.

| # | Investigación | Recorrido integral | Documentos y pistas | Puzle completado jugando | Enemigo derrotado | Artefacto | Salida, guardado y recarga | Siguiente desbloqueado | Duración real | Estado F22 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lucius · 189 | Entrada, introducción, exploración y salida sí | Documento 8 y tres testimonios leídos | Inscripción resuelta, Marca de Varro | Sí · `enemy8`, de 115 a −35 PS | Tablilla obtenida | Regreso, autoguardado y recarga sí | Aurelia · portal a sala 11 | 31,1 s entrada→regreso; 39,7 s prueba total | **Certificado en Linux Mint** |
| 2 | Aurelia · 312 | No | — | No | No · custodio de mosaico | No · molde | No | No acreditado · Maeve | — | Sin certificar |
| 3 | Maeve · 537 | No | — | No | No · custodio ahogado | No · lista | No | No acreditado · Samira | — | Sin certificar |
| 4 | Samira · 783 | No | — | No | No · vigilante ciego | No · disco | No | No acreditado · Idris | — | Sin certificar |
| 5 | Idris · 1092 | No | — | No | No · obrero petrificado | No · plano | No | No acreditado · Oona | — | Sin certificar |
| 6 | Oona · 1217 | No | — | No | No · custodio de salas | No · cuaderno | No | No acreditado · Isabelle | — | Sin certificar |
| 7 | Isabelle · 1348 | No | — | No | No · copista de peste | No · códice | No | No acreditado · Tomás | — | Sin certificar |
| 8 | Tomás · 1491 | No | — | No | No · tipógrafo | No · plancha | No | No acreditado · Inés | — | Sin certificar |
| 9 | Inés · 1610 | No | — | No | No · retrato guardián | No · acta | No | No acreditado · Amara | — | Sin certificar |
| 10 | Amara · 1786 | No | — | No | No · autómata | No · partitura | No | No acreditado · Émile | — | Sin certificar |
| 11 | Émile · 1899 | No | — | No | No · sombra de revelado | No · placa | No | No acreditado · Élise | — | Sin certificar |
| 12 | Élise · 1927 | Parcial · 00–04 | Carta inicial leída; resto — | Caja y tres sellos, ruta corta | No se exigió ni acreditó victoria | Llave y medallón, ruta corta | Un guardado y una recarga al inicio; salida anticipada sí | Final histórico no acreditado | — | Parcial, sin certificar |

**Combates históricos ganados en esta fase: 1/11 acreditados.** El centurión cayó por ataques reales; la traza contiene defensas, daño, resistencia y `enemy8` persistente. **Puzles históricos completados: 1/11. Artefactos históricos obtenidos: 1/11. Recargas históricas por capítulo: 1/11.** Los otros diez capítulos carecen de duración medida y permanecen sin certificar.

## 3. Recorrido continuo y finales

La traza textual de `npm run test:browser` dio diez hitos `PASS` en `browser-smoke.mjs`, incluidos «WebGL y nueva partida», «Movimiento e interacción de guardado», «Carga de partida», «Documento y diario», «Puzle de la mansión y medallón», «Tres puzles, cripta, capilla y acceso a ruinas» y «Ruta corta y final anticipado explícito». Terminó con `errors: []`. Esta es evidencia de **un final anticipado** desde el menú real; no es evidencia del final histórico después de las once investigaciones. Los otros dos scripts de la batería prueban sistemas mediante estados preparados y pérdida/recuperación de WebGL, respectivamente.

El código de `historicalEndingReadiness` exige las once marcas `campaign.completed`, los once artefactos, `Memoria reconciliada`, el descubrimiento `adrien` y una elección persistente entre Lucius e Isabelle. `offerEnding` solo presenta «Cerrar con las pruebas» cuando esa función devuelve `ready`; el final anticipado se ofrece por separado. Las pruebas unitarias y las pruebas dirigidas anteriores cubren condiciones aisladas, pero **la exigencia y el desenlace histórico no se comprobaron jugando la secuencia en esta fase**. Por ello no se declara validado el final histórico. Lucius tiene duración automatizada medida; los otros once capítulos y la campaña total aún no.

## 4. Bloqueo de navegador y reproducción

1. En el sandbox de QA, Chrome 156 salió **antes de crear la página** con `third_party/crashpad/crashpad/util/linux/socket.cc:45 setsockopt: Operation not permitted (1)` y `SIGTRAP`. Se probó tanto el lanzamiento headless heredado de la batería estándar como el perfil headed `chromiumSandbox: true` de Fase 21.1; ambos fallaron antes de navegar. Reintentos posteriores reprodujeron el mismo fallo. Es un límite de este entorno, no una refutación de la ejecución válida de Lucius en Linux Mint.
2. Un intento con Firefox del sistema mediante Playwright terminó al iniciar con `SIGSEGV`, también antes de cargar el juego. No constituye un defecto demostrado de SANITY-404.
3. El conector Chrome DevTools sí navegó al menú de `127.0.0.1:5174` y mostró el botón «Nueva partida». Su revisión automática **rechazó el clic** con `MCP tool call requires approval, but approval policy is never`. No se utilizó `evaluate_script` ni otra inyección para eludir esa decisión. Esta política impide continuar la partida mediante ese conector en la sesión actual.
4. En contraste, `npm run test:browser` sí lanzó Chrome y terminó la ruta corta limpia. En Linux Mint, la [traza de inicio](capturas/fase22/trace.json) y la [captura de entrada](capturas/fase22/roman-enter.png) muestran la entrada romana. La ejecución completa posterior queda en [la traza certificada de Lucius](capturas/fase22/lucius-certificado-linux-mint.json): documento 8, `roman-formation`, tres `roman-echo-*`, ataques y defensas, `enemy8` derrotado, inscripción, tablilla, regreso, guardado, recarga y `mosaic-portal` destino 11. El fallo de lanzamiento del sandbox es intermitente y no prueba un defecto del juego.

La versión de Fase 22.2 de `scripts/phase22-start-probe.mjs` conserva el modo Lucius por defecto y añade `--through=aurelia`. Comparte funciones de navegación, interacción, combate, puzle, transición, captura y carga. Registra cada condición como `PASS`/`FAIL`, captura estados y devuelve código distinto de cero ante fallo. Lee `window.sanityInspect`, `window.sanityRoomAudit` y el guardado solo para verificar; no modifica `localStorage` ni prepara enemigos. La espera de entrada romana ahora comprueba `state.room === 8` antes de evaluarla, para evitar el falso fallo de transición comunicado por el usuario. **La ruta acumulativa nueva aún no ha pasado una ejecución de navegador**; sus checks de Aurelia son procedimiento listo para ejecutar, no evidencia de éxito.

### Fase 22.2 · procedimiento para el terminal normal de Linux Mint

Desde la raíz de esta rama, iniciar Vite en un terminal normal y ejecutar la prueba en otro:

```bash
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

```bash
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/
```

El comando anterior sigue comprobando solo Lucius. Para la campaña acumulativa:

```bash
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=aurelia
```

El script usa Chrome con pantalla y sandbox de Chromium. Cada ejecución acumulativa reescribe [`lucius-aurelia-trace.json`](capturas/fase22/lucius-aurelia-trace.json) y las capturas `acumulativa-*.png`, sin sobrescribir `lucius-certificado-linux-mint.json`. La traza anterior de bloqueo se preservó aparte. El cierre exige `completed: true`, todos los checks `passed: true`, dos entradas en `chapters`, `enemy8` y `enemy12` derrotados, tablilla y molde persistentes tras recarga, y `coast-portal` con destino 13. Si falla durante el juego, el último `ACTION`/`FAIL`, `aurelia-fallo.png` y el JSON indican el punto real; Aurelia debe seguir pendiente.

### Fase 22.2.1 · bloqueo entre Lucius y Aurelia

La [traza real del bloqueo en Linux Mint](capturas/fase22/lucius-aurelia-bloqueo-linux-mint.json) conserva 48 checks hasta la recarga de Lucius. A los 39,068 ms el personaje estaba en sala 0, `x=0`, `z=-4,2`, salud 90, con la sombra `enemy0` activa y a unos 2,5 m. Tras intentar ir en línea recta hacia `x=5,2` a `z≈−0,69`, la prueba terminó a los 53,906 ms en `x=2,65383`, salud 0 y sombra viva en estado `recover`. La sala romana, su victoria, el guardado y la recarga sí habían pasado; Aurelia aún no se había abierto.

La causa combina **colisión y combate legítimos con un fallo del navegador automatizado**. La mesa del vestíbulo (`src/world/scene.ts`, centro `x=4,z=1`, ancho 2, fondo 3) bloquea al jugador con radio 0,34 cuando se aproxima desde el oeste en esa franja; su límite es `x=4−(1+0,34)=2,66`, coherente con `x=2,65383` de la traza. La IA de la sombra persigue al jugador y sus golpes hacen 12 puntos antes de defensa; el estado final `recover` y la salud agotada son compatibles con esa regla, sin evidencia de daño anómalo. El antiguo `go()` mantenía pulsada `D` hasta llegar o morir, sin detectar que la posición dejaba de avanzar. **No hay evidencia de un defecto del juego ni motivo para cambiar daño, colisión o dificultad.**

La corrección de automatización comprueba salud y avance en cada tramo corto, registra amenazas y daño con posición/estado del enemigo, defiende durante una preparación de ataque y aborta ante colisión antes de seguir hacia la muerte. Al recargar Lucius, el recorrido enfrenta a la sombra con ataques normales hasta registrar `enemy0` derrotado. Después bordea la mesa por `z=3,1`, llega a `x=6,2` y desciende junto a la pared derecha hasta el portal de Aurelia; la entrada espera a observar `room=11` antes de marcar el check. **Esta corrección aún requiere ejecución válida en Linux Mint.** El criterio de cierre sigue siendo `completed: true` en la ruta acumulativa, con `mosaic-312`, `enemy12`, molde, recarga y portal de Maeve acreditados.

En esta fase pasaron `npm test` (39 archivos, 187/187), `npm run build` y `npm run format:check`. El [intento de navegador en el sandbox](capturas/fase22/sandbox-f22-2-1/lucius-aurelia-trace.json) terminó antes de crear la página por `crashpad EPERM`/`SIGTRAP`, con `completed: false` y ningún check jugable. No se añade a la evidencia de éxito. Desde el terminal normal de Linux Mint debe ejecutarse el comando acumulativo de la sección anterior y conservar el JSON completo.

## 5. Rendimiento y estabilidad

| Medida F22 | Resultado | Límite |
| --- | --- | --- |
| FPS durante campaña completa | — | No hubo campaña ni muestreo continuo. No se extrapolan los diez segundos o pruebas A/B de fases anteriores. |
| Intel HD Graphics 620 | Detectada por `lspci` como `8086:5916`; `/dev/dri` no existe en este contenedor | La GPU anfitriona no está disponible para una medición WebGL física verificable aquí. |
| Memoria JS/GPU durante campaña | — | No se tomó serie temporal ni instantánea comparable durante los doce capítulos. |
| Errores JavaScript | 0 en la ruta corta limpia de `browser-smoke.mjs` y 0 en la ejecución certificada de Lucius | Aurelia aún no tiene ejecución válida. |
| WebGL | Pérdida, recuperación, reanudación y redimensionamiento: `PASS` en `browser-phase10.mjs` | Prueba dirigida, separada de la campaña. |
| Cierre de navegador | Chrome `crashpad EPERM`/`SIGTRAP` antes de página; Firefox `SIGSEGV` antes de página | Se clasifica como bloqueo del entorno de ejecución, sin atribuirlo al juego. |

No se emite un resultado de aceptación de 45 FPS para Intel. La Fase 21.1 ya documenta resultados variables bajo contención y solicita repeticiones físicas controladas; esta sesión no aporta una muestra nueva válida.

## 6. Verificación ejecutada y cambios

| Comando o comprobación | Resultado |
| --- | --- |
| `npm test` | **39 archivos, 187/187 pruebas aprobadas.** |
| `npm run build` | Correcto: TypeScript y Vite de producción. |
| `npm run format:check` | La primera pasada señaló el nuevo script de diagnóstico; se formateó con Prettier y se repitió la comprobación. |
| `npm run test:browser` | Correcto: ruta corta limpia, batería de sistemas dirigida y recuperación WebGL. No acredita la campaña histórica. |
| `node scripts/phase22-start-probe.mjs` | Lucius completo: ejecución del usuario en Linux Mint, `completed: true`, 42/42 checks, 39,676 ms, salida 0 comunicada. Modo acumulativo previo: Lucius completo, muerte de Élise en sala 0 antes de Aurelia; traza preservada. Corrección F22.2.1 pendiente de ejecución válida. |
| `git diff --check` | Revisado al cierre de esta fase. |

**Defectos del juego corregidos:** ninguno. El bloqueo de Fase 22.2.1 se debe a navegación contra una colisión y exposición normal a la sombra, no a reglas de juego defectuosas. **Cambios de automatización:** espera observable de transición, navegación que detecta salud, amenaza y estancamiento, combate legítimo contra `enemy0`, rodeo de la mesa y ruta acumulativa de Aurelia. El resultado de Aurelia queda pendiente. No se alteró contenido del juego.

**Verificaciones repetidas en Fase 22.2:** `npm test` 39 archivos y 187/187 pruebas aprobadas; `npm run build` correcto; `npm run format:check` correcto; `SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser` correcto, incluida ruta corta limpia y recuperación WebGL. La batería estándar no sustituye `--through=aurelia`.

## 7. Defectos pendientes y dictamen

| Prioridad | Pendiente | Cierre exigido |
| --- | --- | --- |
| P1 | Partida limpia Aurelia→Émile→Élise después de Lucius, sin estados preparados | Traza continua con entrada, introducción, documentos, puzle, victoria real, artefacto, salida, guardado, recarga y desbloqueo por capítulo; tiempos y capturas verificables. |
| P1 | Final histórico sin prueba de navegador desde esa partida | Demostrar requisitos persistentes y ver el desenlace tras las once victorias. |
| P1 | Rendimiento y estabilidad de sesión larga en Intel HD 620 | Dispositivo `/dev/dri` accesible, tres repeticiones comparables de exploración, combate y transiciones, peor ventana de 60 fotogramas ≥45 FPS, errores y memoria registrados. |
| P2 | Lanzamiento intermitente de Chrome en el sandbox de QA | Diagnóstico de `crashpad EPERM` y ejecución repetible del recorrido sin rebajar las protecciones del entorno. |
| P2 | Revisión humana de legibilidad, audio, 29 salas en movimiento, mando y accesibilidad | Acta separada con hallazgos verificables. |

**Dictamen fundamentado: NO APTO PARA 1.0.** La ruta corta con final anticipado y Lucius desde Nueva partida tienen evidencia válida. La condición central de Fase 22 —doce investigaciones y final histórico desde una sola partida legítima— carece de evidencia; quedan diez victorias históricas y una medición Intel de campaña. No se infiere un fallo de juego en los capítulos pendientes; se mantiene el bloqueo de certificación hasta completar la campaña y corregir cualquier defecto real que aparezca.
