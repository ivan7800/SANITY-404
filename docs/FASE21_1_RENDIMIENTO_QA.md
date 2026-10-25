# Fase 21.1 — Rendimiento Intel y QA histórico

**Fecha:** 25 de octubre de 2026. **Rama:** `fase11/campana-historica`. Se conservaron los cambios anteriores; no se modificó el motor, las escenas, la IA ni la calidad visual. **Dictamen 1.0:** no apto todavía: faltan once combates ganados y una partida histórica íntegra sin estados preparados.

## 1. Diagnóstico causal del rendimiento

El informe de [Fase 18.1](FASE18_1_RENDIMIENTO.md) midió una ventana física de 1280×720 y canvas 1024×576, calidad Baja, Chrome 156 e Intel HD Graphics 620. En combate y planta superior obtuvo peores ventanas de 60 entre 57,16 y 60,02 FPS, con 600 intervalos después de 100 de calentamiento. Identificó un coste del antiguo `box-shadow` del velo y un efecto de composición al recortar una ventana/iframe. [Fase 20](FASE20_AUDITORIA_INTEGRAL.md) midió muestras de diez segundos: 189 combate 60,02 y 1927 combate 47,38 FPS en la peor ventana. [Fase 21](FASE21_CAMPANA_COMPLETA.md) repitió el protocolo corto y observó 29,28–33,98 FPS en combate.

En esta fase se confirmó que las muestras lentas usan **WebGL físico Intel**, canvas 1024×576, calidad Baja (`scale=0,8`, sin sombras activas), enemigo visible y combate activo. El perfil de 189 registró 200 mallas, 201 geometrías, 129 materiales, 12 texturas, 9 mallas transparentes, 80 partículas, 2 mallas de bruma, 1 luz hemisférica, 1 direccional, 1 focal y 5 puntuales; ninguna luz proyecta sombras en Baja. Se observaron 63–65 draw calls en las parejas lentas; 1927 tuvo 112–114. La ventana Playwright emulada informó `inner=1280×720`, `outer=1288×805`, `canvas=1024×576`; su `screen` reportó 1280×720 por emulación. Una ventana nativa alternativa informó `inner=1236×680`, `outer=1280×811`, `screen=1920×1080`. La ventana Chrome conectada a DevTools, distinta de esas muestras, era 881×793 y no se usó como medición de aceptación.

El cuello de botella **no es atribuible a una regresión de Fase 21** en la evidencia disponible. En una comparación A/B de la misma compilación instrumentada de desarrollo y el mismo medidor, el código de `HEAD` previo a Fase 21 y el árbol actual rindieron casi igual bajo contención; más tarde ambos recuperaron unos 59 FPS en 1927 sin cambiar el código. Al principio `/proc/loadavg` marcó **7,13** con cuatro CPU visibles; más tarde marcó **4,18**. La bajada de carga coincide con una caída de la mediana GPU de ~14,6 a ~9,5 ms y la recuperación de la cadencia. Es una **inferencia causal fuerte de contención/planificación externa**, no una identificación del proceso responsable: el sandbox no permitió inspeccionar los procesos anfitriones ni obtener una traza de bajo nivel del compositor o frecuencias de GPU. La cuantización de intervalos a ~16,7/33,3 ms indica VSync y fotogramas perdidos, pero no distingue por sí sola CPU, controlador y compositor.

### A/B reproducibles

