# Fase 20 — Auditoría integral de campaña y contenido

**Fecha:** 24 de octubre de 2026. **Rama:** `fase11/campana-historica`. **Decisión de lanzamiento:** **NO APTO: FALTA CONTENIDO O VALIDACIÓN ESENCIAL.**

## 1. Resumen ejecutivo y criterio de evidencia

Existe un juego 3D ejecutable con 29 salas, doce protagonistas/épocas representados en código, combate, puzles, documentos, guardado v2 y varios desenlaces. La ruta corta de Élise, desde **Nueva partida** hasta el final de las ruinas, terminó en Chromium con entradas de teclado y sin alterar el estado interno. Esta prueba **no** recorrió la cadena histórica, el sótano ni los cinco encuentros especiales de la mansión. No existe evidencia de una partida limpia que complete las doce épocas y el desenlace, ni duración real por capítulo. Por tanto, «doce capítulos implementados» no equivale a «campaña de doce capítulos verificada».

Uso cuatro niveles separados: **diseñado** (texto de intención), **implementado** (reglas/escena en el código), **probado** (prueba aislada, incluida una carga preparada), y **completado en navegador** (recorrido continuo desde estado legítimo). `docs/CAMPANA-12.md` es una propuesta anterior y declara tres tramos; `docs/FASE12.md` describe el código posterior, pero reconoce que no hubo recorrido de navegador de las cuatro épocas finales. `docs/FASE19_TERROR_CINEMATOGRAFICO.md` acredita 29 capturas **de entrada** con guardados preparados, no 29 salas recorridas. Ninguna de esas fuentes sustituye el cuarto nivel.

**Estado global:** los doce capítulos se clasifican **IMPLEMENTADO PARCIAL** para el estándar de versión 1.0. Ninguno recibe **COMPLETO VERIFICADO**. Tampoco se clasifica ninguno como **SOLO DISEÑADO**, pues las escenas y reglas ya existen. El fallo intermitente de Chrome bloqueó la prueba histórica dirigida de esta sesión, no demuestra por sí mismo que los capítulos fallen.

## 2. Matriz de los doce capítulos

En las filas, «G» indica que el guardado v2 acepta la sala, objetos y progreso; el escritorio de memoria existe en la escena. **No** significa que se haya cargado y terminado ese capítulo en una partida limpia. «S» indica pérdida de cordura por documentos, error de puzle, puertas o amenaza mediante reglas compartidas; no equivale a una consecuencia narrativa exclusiva. «Duración —» significa **no medida**. Las salas y objetos se contrastaron con `src/world/scene.ts`, `src/world/narrative.ts`, `src/systems/campaign.ts`, `src/systems/late-chapters.ts`, `src/systems/state.ts` y `src/main.ts`; las capturas de Fase 19 solo verifican el aspecto desde la entrada.

