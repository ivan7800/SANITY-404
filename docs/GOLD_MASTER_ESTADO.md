# SANITY-404 REBORN · estado Gold Master

**Estado: GOLD MASTER NO CERTIFICADO.** Registro de trabajo al 27-10-2026. La compilación y la conectividad geométrica no sustituyen una partida completa ni una revisión visual en la GPU de referencia.

## Versión estable de campaña · ejecución real de Linux Mint

La [traza de campaña completa](capturas/fase22/campana-completa-trace.json), iniciada desde Nueva partida el 27-10-2026 a las 12:28 UTC y terminada a las 12:41 UTC, registra `completed: true`, **11 investigaciones históricas**, Élise en 1927 y el **final histórico**. Pasaron 2808/2808 comprobaciones, sin errores JavaScript registrados. El recorrido duró aproximadamente 806 segundos. Se conservan la [captura del final](capturas/fase22/final-final-historico.png) y las capturas de las investigaciones. Este resultado sustituye los estados de campaña pendientes descritos en las secciones cronológicas anteriores, que se mantienen como historial de los defectos corregidos.

El resultado acredita esa ruta principal y su persistencia durante una ejecución real. **No certifica GOLD MASTER**: siguen pendientes la comprobación visual y jugable completa de las 29 salas, los otros desenlaces en la versión actual y una medición de rendimiento representativa de todas las escenas en Intel HD Graphics 620. La reconstrucción visual continúa en curso.

## Rescate de supervivencia en 1899 · 27-10-2026

La ejecución real posterior de Linux Mint, conservada en [`campana-completa-trace.json`](capturas/fase22/campana-completa-trace.json), completó y recargó **diez capítulos** hasta Amara 1786. La sección antigua que habla de siete capítulos describe una ejecución anterior. La partida actual entró en el archivo fotográfico, sala 27, con 25 PS y murió al ir de la pista a la puerta interior: enemigo `developerShade` aún con 96 PS, posición final `(1,08, -1,64)`, 0 PS. **Émile y Élise siguen sin certificar.**

| Capítulo completado | Salud al regresar | Daño de las defensas registradas en sus salas |
| --- | ---: | ---: |
| Lucius 189 | 90 | 10 PS en sala 8 |
| Aurelia 312 | 70 | 5 PS en sala 12 |
| Maeve 537 | 60 | 10 PS en sala 14 |
| Samira 783 | 56 | 4 PS en sala 16 |
| Idris 1092 | 26 | 30 PS en salas 17–18 |
| Oona 1217 | 49 | 5 PS en sala 20; se consumió `Tónico 0` antes del capítulo |
| Isabelle 1348 | 37 | 12 PS en salas 9–10 |
| Tomás 1491 | 40 | 4 PS en sala 22; `Tónicos 5 y 6` todavía en inventario |
| Inés 1610 | 45 | 35 PS en salas 23–24; se consumió `Tónico 5` antes del capítulo |
| Amara 1786 | 31 | 48 PS en salas 25–26; se consumió `Tónico 6` antes del capítulo |

La tabla muestra **solo golpes durante acciones de defensa**, no el daño total del capítulo; entre capítulos también hay encuentros en la mansión y las curaciones alteran la diferencia entre salud inicial y final. En sala 27 se registraron cinco golpes defendidos de 5 PS cada uno. Los tónicos 0, 5 y 6 se recogieron y consumieron una vez cada uno; antes de Émile no quedaba ninguno. Los tónicos 1–3 pertenecen al recorrido posterior de Élise. La cordura estaba en 2,68 tras Amara; el código no convierte la cordura baja en daño de salud. No se encontró daño duplicado: un ataque anunciado aplica el golpe al terminar su única ventana y entra en recuperación.

**Causa demostrada:** `defendCurrentAttack()` mantenía F desde que detectaba el aviso. La parada precisa del motor dura solo 0,22–0,30 s según el arma, por lo que esa pulsación temprana caducaba antes del impacto. La traza muestra cero paradas precisas en las quince defensas de las salas exteriores 23, 25 y 27: el recorrido acumuló 80 PS de daño reducido en esas tres salas mientras el enemigo exterior seguía vivo. El recorrido caminaba a 2,7 m/s incluso cuando el enemigo estaba próximo, aunque Shift permite correr legítimamente a 4,1 m/s. Los datos no justifican reducir daño ni añadir curaciones al juego.