| Comparación, escenario válido | Peor 60 A | Peor 60 B | Interpretación |
| --- | ---: | ---: | --- |
| 189 combate, viewport 1280×720 frente a ventana nativa 1236×680 | [33,34](capturas/fase21_1/189-viewport-A.json) | [32,44](capturas/fase21_1/189-window-B.json) | Menor ventana real no recuperó la cadencia; no confirma recorte como causa de esta caída. |
| 189 combate, velo CSS visible frente a oculto temporalmente en el ensayo | [33,34](capturas/fase21_1/189-viewport-A.json) | [34,6](capturas/fase21_1/189-no-veil-B.json) | Mejora pequeña, insuficiente para explicar 29–34 FPS. El juego conserva el velo. |
| 189 exploración, movimiento frente a escena estática | [38,7](capturas/fase21_1/189-moving-A.json) | [36,7](capturas/fase21_1/189-static-B.json) | El movimiento no explica por sí solo la caída. |
| 189 combate, `HEAD` anterior frente a árbol actual, pareja 1 | [34,3](capturas/fase21_1/baseline-189-combat-1.json) | [34,3](capturas/fase21_1/current-189-combat-1.json) | Ambos fallan igual bajo contención; GPU mediana 14,66/14,61 ms. |
| 189 combate, árbol actual frente a `HEAD`, pareja inversa | [34,0](capturas/fase21_1/current-189-combat-2.json) | [34,3](capturas/fase21_1/baseline-189-combat-2.json) | Repetición confirma diferencia menor que la variación entre ejecuciones. |
| 1927 combate, `HEAD` frente a árbol actual tras bajar la carga | [59,0](capturas/fase21_1/baseline-1927-combat.json) | [59,0](capturas/fase21_1/current-1927-combat.json) | Sin caída exclusiva del código actual en el perfil base. |

El A/B de código usa `git archive HEAD` en `/tmp` y compila ambas versiones con `NODE_ENV=development` para conservar los observadores de QA. El juego se sirve desde archivos compilados mediante `page.route`, sin abrir puertos nuevos. `scripts/phase21-1-code-ab.sh` documenta el procedimiento completo; se validó su sintaxis. Las parejas enlazadas se ejecutaron con comandos directos porque el primer ensayo con dos servidores locales recibió `listen EPERM` del sandbox. No se modificó `main` ni se usó un guardado preparado para fingir un recorrido: los guardados de combate solo aíslan el escenario de rendimiento.

### Intel HD Graphics 620, muestras posteriores

| Escenario | Duración | Media | Peor 60 | Estado |
| --- | ---: | ---: | ---: | --- |
| [189 combate actual](capturas/fase21_1/current-189-recovered.json) | 10 s | 60,0 | **60,0** | Válido, ≥45 |
| [1348 combate actual](capturas/fase21_1/current-1348-combat.json) | 10 s | 60,0 | **60,0** | Válido, ≥45 |
| [1927 combate actual](capturas/fase21_1/current-1927-combat.json) | 10 s | 59,9 | **59,0** | Válido, ≥45 |
| [189 combate prolongado](capturas/fase21_1/current-189-combat-60s.json) | 60 s | 60,0 | **59,0** | Válido, ≥45 |
| [1348 combate prolongado](capturas/fase21_1/current-1348-combat-60s.json) | 60 s | 60,0 | **60,0** | Válido, ≥45 |
| [1927 combate prolongado](capturas/fase21_1/current-1927-combat-60s.json) | 60 s | 59,3 | **53,0** | Válido, ≥45 |

Estas muestras recuperadas **no invalidan** las muestras lentas válidas de Fase 21. Demuestran sensibilidad al estado del host y que no hubo que desactivar enemigos, IA, partículas o efectos para superar 45 FPS en periodos menos congestionados. No se midieron transiciones ni una sesión de campaña prolongada; no se certifica un mínimo de 45 FPS bajo cualquier carga del sistema. No se hizo una optimización del motor sin causa de código aislada.

## 2. Chrome y `crashpad EPERM`

Los lanzadores directos `browser-phase21.mjs` y `browser-phase21-chapter-exits.mjs`, y el envoltorio `npm run test:phase21:browser`, terminaron a veces **antes de navegar**: `crashpad: setsockopt: Operation not permitted (1)`, `SIGTRAP`. El fallo apareció con perfiles temporales nuevos y con pantalla; por eso no se atribuye al guardado, a una escena, a un perfil persistente ni a procesos residuales. No se ha identificado la regla exacta de seccomp o la interacción del lanzador con ella. La comparación de opciones de Playwright tampoco dio una explicación suficiente.