| # · protagonista y ambiente | Salas transitables; objetivo, puzle y victoria implementados | Enemigo, herramienta, documentos y cordura | Guardado, transición, duración y límite de prueba | Estado |
| --- | --- | --- | --- | --- |
| **1 Lucius · 189**, santuario romano | 08; leer inscripción, presenciar formación, ordenar tres signos, vencer y recuperar tablilla; regreso al vestíbulo registra `roman-189`. | Centurión; gladius nominal, combate común; inscripción y tres testimonios; S por formación y respuestas. | G. Abre Aurelia al concluir. Prueba histórica previa y unitarias, pero sin recorrido limpio actual de la época. Duración —. La ficha de diseño lo llama guardia y la nota jugable cartógrafo. | **IMPLEMENTADO PARCIAL** |
| **2 Aurelia · 312**, taller y horno | 11–12; leer registro, recoger cinabrio, ordenar teselas y obtener molde tras derrotar al custodio; regreso registra `mosaic-312`. | Custodio de mosaico; martillo de teselas nominal; dos notas; S por errores y amenaza. | G. Abre Maeve. Geometría/puzle en pruebas, capturas de entrada; sin salida completada en navegador. Duración —. | **IMPLEMENTADO PARCIAL** |
| **3 Maeve · 537**, muelle y archivo costero | 13–14; tabla de mareas, cruce de fecha, lista de pasajeros y evacuación; regreso registra `coast-537`. | Custodio ahogado; cuchillo de escriba nominal; libro y registro; S compartida. | G. Abre Samira. Pruebas de lógica y capturas de entrada, sin recorrido de capítulo. Duración —. | **IMPLEMENTADO PARCIAL** |
| **4 Samira · 783**, terraza y cúpula | 15–16; carta astral y alineación de tres horas, disco tras combate; regreso registra `stars-783`. | Vigilante ciego; bastón astrolábico nominal; dos notas; S por orden erróneo y amenaza. | G. Abre Idris. Puzle probado en código, sin transición comprobada jugando la cadena. Duración —. | **IMPLEMENTADO PARCIAL** |
| **5 Idris · 1092**, cantera y cámara del arco | 17–18; cuña, base/clave/cierre, plano tras vencer; regreso registra `quarry-1092`. | Obrero petrificado; martillo de cantero nominal; cuaderno y plano; S compartida. | G. Abre Oona. Pruebas unitarias y entrada visual, sin capítulo completo en navegador. Duración —. | **IMPLEMENTADO PARCIAL** |
| **6 Oona · 1217**, hospital y enfermería | 19–20; hierbas, remedio, cuaderno y elección Ada/Bran tras combate; regreso registra `hospital-1217`. | Custodio de salas; bastón de curandera nominal; ingresos e historiales; S por errores y amenaza. | G; la elección se conserva como objeto excluyente. Abre la abadía **según el registro**, aunque el portal de 1348 ya está presente. Sin recorrido limpio. Duración —. | **IMPLEMENTADO PARCIAL** |
| **7 Isabelle · 1348**, claustro y scriptorium | 09–10; leer campana/códice, descifrar sello, vencer y recuperar códice; regreso registra `abbey-1348`. | Copista de peste; bastón/daga descritos de forma inconsistente; dos notas; S compartida. | G. Su portal está disponible desde el inicio, sin exigir Oona; concluirla abre Tomás. Hay prueba histórica anterior con guardados preparados y capturas de entrada, no campaña limpia. Duración —. | **IMPLEMENTADO PARCIAL** |
| **8 Tomás · 1491**, imprenta y planchas | 21–22; prueba de impresión, dos evidencias, secuencia de tres decisiones, plancha tras combate; regreso registra `press-1491`. | Cajista/tipógrafo; palanca de prensa nominal; dos documentos y evidencias; S por error. | G. Requiere Isabelle, abre Inés. `FASE12` reconoce falta de recorrido de navegador; solo lógica y entrada visual. Duración —. | **IMPLEMENTADO PARCIAL** |
| **9 Inés · 1610**, casa Veyr y galería | 23–24; inventario, genealogía, dos evidencias, confrontación y acta tras combate; regreso registra `veyr-1610`. | Retrato guardián; estoque nominal; dos documentos y evidencias; S por error. | G. Requiere Tomás, abre Amara. Sin salida real comprobada en navegador. Duración —. | **IMPLEMENTADO PARCIAL** |
| **10 Amara · 1786**, teatro y tramoya | 25–26; partitura, poleas, dos evidencias, ritmo grave/silencio/agudo y partitura final tras combate; regreso registra `theatre-1786`. | Autómata; llave mecánica nominal; dos documentos y evidencias; S por error. | G. Requiere Inés, abre Émile. Sin recorrido real comprobado. Duración —. | **IMPLEMENTADO PARCIAL** |
| **11 Émile · 1899**, archivo y revelado | 27–28; negativo, bisagras/fijador, secuencia de exposición y placa tras combate; regreso registra `photo-1899`. | Sombra de revelado; trípode nominal; dos documentos y evidencias; S por error. | G. Requiere Amara, pero su conclusión no es necesaria para entrar en 1927 ni terminar. Sin recorrido real comprobado. Duración —. | **IMPLEMENTADO PARCIAL** |
| **12 Élise · 1927**, mansión Veyr | 00–07, incluida planta superior en 00; llave, medallón, tres sellos, rutas laterales, mordazas y dos salidas finales. La ruta vestíbulo→biblioteca→cripta→capilla→ruinas se completó limpia en navegador. | Sombras, acechador, ritualista, guardián y cinco amenazas especiales en 00; bastón y rituales; ocho notas más descubrimientos; cordura altera atmósfera/desenlace básico. | G y carga comprobadas en la ruta corta. La vía de sótano y los encuentros superiores tienen pruebas separadas, no partida limpia integral. No hay transición posterior ni créditos. Duración de jugador —. | **IMPLEMENTADO PARCIAL** |