**Corrección:** `scripts/phase22-start-probe.mjs` espera la ventana observable de los últimos 0,19 s del ataque antes de pulsar F; registra viento restante, salud, cordura y si la defensa evitó daño. Durante la navegación, usa Shift con WASD cuando hay un enemigo visible a menos de 4 m, ajustando el pulso a la velocidad real de carrera. No modifica el motor, las colisiones, salud, inventario ni progreso. `tests/campaign-survival.test.ts` reproduce con el sistema `Combat` de la sala 27 el golpe mortal a 5 PS sin defensa, la parada precisa que conserva los 5 PS y evita daño repetido, y el consumo único de un tónico con salud, cordura e inventario persistidos tras serialización. Esta prueba aislada **no demuestra** que Playwright alcance la ventana durante toda la campaña.

**Verificación local posterior:** `npm test` PASS (250/250, 51 archivos), `npm run build` PASS, `npm run format:check` PASS y `npm run audit:rooms` PASS (29 salas, 418 rutas, cero inaccesibles). La primera ejecución de `npm test` en paralelo con la auditoría agotó los 5 s de `tests/world.test.ts`; repetida sin esa carga, pasó. El Chromium descargado de Playwright no existe en este sandbox (`chromium_headless_shell-1248`), por lo que aquí no se ejecutó una nueva partida real. **Supervivencia de Émile, capítulo 12 y ambos finales: pendientes de una nueva ejecución en Linux Mint.**

Con Vite en `127.0.0.1:5174`, ejecutar en el terminal normal de Linux Mint:

```bash
SANITY_HARDWARE=1 node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

## Protección y herramientas

- Rama comprobada: `fase11/campana-historica`. El árbol ya contenía numerosas modificaciones y archivos sin seguimiento; se han conservado. No se ha hecho commit, push, merge ni despliegue.
- Copia local recuperable antes de editar: `.local-backups/gold-master-start-20261026.tar.gz`, 674 entradas, SHA-256 `f1006559c1f3f65e80270cd710b25b097404b86f04dd57ba06276cff14ee6286`. Se comprobó que el contenido extraído de dos archivos sin seguimiento coincide por hash con el árbol original. No depende de `/tmp`.
- Copia incremental tras el rescate del invernadero: `.local-backups/gold-greenhouse-20261027.tar.gz`, 10 archivos de código, pruebas, documentación y evidencia; SHA-256 `07b17685d41697c08bc54972b48b18b2f655d086909d9cd8223a5543c37ad1c7`. Se comprobó la enumeración y que los hashes extraídos del script principal y la traza coinciden con los originales.
- No existe `AGENTS.md` en el repositorio. `docs/REA.md` documenta REA 6.5.0; no aporta una función necesaria para editar estas fuentes. ECC 2.2.3 está instalado como catálogo local de skills; se consultó `browser-qa`. No se instaló código remoto. Los agentes especializados invocados en este encargo quedaron indisponibles por límite de servicio y no realizaron cambios; el trabajo continuó con herramientas locales.

## Incidente Roma 189

La traza real [`campana-completa-trace.json`](capturas/fase22/campana-completa-trace.json) y [`final-fallo.png`](capturas/fase22/final-fallo.png) muestran que el personaje estaba en `(-3.23946, 4.21045)` ante el testimonio de la ceniza. `roman-echo-ash` ya constaba en `campaign.witnessed`, el panel «Lo que se consume» estaba abierto y el juego estaba pausado. A* recalculó una ruta geométricamente libre, pero el controlador siguió enviando WASD a una pantalla en pausa y rechazó la ruta repetida. Por tanto, esa reproducción concreta no demuestra un choque con la estela.

Cambios:

- `scripts/phase22-start-probe.mjs`: detecta la pausa mientras camina, comprueba que el panel corresponde a un testimonio romano ya obtenido mediante interacción real, registra la incidencia y pulsa «Conservar el testimonio» antes de continuar. Una pausa desconocida falla con contexto; no se acepta como colisión. El testimonio se verifica después sin duplicar la interacción.
- La traza de QA registra sala, panel, últimas pulsaciones de interacción `E` y botones de mando activos cuando aparece una pausa incidental. Esta instrumentación solo observa eventos en la página de prueba y permite investigar su disparador en Linux Mint.
- El controlador exige cruzar la coordenada de cada waypoint, en vez de declarar alcanzados puntos situados hasta 0,12 m antes. Los pulsos cortos reducen el salto cerca de esquinas. Los archivos previos de traza y captura se conservan con marca temporal antes de escribir otros nuevos.
- `scripts/phase22-navigation.mjs` y `tests/phase22-navigation.test.mjs`: regresión con la posición, destino, ruta y panel exactos. El motor físico recorre los cuatro segmentos sin obstáculo; la posición anterior ya no se considera un waypoint alcanzado.
- `scripts/phase22-dynamic-audit.mjs`: además del A*, ejecuta cada segmento de sus escenarios con `move()` en pasos equivalentes a 60 Hz y velocidad de marcha de 2,7 m/s, sin ajustar artificialmente al waypoint. Comprueba avance, desvío en esquinas y destino físico. Es simulación del motor, no una partida de navegador.

El origen del evento de tecla que abrió ese testimonio durante la navegación aún no está probado. La nueva traza de Linux Mint debe confirmar si vuelve a ocurrir; si lo hace, registrar eventos de entrada y eliminar la causa en el juego o en el controlador.

## Verificación posterior a los cambios

| Comprobación | Resultado |
| --- | --- |
| `npm test` | PASS, 244/244 tras la corrección de selección de objetos del 27-10-2026 |
| `npm run build` | PASS tras la corrección de selección de objetos |
| `npm run format:check` | PASS tras formatear los archivos modificados |
| `npm run audit:rooms` | PASS: 29 salas, 418 rutas simuladas con el motor, 10 tramos consecutivos, 23 destinos directos y 4 puertas con requisitos de puzle comprobadas, 0 inaccesibles; datos en [`RESCATE_SALAS_DATOS.json`](RESCATE_SALAS_DATOS.json) |
| `npm run test:rescue:browser` | Repetido el 27-10-2026: Chrome no inició (`crashpad setsockopt EPERM`, `SIGTRAP`) en el sandbox. No es un fallo del juego demostrado. |
| `npm run test:browser` | FAIL en Chromium con SwiftShader, antes de guardar: movimiento lento, daño hasta muerte y `localStorage` vacío. El navegador informó WebGL por software; no reproduce el rendimiento de Intel HD 620. |
| `npm run test:reborn:hall` y `npm run test:reborn:survey` | No iniciaron Chrome por el mismo `crashpad setsockopt EPERM`/`SIGTRAP` del sandbox; sin capturas nuevas. |
| `--through=final` en Linux Mint | Siete capítulos completos desde Nueva partida; la última ejecución se detuvo entre `tonic5` y `note5` por seleccionar `mansion-echo-oona`. La nueva ruta aún requiere ejecución real. |

Los 58,37 FPS de Intel HD 620 y las verificaciones de navegador comunicadas por el equipo corresponden a una compilación anterior; no miden los últimos cambios visuales. No existe una nueva cifra de FPS Intel verificada ni una evaluación visual completa de las 29 salas.

## Matriz de salas

«Arquitectura» indica solo código visible añadido o existente. «Revisión» exige captura actual y recorrido jugado, todavía pendientes. Ninguna fila está declarada terminada por una prueba geométrica.

| Sala | Escenario | Arquitectura actual | Revisión visual y jugable actual |
| --- | --- | --- | --- |
| 0 | Vestíbulo Moreau | Bóveda, arcadas, escalera y vanos sur añadidos | Pendiente |
| 1 | Biblioteca | Cubierta nervada añadida sobre escena previa | Pendiente |
| 2 | Cripta | Bóveda y nichos añadidos | Pendiente |
| 3 | Capilla | Escena previa | Pendiente |
| 4 | Ruinas | Óculo y capiteles añadidos | Pendiente |
| 5 | Archivo familiar | Cubierta añadida | Pendiente |
| 6 | Invernadero | Escena previa | Pendiente |
| 7 | Sótanos | Cubierta añadida | Pendiente |
| 8 | Roma 189 | Cubierta histórica añadida; testimonio reproducido en fallo | Pendiente |
| 9 | Claustro 1348 | Cubierta histórica añadida | Pendiente |
| 10 | Scriptorium 1348 | Cubierta histórica añadida | Pendiente |
| 11 | Taller 312 | Cubierta histórica añadida | Pendiente |
| 12 | Horno 312 | Cubierta histórica añadida | Pendiente |
| 13 | Muelle 537 | Cubierta histórica añadida | Pendiente |
| 14 | Archivo de marea 537 | Cubierta histórica añadida | Pendiente |
| 15 | Terraza 783 | Terraza abierta previa | Pendiente |
| 16 | Cúpula 783 | Cubierta histórica añadida | Pendiente |
| 17 | Cantera 1092 | Cubierta histórica añadida | Pendiente |
| 18 | Cámara del arco 1092 | Cubierta histórica añadida | Pendiente |
| 19 | Hospital 1217 | Cubierta histórica añadida | Pendiente |
| 20 | Enfermería 1217 | Cubierta histórica añadida | Pendiente |
| 21 | Imprenta 1491 | Perfil tardío añadido | Pendiente |
| 22 | Sala de planchas 1491 | Perfil tardío añadido | Pendiente |
| 23 | Casa Veyr 1610 | Perfil tardío añadido | Pendiente |
| 24 | Galería 1610 | Perfil tardío añadido | Pendiente |
| 25 | Teatro 1786 | Perfil tardío y pilares físicos añadidos | Pendiente |
| 26 | Tramoya 1786 | Perfil tardío añadido | Pendiente |
| 27 | Archivo fotográfico 1899 | Perfil tardío añadido | Pendiente |
| 28 | Revelado 1899 | Perfil tardío añadido | Pendiente |

## Campaña y riesgos

La [traza acumulativa más reciente](capturas/fase22/campana-completa-trace.json) de Linux Mint inició Nueva partida y completó Lucius, Aurelia, Maeve, Samira, Idris, Oona e Isabelle, con regresos, guardados y recargas. Registra siete entradas de capítulo y cero errores JavaScript. Se detuvo después de derrotar `enemy5`, elegir el juramento de Lucius y recoger `Tónico 5`, antes de leer `note5`. La nueva ruta añade el documento y puzle omitidos; no acredita todavía Tomás ni los capítulos posteriores. El cierre histórico, los finales alternativos, cámara y calidad visual de 29 salas, combate completo y rendimiento Intel tras los últimos cambios siguen sin verificación suficiente. La pausa inesperada del testimonio romano sigue siendo un defecto de entrada potencial hasta determinar su disparador.

## Incidente de tónico antes de Oona · 27-10-2026

La partida real llegó a la mansión con 32 PS, cordura 0 y `Tónico 0`. La lectura inmediata tras H seguía mostrando esos valores, pero la captura de fallo 16 ms después ya mostraba 72 PS y el tónico ausente. `src/systems/inventory.ts` consume el primer tónico y aplica `+40` PS y `+25` cordura de forma síncrona cuando `update()` procesa `KeyH`. `press("h")` esperaba solo el contador de render, que puede avanzar antes de que el ciclo siguiente procese H. La evidencia respalda una condición de carrera del controlador, no un fallo demostrado del consumible.

El observador `sanityInspect()` clona el `State` activo al leerlo; no hay un segundo inventario ni una caché de salud en esa ruta. `drinkTonic()` retira el objeto antes de sumar salud y cordura dentro de la misma llamada, de modo que el desfase entre lecturas corresponde a fotogramas distintos. La cordura a cero permite el consumo y sube a 25 según la regla. El diagnóstico final indicaba juego sin pausa; el hecho de que salud e inventario cambiaran confirma que H llegó al motor, aunque la traza anterior no permite afirmar cuál era el foco exacto al pulsarlo.

`scripts/phase22-start-probe.mjs` espera ahora, con límite de 5 s, que desaparezca exactamente el primer tónico observado. Después comprueba que se retiró uno solo, que salud o cordura cambiaron dentro de los límites de la regla, y que otro fotograma deja el inventario estable y el juego activo. En un timeout registra sala, salud, cordura, inventario, pausa y foco. No escribe estado. `scripts/phase22-resources.mjs`, `tests/inventory.test.mjs` y `tests/input.test.ts` cubren los siete tónicos existentes, salud baja, cordura cero, inventario vacío, máximos, pulsaciones repetidas, descarte de H durante pausa, pérdida de foco y serialización/recarga. Estos tests no sustituyen pruebas de navegador del consumo en pausa, tras recargar o al cambiar de capítulo.

La ejecución real posterior superó H y completó Oona e Isabelle. Su fallo posterior se documenta abajo.

## Bloqueo del invernadero tras Isabelle · 27-10-2026

En sala 5 el personaje llegó a `(5,65721, 0,01784)`, a 1,043 m de `greenhouse-door`, con el prompt y objeto correctos, planta baja, juego activo y `enemy5` derrotado. Playwright esperaba sala 6 durante 30 s. La puerta estaba legítimamente bloqueada: `phase2DoorLocked("greenhouse-door", state.phase2)` exige el puzle `genealogy`. La ruta de certificación no había leído `note5` ni interactuado con `genealogy`; la auditoría de rutas solo había comprobado geometría.

`scripts/phase22-start-probe.mjs` lee ahora el documento 5, abre el árbol genealógico, elige sus tres respuestas mediante botones y espera cada paso de `phase2.steps` antes de pulsar E sobre la puerta. Exige que el puzle esté en `phase2.solved`, que la puerta esté desbloqueada y que la sala cambie realmente a 6. La misma prueba de navegador exige que permanezcan `enemy5` derrotado, el juramento, `Tónico 5` recogido y el documento leído. Para cada transición, registra objeto seleccionado, distancia, planta, foco, pausa, última tecla E, mensaje de bloqueo y estado del puzle; un timeout de puerta queda limitado a 5 s y produce un FAIL con esa evidencia. Las demás esperas de juego registran ahora la condición concreta incumplida y una instantánea equivalente; las esperas de prompt y consumo mantienen su diagnóstico específico.

La regresión aislada de `tests/phase2.test.ts` reproduce el estado tras enemigo, altar y tónico, verifica que la puerta sigue cerrada hasta completar `genealogy` y que el desbloqueo persiste tras serializar y recargar. `tests/phase22-navigation.test.mjs` ejecuta con el motor físico la ruta desde la posición real tras `tonic5` hacia `note5`, después al árbol y finalmente a la puerta, sin atravesar muebles y comprobando qué objeto queda seleccionado. `audit:rooms` revisa los requisitos antes y después del puzle para `archive-door`, `greenhouse-door`, `chapel-side` y `basement-door`. La regresión de navegador auténtica está integrada en `--through=final`, pero **aún no se ha ejecutado con esta corrección en Linux Mint**. Chrome no inició en el sandbox (`crashpad EPERM`); ninguna prueba sintética certifica el cruce real de la puerta.

La [captura del fallo](capturas/fase22/final-fallo.png) deja un mueble muy próximo delante de la cámara en sala 5. Hace falta revisar ese encuadre al jugar y decidir si debe corregirse; la imagen aislada no basta para certificar o descartar un defecto de cámara. La revisión visual de las 29 salas sigue pendiente.

## Navegación entre `tonic5` y `note5` · 27-10-2026

La última ejecución real de Linux Mint alcanzó de nuevo sala 5 tras siete capítulos, derrotó `enemy5`, activó `memory-altar` y recogió `tonic5`. Desde `(4.351219999999981, 5.550139999999997)`, A* no halló un punto que seleccionara `note5` dentro de 0,35 m del antiguo punto preferido `(-4.2, 5)`. La traza conservada en [`campana-completa-trace.json`](capturas/fase22/campana-completa-trace.json) confirma `selectedAtTarget: mansion-echo-oona`; el eco de Oona está en `(-4.1, 4.4)` y el documento en `(-5.5, 5)`. A* rechazó correctamente la selección equivocada. La misma traza calculó una alternativa legal en `(-4.3, 5.9)` que selecciona `note5`. El defecto era que el controlador diagnosticaba esa alternativa pero no la recorría. La auditoría anterior omitía el eco y comprobaba el punto preferido sin exigir el objeto seleccionado, por lo que produjo un falso positivo.

`scripts/phase22-navigation.mjs` define ahora un objetivo de interacción alrededor del objeto real: radio 1,75 m, interior al radio de 1,9 m usado por `World.nearest`, selección del identificador exacto y margen de 0,09 m en ocho direcciones para absorber el paso de movimiento sin caer en la zona de selección de otro objeto. `scripts/phase22-start-probe.mjs` usa ese objetivo para todas las interacciones y sigue comprobando el prompt y el objeto seleccionado antes de E. El punto antiguo queda solo en la traza como referencia. No se modificaron colisiones, objetos ni progreso.

La regresión de `tests/phase22-navigation.test.mjs` reproduce el punto observado y la presencia del eco de Oona, ejecuta con `move()` la ruta hasta `note5`, luego a `genealogy` y `greenhouse-door`, y verifica selección y radio reales. `scripts/phase22-dynamic-audit.mjs` simula además `enemy5 → memory-altar → tonic5 → note5 → genealogy → greenhouse-door` con estados de campaña reconstruidos, cuatro pequeñas variaciones del punto tras el tónico y el regreso de `note5` al lado del tónico. Registra los extremos alcanzados físicamente y falla si otro objeto queda seleccionado. La auditoría completa registra 418 rutas, 10 tramos consecutivos y cero inaccesibles. **Es una simulación geométrica y de movimiento, no una prueba de lectura, solución del puzle o transición en Chromium.** La secuencia real sigue pendiente desde Nueva partida.

Con Vite en el puerto 5174 de Linux Mint, la certificación pendiente se ejecuta con:

```bash
SANITY_HARDWARE=1 node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