El mismo Chrome 156 abrió páginas y completó las baterías dirigidas al invocar **directamente** `node scripts/performance-phase10.mjs` con `--headed --hardware --asset-root=...` en la sesión X11. Este camino usa `chromiumSandbox: true`, conserva el aislamiento de Chrome, omite el argumento inseguro de SwiftShader y sirve recursos locales con `page.route`; no abre un servidor ni cambia protecciones del sistema. El `npm run test:browser` heredado también pasó, aunque sus propios scripts headless ya contienen `--no-sandbox`; esta fase no añadió ni amplió esa excepción.

**Reproducción desde un Terminal de la sesión gráfica normal de Linux Mint:** en esta rama, ejecutar `NODE_ENV=development npx vite build --outDir /tmp/sanity-404-qa` y después, desde la raíz, los tres comandos siguientes, cambiando solo la ruta de salida si se desea:

```bash
node scripts/performance-phase10.mjs --headed --hardware --only=189:combat --chapter-exits --url=http://127.0.0.1:5184/ --asset-root=/tmp/sanity-404-qa --output=docs/capturas/fase21_1/chapter-exits-run.json
node scripts/performance-phase10.mjs --headed --hardware --only=189:combat --chapter-functional --url=http://127.0.0.1:5186/ --asset-root=/tmp/sanity-404-qa --output=docs/capturas/fase21_1/functional-run.json
node scripts/performance-phase10.mjs --headed --hardware --only=189:combat --phase21-cases --url=http://127.0.0.1:5185/ --asset-root=/tmp/sanity-404-qa --output=docs/capturas/fase21_1/finales-dirigidos.json
```

`npm run test:phase21:browser` queda como envoltorio cómodo para una sesión normal, pero **falló en este sandbox** antes de página. Los tres comandos directos sí produjeron evidencia; si el envoltorio vuelve a fallar, usar los directos y registrar la línea `crashpad` sin quitar el sandbox de Chromium. La revisión automática del conector DevTools ya había rechazado un clic porque requería aprobación con política `never`; no se usó evaluación JavaScript para eludirla.

## 3. Matriz de once investigaciones históricas

**Qué se hizo:** pruebas de navegador **dirigidas con estados preparados**. Para cada época se cargó su sala interior, se comprobó protagonista/objetivo, se resolvió el puzle mediante botones de la interfaz con lecturas y herramienta preparadas, se recogió el artefacto en otra carga preparada tras el puzle, se registró un ataque fuerte y se comprobó daño al enemigo. Una batería aparte preparó el estado previo a la salida y verificó regreso al vestíbulo, artefacto y `campaign.completed` tras recarga. Los archivos [funcional completo](capturas/fase21_1/funcional-dirigido.json), [repetición aislada de Isabelle](capturas/fase21_1/funcional-abbey.json) y [salidas](capturas/fase21_1/salidas-dirigidas.json) guardan los resultados. **No son once capítulos jugados de principio a fin**: se sembraron pistas, enemigos derrotados o posición según el caso. Un golpe efectivo no demuestra victoria ni equilibrio del combate.