La arquitectura usa un controlador de combate compartido. Las armas de época aparecen con nombre y representación, pero el daño, controles y gasto de resistencia proceden de reglas comunes; la diferenciación de herramientas jugables es limitada. Los puzles son resolubles según pruebas de lógica, aunque su legibilidad y solución por una persona sin ayudas no están verificadas en las once épocas.

## 3. Inventario de sistemas y experiencia

| Sistema | Evidencia de implementación y prueba | Límite para 1.0 |
| --- | --- | --- |
| Combate, enemigos y objetivos anatómicos | Ataque ligero/fuerte, defensa, parada, esquiva, tres zonas de golpe, IA y vulnerabilidades; pruebas `combat`, `mansion-enemy`, `cinematic-terror`; combate activo medido en 1927 y 189. | Una regla de combate para casi todas las armas; no se completaron todos los encuentros jugando. El jefe de la Raíz tiene prueba dirigida previa, no en la partida limpia de esta auditoría. |
| Cordura y consecuencias | Baja con lecturas, fallos, daño y eventos; afecta percepción, reflejo y algunos finales; tónicos la restauran. | No se demostró que cada episodio histórico produzca una consecuencia persistente diferenciada. La cordura baja por sí sola no causa daño. |
| Rituales | Dos secuencias con costes y requisitos en `ritual.ts`; pruebas unitarias. | No hay magia combinatoria de época ni validación de uso necesario en campaña completa. |
| Inventario, diario y mapa | Artefactos, documentos, pistas, mapa y elecciones aparecen en UI; las pruebas cubren entrada básica y persistencia. | Inventario global hace que las pruebas históricas lleguen a Élise mediante reglas de juego, con poca escena de entrega; legibilidad de pistas durante recorrido completo pendiente. |
| Guardado y carga | `localStorage`, formato v2, migración v1, validación de datos; escritorios y guardado al concluir capítulos; carga real de 1927 comprobada. | No se ejecutó guardar, cerrar, cargar y acabar **cada** época, ni recuperación tras muerte en cada capítulo. Es un único hueco de guardado. |
| Cámara, controles y accesibilidad | Cámara clásica/moderna, teclado, ratón, mando codificado, opciones de audio y tamaño; pruebas de foco, cámara y mandos simulados. | Sin prueba con mando físico ni lector de pantalla; muchos umbrales quedan fuera de la vista de entrada. |
| Sonido | Audio procedural, señales de combate y lamento espacial con pruebas de parámetros. | Sin escucha humana del lamento o mezcla en contexto; no se certifica calidad perceptiva. |

**29 escenarios:** revisé visualmente las tres hojas de contacto de Fase 19 (`capturas/fase19/contacto-1.jpg`, `contacto-2.jpg`, `contacto-3.jpg`). Aportan captura e inventario de interactivos desde `x=0,z=5` para las salas 00–28 y recorrido aparte de planta superior. Preparé `scripts/phase20-room-views.mjs` para capturar entrada y posición alcanzada por teclado en cada sala, con traza de desplazamiento; cuatro intentos terminaron antes de abrir una página por el mismo `crashpad EPERM` y **no produjeron nuevas capturas**. La ruta limpia solo atravesó 00–04. Sigue abierto P19-01: marcos cercanos, puertas fuera de cuadro y composiciones similares, especialmente 11/12, 15/16, 19/20 y 23/24. Las capturas de entrada no prueban ausencia de bloqueos al moverse.

## 4. Mapa de progresión y dependencias reales

```text
Nueva partida → Élise 1927 (vestíbulo)
  ├─ ruta principal: llave → biblioteca → cripta → capilla → 3 sellos → ruinas → final
  ├─ ruta de sótano: mecanismos/guardián → umbral de Adrien → final alternativo
  ├─ Lucius 189 → Aurelia 312 → Maeve 537 → Samira 783 → Idris 1092 → Oona 1217
  └─ Isabelle 1348 (portal disponible desde el inicio) → Tomás 1491 → Inés 1610
       → Amara 1786 → Émile 1899
```

`campaign.ts` declara que Isabelle depende de Oona y Élise de Émile, pero `scene.ts` crea el portal medieval sin comprobar Oona y ofrece la mansión desde el inicio. `main.ts` permite activar el final de ruinas con tres sellos, sin consultar `campaign.completed`. En la práctica, la **campaña obligatoria** es la ruta corta de 1927; las once épocas son contenido opcional, con dos ramas de acceso y desbloqueos internos. El texto de menú y la matriz de doce capítulos pueden inducir a entender una campaña cronológica obligatoria que el juego no impone. Esto requiere una decisión de producto clara antes de 1.0.