El siguiente resultado debe confirmar que `note5` se lee, `genealogy` se resuelve por botones y `greenhouse-door` lleva a sala 6; después debe continuar por Tomás, Inés, Amara, Émile, Élise y el desenlace. Hasta entonces: **GOLD MASTER NO CERTIFICADO**.

## Reforma arquitectónica de circulación · 27-10-2026

Se protegió el árbol completo, incluidos archivos nuevos, en `.local-backups/architectural-reform-20261027.tar.gz` (SHA-256 `869099e3d06f659655a51e7ba06b42784358db063e8724ac9ad5e396403af1dc`). La [matriz de 29 salas](REFORMA_ARQUITECTONICA_29_SALAS.md), los [planos técnicos](planos/00.svg), el [plano del rellano](planos/00-planta-alta.svg) y los [datos de colisionadores y accesos](planos/datos.json) distinguen diseño implementado de validación visual pendiente.

En el vestíbulo se sustituyó la chaise junto a la escalera por un sillón menor con colisionador coherente; la separación al arranque aumentó de 1,05 a 1,675 m. Se desplazaron juntos el escritorio, sus detalles y su colisionador; se separaron portales tardíos y se reorganizaron llave, tónico y mobiliario de legado. Biblioteca, capilla, archivo familiar y sótano tienen estanterías, columnas o armarios retirados de los umbrales. El altar de capilla no se centró porque la auditoría detectó que ello hacía inaccesible `seal3`; se conservó el puzle y se corrigieron los bancos y pilares. La prueba nueva recorre físicamente la escalera y comprueba distancias a accesos. Los otros escenarios conservaron la planta al no detectarse una causa geométrica concreta para mover sus muebles; siguen pendientes de inspección visual y jugable.