| Investigación | Sala interior | Objetivo/UI | Puzle | Artefacto | Golpe con daño | Salida + recarga | Clasificación |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| Lucius · 189 | 08 | Sí | Signos | Tablilla | Sí | Sí | Dirigida, parcial |
| Aurelia · 312 | 12 | Sí | Teselas | Molde | Sí | Sí | Dirigida, parcial |
| Maeve · 537 | 14 | Sí | Mareas | Lista | Sí | Sí | Dirigida, parcial |
| Samira · 783 | 16 | Sí | Astrolabio | Disco | Sí | Sí | Dirigida, parcial |
| Idris · 1092 | 18 | Sí | Arco | Plano | Sí | Sí | Dirigida, parcial |
| Oona · 1217 | 20 | Sí | Remedio | Cuaderno | Sí | Sí | Dirigida, parcial |
| Isabelle · 1348 | 10 | Sí | Códice | Códice | Sí | Sí | Dirigida, parcial |
| Tomás · 1491 | 22 | Sí | Planchas | Plancha | Sí | Sí | Dirigida, parcial |
| Inés · 1610 | 24 | Sí | Genealogía | Acta | Sí | Sí | Dirigida, parcial |
| Amara · 1786 | 26 | Sí | Contrapesos | Partitura | Sí | Sí | Dirigida, parcial |
| Émile · 1899 | 28 | Sí | Exposición | Placa | Sí | Sí | Dirigida, parcial |

La primera pasada de combate colocó por error al enemigo detrás del personaje y produjo ataques sin daño. Tras calcular la posición desde el punto de aparición real, las once épocas dieron daño en la última pasada completa; Isabelle también se confirmó aisladamente. La introducción romana y el bloqueo/reentrada de Tomás se comprobaron por separado. [Finales dirigidos](capturas/fase21_1/finales-dirigidos.json): final anticipado con retorno sin bloqueo, prueba material faltante que impide el histórico y final histórico habilitado con las once pruebas y decisiones. Todo ello usa guardados preparados; la ruta limpia de `npm run test:browser` solo llega al final anticipado de 1927.

## 4. Regresiones y defectos pendientes

| Comprobación | Resultado |
| --- | --- |
| `npm test` | **39 archivos, 187/187 pruebas**. |
| `npm run build` | Correcto, TypeScript y Vite de producción. |
| `npm run format:check` | Correcto. |
| `git diff --check` | Correcto; se revisaron también los archivos nuevos no rastreados. |
| `npm run test:browser` | Correcto: ruta corta limpia, sistemas con estados preparados y recuperación WebGL. |
| Batería histórica dirigida | 11 puzles, artefactos, golpes efectivos, salidas y recargas; ambos desenlaces condicionados. Comandos directos con Chrome físico y guardados preparados. |
| `npm run test:phase21:browser` | Falló al lanzar Chrome antes de página en este sandbox; los comandos directos equivalentes pasaron. |

**P1:** falta una partida sin manipulación desde Nueva partida por Lucius→Émile hasta el final histórico; faltan victoria real de cada combate, documentos leídos y decisiones tomadas durante esa partida, registro de duración/muertes y recuperación. **P1:** el umbral de 45 FPS falla bajo contención alta aun con el código anterior; se requiere protocolo de aceptación con carga de host controlada y seguimiento durante sesión larga. **P2:** investigar el `crashpad EPERM` a nivel de sandbox/lanzador y hacer estable el envoltorio de QA. **P2:** revisar transiciones, 29 salas en movimiento, audio, mando físico y lector de pantalla. **P0 demostrado:** ninguno; un P0 oculto no puede descartarse sin recorrido completo.

## 5. Recomendación

Conservar la implementación de Fase 21 y el velo visual: las A/B no justifican una reducción de calidad o un cambio especulativo del motor. Para aceptar rendimiento, ejecutar tres repeticiones de al menos 60 segundos por escenario en la sesión gráfica física, con carga de host registrada y sin procesos pesados paralelos; rechazar la muestra si cambia GPU, resolución, calidad, estado de combate o visibilidad. Ampliar a transiciones y una sesión larga. Para aceptar campaña, jugar los once episodios consecutivamente desde Nueva partida, sin sembrar estado, ganando combates y resolviendo pistas por sus documentos, y conservar traza por transición.

**NO APTO PARA VERSIÓN 1.0:** mejoró mucho la evidencia dirigida y se aisló la supuesta regresión de código, pero aún falta la validación integral exigida por Fase 20 y Fase 21.