## 5. Duración real comprobada y recorrido integral

La ejecución limpia de `scripts/browser-smoke.mjs` inició **Nueva partida**, movió a Élise, guardó y cargó el guardado creado en esa misma ejecución, leyó la carta, obtuvo llave y medallón, cruzó a biblioteca, cripta, capilla y ruinas, resolvió tres sellos y mostró **«Volver al título»**. No hubo estado preparado ni modificación de `localStorage` en ese script. La traza reportó diez hitos `PASS` y cero errores JavaScript. **Transiciones observadas:** 00→01→02→03→04. **Muertes:** ninguna en este recorrido. **Recuperación:** carga del escritorio de 00. **Bloqueo:** ninguno en esta ruta. Los enemigos no fueron vencidos como requisito de esa prueba y no se visitaron 05–28; por tanto el mensaje del script «Campaña completa» se interpreta solo como **ruta corta completada**.

El script no registró cronómetro de juego por transición ni tiempo humano. **Duración real comprobada por capítulo: ninguna**; los 30–45 minutos de `FASE19_GUIA_PRUEBA_MANUAL.md` son una estimación de sesión, no una medición de campaña. Las muestras de rendimiento de diez segundos tampoco son duración jugable. No se afirma duración de doce capítulos.

Las pruebas dirigidas de `browser-systems.mjs` usan guardados preparados para bloqueo de puerta, cordura, muerte/reintento y un segundo desenlace. `browser-phase10.mjs` verificó pérdida/restauración de WebGL. La prueba histórica `browser-historical.mjs`, que también usa guardados preparados, no llegó a ejecutar ninguna escena en esta sesión. Estas pruebas aisladas **no** se suman para simular una partida integral.

## 6. Narrativa, decisiones, finales y cierre

La secuencia de pistas —signo del Intervalo, rostro, nombres, astro, arco, identidad, códice, falsificación, pacto, ritmo y fotografía— existe en documentos y epílogos. Los once artefactos se reflejan en `legacy.ts`; la elección Ada/Bran y la elección Lucius/Isabelle se guardan como objetos excluyentes. El final histórico requiere tablilla, códice, reconciliación y descubrimiento `adrien`; los demás artefactos **añaden frases**, pero no bloquean el final ni cambian su resultado principal. La ruta de ruinas distingue cordura ≥40 y <40 cuando falta la reconciliación. El sótano tiene un cierre adicional ligado a descubrimiento y legado. Ninguna condición exige `campaign.completed.length === 12`.

La continuidad se apoya sobre todo en notas y paneles al recoger artefactos. No se comprobó la inteligibilidad de las pistas para una persona jugando en orden libre. Hay una inconsistencia concreta: `CAMPANA-12.md` presenta a Lucius como guardia, mientras el documento jugable 08 lo llama cartógrafo; el arma y la función narrativa sugieren ambos papeles sin explicarlos. La ficha de Isabelle menciona daga, mientras la UI muestra bastón de escriba. El final presenta texto y botón de volver al título; **no se halló una pantalla de créditos** ni una secuencia posterior de cierre de las doce épocas. No se observó una escena inacabada en la ruta corta; la revisión de escenas históricas en movimiento sigue pendiente.

## 7. Defectos y riesgos priorizados