Resultados posteriores a la reforma: `npm test` **247/247 PASS**; `npm run build` **PASS**; `npm run format:check` **PASS**; `npm run audit:rooms` **PASS**, 29 salas y 418 rutas simuladas con el motor, 10 tramos consecutivos, cero inaccesibles; `npm run audit:architecture` **PASS**, 29 planos y plano superior. Una ejecución simultánea previa de `npm test` excedió el límite de 5 s en una prueba de portales tardíos; la misma prueba pasó aislada en 1,12 s y la repetición completa sin la carga paralela pasó 247/247. No se cambió ese timeout.

`npm run test:reborn:survey` no pudo iniciar Chrome en este sandbox: `crashpad setsockopt EPERM` y salida `SIGTRAP`, antes de abrir el juego. No existen capturas comparativas ni FPS Intel nuevos tras la reforma. En sala 0, dos pilares de los vanos sur quedan a 1,09 y 1,04 m de sus portales; la geometría deja paso al actor, pero se requiere revisión de maniobra y encuadre. La campaña real de Linux Mint no se ha vuelto a ejecutar tras mover el mobiliario y los portales. Siguen pendientes `roman-return`, `tonic5 → note5`, `genealogy → greenhouse-door`, Tomás a Élise, finales, guardados tras la reforma y la revisión visual de las 29 salas. **GOLD MASTER NO CERTIFICADO**.

`npm run test:browser` también se intentó aquí y se detuvo antes de iniciar juego con `ERR_CONNECTION_REFUSED` en `http://localhost:5173/`, su URL por defecto; el sandbox no permitió conectar al Vite lanzado en una sesión de terminal separada. No se interpreta como fallo del juego. En Linux Mint, arrancar Vite en el puerto 5174 y usar `SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser`.

Con Vite en el puerto 5174 de Linux Mint, ejecutar:

```bash
SANITY_HARDWARE=1 node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

Continuar con `SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser`, `npm run test:rescue:browser`, `npm run test:reborn:hall` y `npm run test:reborn:survey`, revisar las capturas y medir los tiempos de GPU Intel. Una traza que termine con código 0 es requisito para certificar la campaña; no basta con que la auditoría de 409 rutas pase.