| ID | Prioridad | Hallazgo y evidencia reproducible | Criterio de cierre |
| --- | --- | --- | --- |
| F20-01 | **P1** | No hay recorrido limpio acreditado de las once épocas en secuencia ni del final tras ellas. `FASE12.md` lo reconoce; `browser-historical.mjs` falló dos veces al iniciar Chrome en esta sesión. Es un **bloqueo de validación para publicar**, no prueba de que el juego se bloquee. | Terminar y grabar una partida desde Nueva partida con once conclusiones, cargas, muertes y final; conservar traza por transición y duración. |
| F20-02 | **P1** | Discrepancia del grafo: `campaign.ts` asigna prerequisitos Oona→Isabelle y Émile→Élise; `scene.ts` muestra Isabelle desde el inicio y `main.ts` permite terminar 1927 sin las épocas. | Fijar si las épocas son opcionales o campaña obligatoria; alinear interfaz, documentación, condiciones y QA con esa decisión. |
| F20-03 | **P1** | Las salas 05–28 no se recorrieron desde Nueva partida en la prueba limpia; las cuatro épocas de Fase 12 carecen de salida verificada en navegador. Las 29 capturas previas son de una sola posición. | Recorrido de cada sala desde varios puntos, cada puzle/combate/salida y reentrada tras guardar/cargar; registrar defectos y capturas. |
| F20-04 | **P1** | Sin duración real de doce capítulos ni sesión larga de estabilidad/rendimiento Intel; no se midió transición. Una muestra de 60 s pasó, pero un intento de 300 s terminó al cerrarse la página de Chrome sin resultado; la causa no quedó localizada. | Medir tiempos de juego, FPS y peor ventana de 60 en exploración, combate y puertas durante sesión prolongada en HD 620; investigar el cierre de Chrome con registro del navegador. |
| F20-05 | **P2** | Armas históricas principalmente nominales sobre el mismo controlador; dos rituales globales. | Evaluar sensación y respuesta por época con jugadores; documentar alcance real de herramientas para 1.0. |
| F20-06 | **P2** | Continuidad representada mayormente por notas; artefactos 2–11 amplían el texto del final sin ser necesarios. No hay créditos. | Revisar entrega narrativa, condiciones de desenlaces y cierre editorial con la estructura de campaña elegida. |
| F20-07 | **P2** | P19-01 sigue abierto: orientación, encuadres y lectura de puertas fuera de la captura de entrada. | Pasada visual desde varias posiciones y con cámara en movimiento en 29 salas. |
| F20-08 | **P2** | Sin escucha humana del lamento ni prueba de mando físico/lector de pantalla. | Sesión manual de audio, control y accesibilidad con acta de aprobado/fallo/no observado. |
| F20-09 | **P3** | Lucius guardia/cartógrafo e Isabelle daga/bastón varían entre diseño, nota y UI. `CAMPANA-12.md`, `DISENO.md` y `REQUISITOS.md` conservan el alcance previo a la implementación; README aún presenta ocho áreas y dice que no hay guardado automático, aunque el código guarda al concluir capítulos históricos. | Resolver continuidad de roles y actualizar la documentación pública y de producción contra el ejecutable actual. |

**P0:** ninguno demostrado por las pruebas ejecutadas. La ausencia de evidencia de campaña integral impide concluir que no exista un P0 oculto.

## 8. Ejecución, rendimiento y reproducibilidad

| Comprobación en esta rama | Resultado y límite |
| --- | --- |
| `npm test` | **38 archivos, 183/183 pruebas**. Lógica y geometría; no sustituye jugar. |
| `npm run build` | Correcto: TypeScript y Vite. |
| `npm run format:check` | Correcto. |
| `git diff --check` | Correcto antes de crear este informe; repetir al final. |
| `npm run test:browser` | Correcto: `browser-smoke`, `browser-systems` y `browser-phase10` terminaron. Primer script: ruta corta limpia 00–04; segundo: estados preparados; tercero: WebGL. |
| `node scripts/browser-historical.mjs` | **No ejecutó escenas** en dos intentos: `/usr/bin/google-chrome` terminó con `SIGTRAP` y `crashpad: setsockopt: Operation not permitted (1)` antes de abrir página. Como los otros scripts y Chrome con pantalla sí arrancaron, el fallo es intermitente y está en el lanzamiento, no localizado en una sala. No se alteró el aislamiento para sortearlo. |
| `node scripts/phase20-room-views.mjs` | Script nuevo de auditoría, con guardados **preparados** y movimiento de teclado por sala. **No ejecutó escenas** en cuatro intentos por el mismo fallo de lanzamiento de Chrome; `node --check` pasó. No se presenta ninguna revisión nueva de dos posiciones como completada. |

Mediciones nuevas: `/usr/bin/google-chrome` 156.0.8078.47 con pantalla X11, WebGL 2 `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`, 1280×720, calidad baja, script `performance-phase10.mjs --headed --hardware`. Son **guardados preparados**, con movimiento/defensa sintéticos. El propio script marcó `scenarioValid=true`, sin errores de consola. Los JSON conservan GPU, número de fotogramas, picos, telemetría y resumen de la peor ventana móvil de 60; **no incluyen la serie completa de intervalos**.

| Muestra física | FPS medio | Peor 60 FPS | Enemigo activo/combate | Datos |
| --- | ---: | ---: | --- | --- |
| 1927 exploración | 56,43 | **49,33** | 0 / 0 | [JSON](capturas/fase20/sanity-fase20-intel-exploration.json) |
| 1927 combate | 55,73 | **47,38** | 1 / 1 | [JSON](capturas/fase20/sanity-fase20-intel-combat.json) |
| 189 exploración | 58,33 | **48,67** | 0 / 0 | [JSON](capturas/fase20/sanity-fase20-intel-189-exploration.json) |
| 189 combate | 60,02 | **60,02** | 1 / 1 | [JSON](capturas/fase20/sanity-fase20-intel-189-combat.json) |
| 1348 exploración | 60,02 | **60,02** | 0 / 0 | [JSON](capturas/fase20/sanity-fase20-intel-1348-exploration.json) |
| 1927 exploración, **60 s** | 60,01 | **59,04** | 0 / 0 | [JSON](capturas/fase20/sanity-fase20-intel-1927-exploration-60s.json) |

Las primeras cinco muestras duran diez segundos; la sexta dura un minuto. Todas superan 45 FPS **solo en esos estados**. Algunas muestras cortas se ejecutaron mientras seguía la batería de navegador, de modo que no son un perfil térmico controlado. Se solicitó además una muestra de **300 segundos** en 1927: Chrome cerró la página durante `page.evaluate`, antes de devolver intervalos, y el script salió con código 1; [metadatos incompletos](capturas/fase20/sanity-fase20-intel-1927-exploration-300s-incomplete.json). No se sabe si fue un límite del entorno, un fallo del navegador o del juego; no se le atribuye FPS ni un bloqueo de progreso. **No ejecutado:** medición de transición, combate de 1348 y de las otras nueve épocas, sesión prolongada completa, revisión de 29 salas desde varias posiciones, partida humana integral, escucha humana, mando físico y lector de pantalla. Los datos previos de Fase 19 son cortos y no se extrapolan.

## 9. Contenido pendiente frente a 1.0

No faltan cuatro archivos de capítulo: las doce épocas tienen escenas, interacciones y código. Falta demostrar que cada una sea **jugable hasta la salida** con controles reales, guardado/carga, combate y puzle comprensibles; falta medir su duración y el comportamiento prolongado en HD 620. Quedan por decidir el carácter opcional de la historia, la suficiencia de las herramientas de época, el efecto real de las decisiones históricas y el cierre con créditos. La guía de prueba manual de Fase 19 sigue sin acta humana.

## 10. Plan priorizado para versión 1.0

1. **Congelar el contrato de campaña.** Elegir explícitamente ruta histórica obligatoria u opcional; corregir grafo, menús, objetivos y condiciones de final para que coincidan. Definir qué cuenta como capítulo concluido.
2. **Ejecutar una partida limpia grabada.** Desde Nueva partida, completar Lucius→Émile y luego el cierre de Élise, sin sembrar estado. Registrar reloj, sala, transición, objeto, muerte, carga y bloqueo. Repetir la ruta alternativa permitida por el diseño final.
3. **Cerrar cada capítulo individualmente.** Una ficha por época con entrada, objetivos, documento, puzle resuelto por pista, enemigo, cordura, herramienta, salida, guardado y carga; corregir los defectos encontrados antes de certificarla.
4. **Pasada visual, audio y accesibilidad.** Revisar 29 salas desde entrada, centro y puertas; hacer escucha humana, mando físico y prueba de lector de pantalla. Cerrar P19-01 y documentar los encuentros especiales.
5. **Rendimiento y estabilidad.** En HD 620 medir exploración, combate y transiciones por zonas, peor 60, sesión larga y recuperación WebGL; conservar trazas crudas y errores. Repetir después de cada corrección relevante.
6. **Revisión editorial de cierre.** Resolver roles contradictorios, persistencia significativa de decisiones, condiciones de todos los finales y créditos. Reejecutar regresión completa y emitir acta 1.0 con alcance exacto.

## 11. Valoración

**5,7/10 para preparación de versión 1.0.** El motor y la ruta corta funcionan, la implementación de doce épocas es real y la batería automatizada pasa. La nota cae por la falta de prueba integral de las once épocas, la discrepancia entre grafo declarado y acceso real, la ausencia de duración y sesión larga completa, y la validación humana pendiente. Una batería verde, cinco muestras Intel de diez segundos y una de un minuto no certifican una campaña completa.

**NO APTO: FALTA CONTENIDO O VALIDACIÓN ESENCIAL.**
