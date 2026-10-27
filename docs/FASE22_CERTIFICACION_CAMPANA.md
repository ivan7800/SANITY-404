# Fase 22 — Certificación integral de campaña

**Fecha de inicio:** 25 de octubre de 2026. **Rama:** `fase11/campana-historica`. **Base publicada al preparar Fase 22.4:** `7f5ae98`. **Dictamen actual:** campaña principal completa en una ejecución real; **GOLD MASTER y versión 1.0 aún no certificados**.

## Resultado más reciente · 27 de octubre de 2026

La [traza íntegra de Linux Mint](capturas/fase22/campana-completa-trace.json) inició **Nueva partida**, completó cronológicamente las once investigaciones históricas, guardó y recargó entre capítulos, completó la investigación de Élise y alcanzó el [desenlace histórico](capturas/fase22/final-final-historico.png). El JSON registra `completed: true`, 2808/2808 checks aprobados, `ending.type: historical`, doce capítulos en `ending.completed` y cero errores JavaScript. Duración total aproximada: **806 s**. Las duraciones automatizadas de Lucius a Émile fueron, en segundos: 46,843; 38,344; 38,504; 36,824; 44,238; 35,946; 36,696; 55,588; 60,864; 64,975; 61,738. El tramo final de Élise duró 85,269 s.

La matriz y los incidentes posteriores conservan el estado de cada intento anterior como **historial**, no como dictamen vigente. Siguen pendientes la certificación visual de las 29 salas, la repetición de otros finales en la versión actual y las métricas de rendimiento completas en hardware de referencia. No se declara GOLD MASTER.

## 1. Alcance y criterio de evidencia

Esta fase exige una única partida originada en **Nueva partida**, con los once capítulos históricos terminados en orden, combates ganados, puzles resueltos, artefactos recogidos y guardados/recargas legítimos antes del final histórico de 1927. Una prueba unitaria, un guardado preparado o un ataque que baja la salud de un enemigo no acredita una victoria ni una transición jugada. Se leyeron `FASE20_AUDITORIA_INTEGRAL.md`, `FASE21_CAMPANA_COMPLETA.md`, `FASE21_1_RENDIMIENTO_QA.md` y `CAMPANA-12.md` antes de probar.

El resultado de esta fase es **parcial**. Una ejecución anterior de `npm run test:browser` completó la **ruta corta limpia** de Élise desde Nueva partida hasta el final anticipado. La [última traza real de Linux Mint](capturas/fase22/campana-completa-bloqueo-sala5-linux-mint.json) de `--through=final` acredita **siete capítulos históricos consecutivos hasta Isabelle** desde una sola Nueva partida, con regreso, guardado y recarga; Isabelle duró 30,287 s. Después se detuvo en la sala 5 camino de `greenhouse-door`. Esa traza contiene 441 comprobaciones, un fallo final de navegación automatizada y ningún final histórico. Tomás, Inés, Amara, Émile y el final de Élise siguen sin certificación. Las correcciones de colisiones de la Operación Rescate Total aún no tienen una nueva ejecución de campaña completa y no sustituyen esta evidencia histórica.

## 2. Matriz de doce capítulos

**Leyenda:** `—` = sin medición o evidencia de esta fase; `no` = criterio sin acreditar en partida continua. La columna de recorrido exige entrada, introducción, exploración y salida reales. La recarga de 1927 corresponde solo al tramo inicial de la ruta corta, no al capítulo histórico completo. Las duraciones históricas medidas son tiempos de automatización, no tiempos humanos.

| # | Investigación | Recorrido integral | Documentos y pistas | Puzle completado jugando | Enemigo derrotado | Artefacto | Salida, guardado y recarga | Siguiente desbloqueado | Duración real | Estado F22 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lucius · 189 | Entrada, introducción, exploración y salida sí | Documento 8 y tres testimonios leídos | Inscripción resuelta, Marca de Varro | Sí · `enemy8` | Tablilla obtenida | Regreso, autoguardado y recarga sí | Aurelia · portal a sala 11 | 33,435 s en prueba cuádruple | **Certificado en Linux Mint** |
| 2 | Aurelia · 312 | Entrada, introducción, galería, horno y salida sí | Documentos 11 y 12, cinabrio | Teselas resueltas, boceto recompuesto | Sí · `enemy12` | Molde obtenido | Regreso, autoguardado y recarga sí | Maeve · portal a sala 13 | 32,190 s en prueba cuádruple | **Certificada en Linux Mint** |
| 3 | Maeve · 537 | Entrada por `coast-portal`, muelle, depósito y salida sí | Documentos 13 y 14, tabla de mareas | Registro corregido en `coast-ledger` | Sí · `enemy14` | Lista de pasajeros obtenida | Regreso, autoguardado y recarga sí | Samira · `stars-portal` a sala 15 | 31,969 s en prueba cuádruple | **Certificada en Linux Mint** |
| 4 | Samira · 783 | Entrada por `stars-portal`, terraza, cúpula y salida sí | Documentos 15 y 16, carta astral | Astrolabio alineado: alba, ocaso, noche | Sí · `enemy16` | Disco estelar obtenido | Regreso, autoguardado y recarga sí | Idris · `quarry-portal` a sala 17 | 30,242 s en prueba cuádruple | **Certificada en Linux Mint** |
| 5 | Idris · 1092 | Entrada por `quarry-portal`, cantera, cámara y salida sí | Documentos 17 y 18, cuña marcada | Arco ensamblado: base, clave, cierre | Sí · `enemy18` | Plano del umbral obtenido | Regreso, autoguardado y recarga sí | Oona · `hospital-portal` a sala 19 | 34,546 s en prueba quíntuple | **Certificado en Linux Mint** |
| 6 | Oona · 1217 | Entrada, introducción, exploración y salida sí | Documentos 19 y 20, hierbas y testimonio | Remedio identificado | Sí · `enemy20` | Cuaderno obtenido | Regreso, guardado y recarga sí | Isabelle · `medieval-portal` a sala 9 | 35,351 s en traza real parcial | **Capítulo acreditado en Linux Mint** |
| 7 | Isabelle · 1348 | Entrada, introducción, scriptorium y salida sí | Documentos 9 y 10 leídos | Manuscrito resuelto | Sí · `enemy10` | Códice obtenido | Regreso, guardado y recarga sí | Tomás · portal de imprenta | 30,287 s en última traza real | **Capítulo acreditado en Linux Mint** |
| 8 | Tomás · 1491 | No | — | No | No · tipógrafo | No · plancha | No | No acreditado · Inés | — | Sin certificar |
| 9 | Inés · 1610 | No | — | No | No · retrato guardián | No · acta | No | No acreditado · Amara | — | Sin certificar |
| 10 | Amara · 1786 | No | — | No | No · autómata | No · partitura | No | No acreditado · Émile | — | Sin certificar |
| 11 | Émile · 1899 | No | — | No | No · sombra de revelado | No · placa | No | No acreditado · Élise | — | Sin certificar |
| 12 | Élise · 1927 | Parcial · 00–04 | Carta inicial leída; resto — | Caja y tres sellos, ruta corta | No se exigió ni acreditó victoria | Llave y medallón, ruta corta | Un guardado y una recarga al inicio; salida anticipada sí | Final histórico no acreditado | — | Parcial, sin certificar |

**Combates históricos ganados en esta fase: 7/11 acreditados.** Los enemigos de los siete primeros capítulos cayeron por ataques reales; también se derrotó a la sombra de la mansión `enemy0` entre capítulos. Las trazas contienen defensas, daño, resistencia y derrotas persistentes. **Puzles históricos completados: 7/11. Artefactos históricos obtenidos: 7/11. Recargas históricas por capítulo: 7/11.** Los cuatro capítulos históricos posteriores y el final histórico siguen sin certificación completa.

## 3. Recorrido continuo y finales

La traza textual de `npm run test:browser` dio diez hitos `PASS` en `browser-smoke.mjs`, incluidos «WebGL y nueva partida», «Movimiento e interacción de guardado», «Carga de partida», «Documento y diario», «Puzle de la mansión y medallón», «Tres puzles, cripta, capilla y acceso a ruinas» y «Ruta corta y final anticipado explícito». Terminó con `errors: []`. Esta es evidencia de **un final anticipado** desde el menú real; no es evidencia del final histórico después de las once investigaciones. Los otros dos scripts de la batería prueban sistemas mediante estados preparados y pérdida/recuperación de WebGL, respectivamente.

El código de `historicalEndingReadiness` exige las once marcas `campaign.completed`, los once artefactos, `Memoria reconciliada`, el descubrimiento `adrien` y una elección persistente entre Lucius e Isabelle. `offerEnding` solo presenta «Cerrar con las pruebas» cuando esa función devuelve `ready`; el final anticipado se ofrece por separado. Las pruebas unitarias y las pruebas dirigidas anteriores cubren condiciones aisladas, pero **la exigencia y el desenlace histórico no se comprobaron jugando la secuencia en esta fase**. Por ello no se declara validado el final histórico. Los seis primeros capítulos tienen duración automatizada medida; los seis capítulos restantes y la campaña total aún no.

## 4. Bloqueo de navegador y reproducción

1. En el sandbox de QA, Chrome 156 salió **antes de crear la página** con `third_party/crashpad/crashpad/util/linux/socket.cc:45 setsockopt: Operation not permitted (1)` y `SIGTRAP`. Se probó tanto el lanzamiento headless heredado de la batería estándar como el perfil headed `chromiumSandbox: true` de Fase 21.1; ambos fallaron antes de navegar. Reintentos posteriores reprodujeron el mismo fallo. Es un límite de este entorno, no una refutación de la ejecución válida de Lucius en Linux Mint.
2. Un intento con Firefox del sistema mediante Playwright terminó al iniciar con `SIGSEGV`, también antes de cargar el juego. No constituye un defecto demostrado de SANITY-404.
3. El conector Chrome DevTools sí navegó al menú de `127.0.0.1:5174` y mostró el botón «Nueva partida». Su revisión automática **rechazó el clic** con `MCP tool call requires approval, but approval policy is never`. No se utilizó `evaluate_script` ni otra inyección para eludir esa decisión. Esta política impide continuar la partida mediante ese conector en la sesión actual.
4. En contraste, `npm run test:browser` sí lanzó Chrome y terminó la ruta corta limpia. En Linux Mint, la [traza de inicio](capturas/fase22/trace.json) y la [captura de entrada](capturas/fase22/roman-enter.png) muestran la entrada romana. La ejecución completa posterior queda en [la traza certificada de Lucius](capturas/fase22/lucius-certificado-linux-mint.json): documento 8, `roman-formation`, tres `roman-echo-*`, ataques y defensas, `enemy8` derrotado, inscripción, tablilla, regreso, guardado, recarga y `mosaic-portal` destino 11. El fallo de lanzamiento del sandbox es intermitente y no prueba un defecto del juego.

`scripts/phase22-start-probe.mjs` conserva el modo Lucius por defecto y amplía `--through` hasta `final`. Comparte funciones de navegación, interacción, combate, puzle, transición, captura y carga. Registra cada condición como `PASS`/`FAIL`, captura estados y devuelve código distinto de cero ante fallo. Lee `window.sanityInspect`, `window.sanityRoomAudit` y el guardado solo para verificar; no modifica `localStorage` ni prepara enemigos. La espera de cada portal comprueba el número real de sala antes de evaluarlo. **Lucius→Idris pasó en Linux Mint; el recorrido posterior está preparado para prueba real, sin certificación todavía.**

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

El script usa Chrome con pantalla y sandbox de Chromium. Cada ejecución `--through=aurelia` reescribe [`lucius-aurelia-trace.json`](capturas/fase22/lucius-aurelia-trace.json) y las capturas `acumulativa-*.png`; la [traza válida de Linux Mint](capturas/fase22/lucius-aurelia-certificado-linux-mint.json), la traza independiente de Lucius y la traza anterior del bloqueo se conservan aparte. El cierre exige `completed: true`, todos los checks `passed: true`, dos entradas en `chapters`, `enemy8` y `enemy12` derrotados, tablilla y molde persistentes tras recarga, y `coast-portal` con destino 13. Esa evidencia ya se obtuvo en Linux Mint.

### Fase 22.3 · Maeve desde la misma Nueva partida

Con Vite activo en el puerto 5174, ejecutar desde un terminal normal de Linux Mint:

```bash
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=maeve
```

La ruta continúa tras la recarga de Aurelia: cruza `coast-portal`, lee los documentos de las salas 13 y 14, recoge la tabla de mareas, derrota al custodio ahogado `enemy14`, corrige el registro con la fecha y marea deducidas, recoge la lista de pasajeros, regresa por el muelle y recarga. La [traza satisfactoria preservada](capturas/fase22/lucius-aurelia-maeve-certificado-linux-mint.json) contiene tres capítulos, 149/149 checks aprobados, `enemy8`, `enemy12` y `enemy14` derrotados, tablilla, molde y lista persistentes tras recarga, y `stars-portal` hacia Samira. Las capturas `triple-*.png` incluyen [introducción](capturas/fase22/triple-coast-portal-introduccion.png), [lista](capturas/fase22/triple-lista-maeve.png) y [regreso](capturas/fase22/triple-coast-537-regreso.png). **Maeve quedó certificada en Linux Mint con salida 0.**

El [intento anterior de Fase 22.3 en este sandbox](capturas/fase22/sandbox-f22-3/lucius-aurelia-maeve-trace.json) terminó antes de crear la página: Chrome registró `crashpad setsockopt: Operation not permitted` y `SIGTRAP`. El JSON conserva `completed: false`, cero checks jugables y el error de lanzamiento. Se preserva como evidencia del límite del entorno; la ejecución posterior de Linux Mint sí completó el capítulo.

### Fase 22.4 · Samira desde la misma Nueva partida

Con Vite activo en 5174, ejecutar desde un terminal normal de Linux Mint:

```bash
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=samira
```

El recorrido continuó tras la recarga de Maeve: entró por `stars-portal` a la terraza 15, leyó el documento, recogió la carta astral, cruzó a la cúpula 16, leyó el segundo documento, derrotó a `enemy16`, alineó el astrolabio en orden alba→ocaso→noche, recogió el disco estelar, regresó a 1927 y recargó. La [traza satisfactoria preservada](capturas/fase22/lucius-aurelia-maeve-samira-certificado-linux-mint.json) acredita cuatro capítulos, 201/201 checks, `enemy16` derrotado, disco persistente, 61 PS finales, `quarry-portal` desbloqueado y ningún error JavaScript. Las capturas `cuadruple-*.png` incluyen [introducción](capturas/fase22/cuadruple-stars-portal-introduccion.png), [disco](capturas/fase22/cuadruple-disco-samira.png) y [regreso](capturas/fase22/cuadruple-stars-783-regreso.png). **Samira quedó certificada en Linux Mint con salida 0.**

El [intento anterior de Samira en este sandbox](capturas/fase22/sandbox-f22-4/lucius-aurelia-maeve-samira-trace.json) salió con código 1 antes de crear una página; Chrome registró `crashpad EPERM`/`SIGTRAP`. La traza tiene `completed: false`, cero checks y ningún capítulo jugado. Se conserva como diagnóstico del entorno; la ejecución posterior de Linux Mint sí completó el capítulo.

### Fase 22.5 · Idris desde la misma Nueva partida

Con Vite activo en 5174, ejecutar desde un terminal normal de Linux Mint:

```bash
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=idris
```

El recorrido continuó tras la recarga de Samira: cruzó `quarry-portal`, leyó los cuadernos de las salas 17 y 18, recogió la cuña marcada, derrotó al obrero petrificado `enemy18`, ensambló el arco en orden base→clave→cierre, obtuvo el plano del umbral, regresó a 1927 y recargó. La [traza satisfactoria preservada](capturas/fase22/lucius-aurelia-maeve-samira-idris-certificado-linux-mint.json) acredita cinco capítulos, 253/253 checks, `enemy18` derrotado, plano persistente, 43 PS finales, `hospital-portal` desbloqueado y ningún error JavaScript. Las capturas `quintuple-*.png` incluyen [introducción](capturas/fase22/quintuple-quarry-portal-introduccion.png), [plano](capturas/fase22/quintuple-plano-idris.png) y [regreso](capturas/fase22/quintuple-quarry-1092-regreso.png). **Idris quedó certificado en Linux Mint con salida 0.**

### Continuación preparada · Oona a Élise

Con Vite en el puerto 5174, un solo comando comienza en **Nueva partida** y solicita los once capítulos históricos y el final de 1927:

```bash
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

El modo cubre Oona (`enemy20`, remedio, cuaderno y testimonio), Isabelle (`enemy10`, sello y códice), la reconciliación y decisión persistente, el cuaderno de Adrien, Tomás (`enemy22`), Inés (`enemy24`), Amara (`enemy26`), Émile (`enemy28`) y los tres sellos de Élise. Tras cada capítulo histórico comprueba salida, guardado, recarga, artefacto, enemigo derrotado y siguiente portal. En 1927 exige que se ofrezca y se muestre el **final histórico**. Produce `campana-completa-trace.json` y capturas `final-*.png`. **La existencia del código no certifica los capítulos sin una ejecución completa con salida 0 y traza válida.**

El [intento integral de este sandbox](capturas/fase22/sandbox-campana-completa/campana-completa-trace.json) salió con código 1 antes de crear una página: Chrome registró `crashpad setsockopt: Operation not permitted` y `SIGTRAP`. Su JSON conserva `completed: false`, cero checks y ningún capítulo jugado. Un [intento diagnóstico aislado](capturas/fase22/sandbox-diagnostico-integral/campana-completa-trace.json) con Chromium sin su sandbox interno terminó igual; esa opción no quedó en el script. Es un bloqueo del navegador en el entorno, no evidencia de un defecto del juego ni una certificación de los capítulos nuevos.

### Fase 22.2.1 · bloqueo entre Lucius y Aurelia

La [traza real del bloqueo en Linux Mint](capturas/fase22/lucius-aurelia-bloqueo-linux-mint.json) conserva 48 checks hasta la recarga de Lucius. A los 39,068 ms el personaje estaba en sala 0, `x=0`, `z=-4,2`, salud 90, con la sombra `enemy0` activa y a unos 2,5 m. Tras intentar ir en línea recta hacia `x=5,2` a `z≈−0,69`, la prueba terminó a los 53,906 ms en `x=2,65383`, salud 0 y sombra viva en estado `recover`. La sala romana, su victoria, el guardado y la recarga sí habían pasado; Aurelia aún no se había abierto.

La causa combina **colisión y combate legítimos con un fallo del navegador automatizado**. La mesa del vestíbulo (`src/world/scene.ts`, centro `x=4,z=1`, ancho 2, fondo 3) bloquea al jugador con radio 0,34 cuando se aproxima desde el oeste en esa franja; su límite es `x=4−(1+0,34)=2,66`, coherente con `x=2,65383` de la traza. La IA de la sombra persigue al jugador y sus golpes hacen 12 puntos antes de defensa; el estado final `recover` y la salud agotada son compatibles con esa regla, sin evidencia de daño anómalo. El antiguo `go()` mantenía pulsada `D` hasta llegar o morir, sin detectar que la posición dejaba de avanzar. **No hay evidencia de un defecto del juego ni motivo para cambiar daño, colisión o dificultad.**

La corrección de automatización comprueba salud y avance en cada tramo corto, registra amenazas y daño con posición/estado del enemigo, defiende durante una preparación de ataque y aborta ante colisión antes de seguir hacia la muerte. Al recargar Lucius, el recorrido enfrenta a la sombra con ataques normales hasta registrar `enemy0` derrotado. Después bordea la mesa por `z=3,1`, llega a `x=6,2` y desciende junto a la pared derecha hasta el portal de Aurelia; la entrada espera a observar `room=11` antes de marcar el check. **La corrección pasó en Linux Mint:** la traza acumulativa registra `enemy0`, `enemy12`, `mosaic-312`, el molde, la recarga y el portal de Maeve.

En Fase 22.2.1 pasaron `npm test` (39 archivos, 187/187), `npm run build` y `npm run format:check`. El [intento de navegador en el sandbox](capturas/fase22/sandbox-f22-2-1/lucius-aurelia-trace.json) terminó antes de crear la página por `crashpad EPERM`/`SIGTRAP`, con `completed: false` y ningún check jugable. No se añade a la evidencia de éxito. La posterior ejecución válida de Linux Mint se conserva por separado.

## 5. Rendimiento y estabilidad

| Medida F22 | Resultado | Límite |
| --- | --- | --- |
| FPS durante campaña completa | — | No hubo campaña ni muestreo continuo. No se extrapolan los diez segundos o pruebas A/B de fases anteriores. |
| Intel HD Graphics 620 | Detectada por `lspci` como `8086:5916`; `/dev/dri` no existe en este contenedor | La GPU anfitriona no está disponible para una medición WebGL física verificable aquí. |
| Memoria JS/GPU durante campaña | — | No se tomó serie temporal ni instantánea comparable durante los doce capítulos. |
| Errores JavaScript | 0 en la ruta corta limpia de `browser-smoke.mjs` y 0 en la ejecución acumulativa Lucius→Oona | Isabelle→Élise aún no tienen ejecución completa. |
| WebGL | Pérdida, recuperación, reanudación y redimensionamiento: `PASS` en `browser-phase10.mjs` | Prueba dirigida, separada de la campaña. |
| Cierre de navegador | Chrome `crashpad EPERM`/`SIGTRAP` antes de página; Firefox `SIGSEGV` antes de página | Se clasifica como bloqueo del entorno de ejecución, sin atribuirlo al juego. |

No se emite un resultado de aceptación de 45 FPS para Intel. La Fase 21.1 ya documenta resultados variables bajo contención y solicita repeticiones físicas controladas; esta sesión no aporta una muestra nueva válida.

### Salud, curación y recursos de la partida continua

La traza válida de cinco capítulos registra **90, 70, 65, 61 y 43 PS** al regresar de Lucius, Aurelia, Maeve, Samira e Idris, respectivamente. Ninguno de esos capítulos usó un guardado preparado ni una curación artificial. El descenso acumulado obliga a comprobar recursos antes de continuar; **43 PS no demuestra todavía que los seis combates restantes sean viables**.

El código del juego permite recoger tónicos mediante interacción normal en las salas 0, 1, 2, 3, 5, 6 y 7; cada tónico consumido mediante `H` resta una unidad del inventario y restaura hasta **40 PS y 25 de cordura**, con máximos de 100. Los capítulos históricos 8–28 no generan tónicos. Tras reconciliar tablilla y códice, la elección persistente «Juramento de Lucius» puede restaurar hasta **30 PS** una sola vez. La ruta nueva recoge el tónico de la mansión tras Idris, los de archivo e invernadero al obtener la decisión y el cuaderno de Adrien, y los de biblioteca, cripta y capilla durante el cierre de 1927. Registra salud, cordura, resistencia, tónicos recogidos y consumo en `resources` y en las acciones del JSON. Esas recogidas y curaciones posteriores a Idris **aún no tienen evidencia de una ejecución completa**; el balance real dependerá del daño sufrido y de los límites de 100 PS.

## 6. Verificación ejecutada y cambios

| Comando o comprobación | Resultado |
| --- | --- |
| `npm test` | **39 archivos, 187/187 pruebas aprobadas.** |
| `npm run build` | Correcto: TypeScript y Vite de producción. |
| `npm run format:check` | La primera pasada señaló el nuevo script de diagnóstico; se formateó con Prettier y se repitió la comprobación. |
| `npm run test:browser` | En Fase 22.3, primer intento con URL predeterminada `localhost:5173`: conexión rechazada porque Vite estaba en 5174. Primer intento con URL correcta: falló el check de foco de teclado tras tres hitos con WebGL de software lento. Segunda ejecución con `SANITY_TEST_URL=http://127.0.0.1:5174/`: salida 0, diez hitos de ruta corta, batería de sistemas y recuperación WebGL aprobados, cero errores JavaScript. No acredita la campaña histórica. |
| `node scripts/phase22-start-probe.mjs` | Lucius completo: ejecución independiente de Linux Mint, 42/42 checks. `--through=aurelia`: 101/101 checks, 89.201 ms. `--through=maeve`: 149/149 checks, 131.166 ms. `--through=samira`: 201/201 checks, 165.442 ms. `--through=idris`: 253/253 checks, 204.013 ms. Todas esas ejecuciones fueron válidas en Linux Mint, con salida 0. `--through=final`: pendiente. |
| `git diff --check` | Revisado al cierre de esta fase. |

**Defectos del juego corregidos:** ninguno. El bloqueo de Fase 22.2.1 se debió a navegación contra una colisión y exposición normal a la sombra, no a reglas de juego defectuosas. **Cambios de automatización:** espera observable de transición, navegación que detecta salud, amenaza y estancamiento, combate legítimo contra `enemy0`, rodeo de la mesa y rutas acumulativas. Oona también está acreditada por la traza posterior; Isabelle→Élise requieren completar la prueba real. No se alteró contenido del juego.

**Verificaciones repetidas en Fase 22.2:** `npm test` 39 archivos y 187/187 pruebas aprobadas; `npm run build` correcto; `npm run format:check` correcto; `SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser` correcto, incluida ruta corta limpia y recuperación WebGL. La batería estándar no sustituye `--through=aurelia`.

**Verificaciones de Fase 22.3:** `npm test` 39 archivos y 187/187 aprobadas; `npm run build` y `npm run format:check` correctos; `SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser` correcto en la segunda ejecución. El modo `--through=maeve` no pudo comenzar en el sandbox por el fallo de lanzamiento de Chrome descrito arriba; posteriormente pasó en Linux Mint. No se cambió el videojuego; solo el recorrido automatizado y este acta.

**Verificaciones de Fase 22.4:** `npm test` 39 archivos y 187/187 aprobadas; `npm run build` y `npm run format:check` correctos; `SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser` completó la ruta corta, la batería de sistemas y la recuperación WebGL con salida 0. La ruta acumulativa de Samira no pudo empezar en el sandbox por el fallo de lanzamiento de Chrome descrito arriba, pero pasó después en Linux Mint.

**Verificaciones de preparación de Idris:** `node --check scripts/phase22-start-probe.mjs`, `npm test` (39 archivos, 187/187), `npm run build`, `npm run format:check` y `git diff --check` correctos. La ruta `--through=idris` pasó después en Linux Mint. Las verificaciones de la nueva ruta integral se registran más abajo.

**Verificaciones de la ruta integral preparada:** `npm test` 39 archivos y 187/187 pruebas aprobadas; `npm run build` correcto; `npm run format:check` correcto; `SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser` completó con salida 0 los diez hitos de ruta corta, la batería de sistemas y la recuperación WebGL. La ejecución específica `--through=final` quedó bloqueada antes de página por Chromium, como se indica arriba.

## 7. Defectos pendientes y dictamen

| Prioridad | Pendiente | Cierre exigido |
| --- | --- | --- |
| P1 | Continuar Isabelle→Émile→Élise después de los seis capítulos acreditados, sin estados preparados | Traza continua con entrada, introducción, documentos, puzle, victoria real, artefacto, salida, guardado, recarga y desbloqueo por capítulo; tiempos y capturas verificables. |
| P1 | Final histórico sin prueba de navegador desde esa partida | Demostrar requisitos persistentes y ver el desenlace tras las once victorias. |
| P1 | Rendimiento y estabilidad de sesión larga en Intel HD 620 | Dispositivo `/dev/dri` accesible, tres repeticiones comparables de exploración, combate y transiciones, peor ventana de 60 fotogramas ≥45 FPS, errores y memoria registrados. |
| P2 | Lanzamiento intermitente de Chrome en el sandbox de QA | Diagnóstico de `crashpad EPERM` y ejecución repetible del recorrido sin rebajar las protecciones del entorno. |
| P2 | Revisión humana de legibilidad, audio, 29 salas en movimiento, mando y accesibilidad | Acta separada con hallazgos verificables. |

**Dictamen fundamentado: NO APTO PARA 1.0.** La ruta corta con final anticipado y la cadena Lucius→Aurelia→Maeve→Samira→Idris→Oona desde Nueva partida tienen evidencia válida. La condición central de Fase 22 —doce investigaciones y final histórico desde una sola partida legítima— carece de evidencia; quedan cinco victorias históricas y una medición Intel de campaña. No se infiere un fallo de juego en los capítulos pendientes; se mantiene el bloqueo de certificación hasta completar la campaña y corregir cualquier defecto real que aparezca.

## 8. Ejecución real posterior y corrección de ruta a Oona

El 25 de octubre de 2026 se ejecutó en Linux Mint `--through=final` desde **Nueva partida**. Se preservaron [la traza íntegra del fallo](capturas/fase22/campana-completa-bloqueo-oona-linux-mint.json) y [la captura final](capturas/fase22/final-bloqueo-oona.png) antes de repetir la prueba. El JSON registra 258/259 checks aprobados, cero errores JavaScript de página, cinco capítulos terminados y persistidos, y 216.098 ms hasta el fallo. Oona no llegó a abrirse; los capítulos 6–12 siguen sin certificar. La única condición fallida fue `Ruta libre hacia z=-3.3`: sala 0, `x=6,17`, `z=-0,99`, 78 PS, enemigo invisible. No fue una muerte ni un fallo WebGL.

La ruta automatizada iba por `x=6,2` junto al lado oriental de la escalera. La barandilla de `mansion.ts` centrada en `x=6,49` es sólida y su volumen con radio de jugador empieza cerca de `x=6,07`; la posición observada coincide con esa colisión normal. `scripts/phase22-start-probe.mjs` ahora baja por el pasillo de planta baja en `x=2,4` y se acerca al `hospital-portal` mediante controles de movimiento e interacción. `tests/road-hospital.test.ts` comprueba el obstáculo original y muestrea el nuevo corredor hasta `z=-3,3`. La prueba dirigida del corredor pasó. **La corrección de la ruta aún requiere una nueva ejecución real de Linux Mint; no acredita Oona.**

En esta sesión, la repetición de `--through=final --headless` en el sandbox falló al lanzar Chromium, antes de crear la página: `crashpad setsockopt: Operation not permitted` y `SIGTRAP`. El diagnóstico está en [la traza del sandbox](capturas/fase22/sandbox-remaster-campaign/campana-completa-trace.json). Por ello no hay un nuevo recorrido posterior a Idris ni capturas finales verificadas. El comando real para la próxima ejecución sigue siendo:

```bash
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

La remasterización de interfaz y su QA visual se documentan por separado en [REMASTER_UI_QA.md](REMASTER_UI_QA.md). Los 188 tests unitarios, la compilación y la batería estándar de navegador pasaron con los cambios; el nuevo recorrido visual móvil aún no tiene una ejecución completa. El dictamen de preparación para 1.0 permanece **NO APTO** hasta completar la campaña, validar el final histórico y medir el rendimiento físico.

## 9. Corrección de Isabelle y revisión preventiva

La siguiente ejecución real de Linux Mint de `--through=final` superó el corredor corregido de Oona. La [traza preservada](capturas/fase22/campana-completa-bloqueo-isabelle-linux-mint.json) registra 332/333 checks, seis capítulos terminados desde Nueva partida, `enemy20` derrotado, remedio y testimonio resueltos, cuaderno obtenido, guardado/recarga y `medieval-portal` desbloqueado. Oona duró **35,351 s** y terminó con 78 PS. En sala 10 de Isabelle se leyeron documentos y se derrotó realmente a `enemy10`; el capítulo se interrumpió antes del manuscrito y el códice. La [captura del fallo](capturas/fase22/final-bloqueo-isabelle.png) y el estado `x=-1,755,z=-2,492` sitúan la colisión en el atril de `medieval-abbey.ts` centrado en `x=-2,7,z=-2,5`. El enemigo ya estaba muerto; no hay indicio de un bloqueo de combate ni de un defecto del mundo.

La automatización ahora lee exclusivamente la geometría de colisión publicada por el observador **solo de desarrollo** y calcula una ruta ortogonal libre antes de mantener pulsados los controles normales. Conserva el orden de ejes de las rutas anteriores cuando están libres, prueba el otro orden cuando una mesa o barandilla corta el paso y usa una cuadrícula para rodear obstáculos cuando ambos órdenes fallan. Cada tramo sigue caminándose con Playwright; no cambia coordenadas, salud, inventario ni progreso del juego. La regresión usa los obstáculos reales de Isabelle y revisa las rutas representativas de Tomás, Inés, Amara, Émile, los portales de mansión y las salas finales de Élise. En esta corrección pasaron `npm test` (40 archivos, 190/190), compilación, formato y la batería estándar de navegador (salida 0). El intento de campaña en el sandbox se detuvo antes de abrir la página por `crashpad EPERM`/`SIGTRAP`; [su traza](capturas/fase22/sandbox-final-correcciones/campana-completa-trace.json) no acredita Isabelle ni el final.

## 10. Ajuste del margen del planificador y portal de Maeve

La prueba posterior de Linux Mint detuvo `--through=final` tras Lucius y Aurelia, antes de entrar a Maeve: [traza preservada](capturas/fase22/campana-completa-bloqueo-margen-maeve-linux-mint.json) y [captura](capturas/fase22/final-bloqueo-margen-maeve.png). En sala 0, desde `x=6,01991,z=3,04284`, el planificador rechazó `x=-6,2,z=3,1` sin caminar. El pilar occidental de la mansión, centrado en `x=-6,8,z=3`, deja ese punto libre para el radio real del personaje (0,34), pero dentro del margen preventivo 0,46 del planificador. No se detectó un nuevo defecto del juego: el observador proporcionó los obstáculos correctos y la ruta antigua había cruzado el vestíbulo.

`phase22-navigation.mjs` ahora busca el punto libre más próximo al destino solicitado dentro de una tolerancia explícita. Las interacciones pueden terminar dentro de su radio legítimo de 1,9 m, con margen para el movimiento, y `useObject` sigue comprobando el nombre real del prompt antes de pulsar E. Las rutas sin interacción admiten solo 0,2 m de ajuste. Los tramos calculados se recorren con teclas normales y conservan vigilancia de salud y colisiones. La regresión reproduce las coordenadas exactas de Linux Mint y comprueba trayectos largos entre portales de Maeve, Samira, Oona e Isabelle, además de los obstáculos del scriptorium y los capítulos posteriores. Con la corrección pasaron `npm test` (40 archivos, 192/192), `npm run build`, `npm run format:check` y `npm run test:browser` (salida 0, ruta corta y WebGL incluidos). La ejecución completa con esta corrección **aún no tiene resultado real**; las seis investigaciones previamente acreditadas no se sustituyen por este intento fallido.

El [QA visual de Linux Mint](capturas/remaster/ui-qa-certificado-linux-mint.json) terminó con código 0, 18/18 checks y cero errores JavaScript; se conserva independientemente de la campaña. No se alteraron interfaz, campaña, colisiones ni dificultad para corregir el margen del planificador.

## 11. Planificador A* tras el bloqueo Maeve → Samira

La siguiente ejecución real de Linux Mint completó Lucius, Aurelia y Maeve antes de detenerse al salir del portal costero en `x=-6,2,z=2,5`. [La traza original](capturas/fase22/campana-completa-bloqueo-samira-linux-mint.json) registra los tres capítulos y el error `Sin destino accesible` al buscar `x=-6,2,z=-2,5`; **Samira no queda certificada por esa ejecución**.

El origen era transitable según el radio real del personaje (0,34 m), pero el margen anterior del planificador lo clasificaba como ocupado por el pilar occidental. Se sustituyó la búsqueda de rutas exactas repetidas por A* en una cuadrícula de ocupación de 0,2 m. La salida inicial de una posición válida dentro del margen preventivo se comprueba con el radio real; los tramos posteriores conservan 0,08 m de margen. La búsqueda acepta celdas transitables dentro del radio legítimo de interacción, admite varios giros y valida cada segmento. Playwright vuelve a inspeccionar la posición antes de ejecutarlo y recalcula desde la posición real si se atasca, con cuatro reintentos como máximo. No se modificaron colisiones, controles, enemigos, recursos ni dificultad.

Las regresiones reproducen las coordenadas exactas de Maeve → Samira, enlazan los once portales históricos y comprueban rutas interiores representativas de las 29 salas, incluido el scriptorium y el desenlace. También cubren destinos fuera de la cuadrícula con radio cero y varios giros. Pasaron `npm test` (40 archivos, 197/197), `npm run build`, `npm run format:check` y `git diff --check`. `npm run test:browser` se intentó en este sandbox, pero no pudo iniciar: Vite recibió `listen EPERM` al abrir localhost y la prueba informó `ERR_CONNECTION_REFUSED`; el bloqueo es del entorno y no acredita ni desacredita la campaña. Sigue pendiente una ejecución real completa de `--through=final` con este cambio.

## 12. Interacción del portal medieval tras seis capítulos

La siguiente ejecución real de Linux Mint completó desde Nueva partida Lucius, Aurelia, Maeve, Samira, Idris y Oona con guardados y recargas. Se preservaron [la traza del fallo](capturas/fase22/campana-completa-bloqueo-prompt-medieval-linux-mint.json) y [su captura](capturas/fase22/final-bloqueo-prompt-medieval.png). Al intentar Isabelle, el personaje quedó en sala 0 en `x=-5,72194,z=-3,70473`, con 78 PS. El portal medieval estaba a 1,50 m, dentro del radio de interacción de 1,9 m, pero el portal de Samira estaba más cerca, a 1,30 m. El prompt mostraba «Seguir la carta astral · año 783» y la automatización esperaba el texto medieval. El juego elige el interactuable más cercano sin condición de orientación, por lo que el fallo fue de selección de destino en el test, no de transición del juego.

El planificador ahora acepta una condición de destino que exige que el objeto previsto sea el más cercano según las mismas reglas de radio y planta que `World.nearest`. `useObject` emplea esa condición para todos los interactuables, comprueba el prompt real antes de E y registra posición, distancia, objeto elegido, prompt y estado anterior/posterior a la pulsación. La regresión reproduce las coordenadas exactas, comprueba los accesos históricos vecinos y compara la selección con `World.nearest` en ambas plantas. Pasaron `npm test` (40 archivos, 200/200), `npm run build` y `npm run format:check`. `npm run test:browser` se intentó, pero el sandbox rechazó el puerto local de Vite con `listen EPERM` y el navegador recibió `ERR_CONNECTION_REFUSED`. **Isabelle y el final histórico siguen pendientes de una nueva ejecución real completa.**

## 13. Bloqueo de validación de ruta en el archivo, sala 5

La siguiente ejecución real de Linux Mint completó **siete capítulos históricos consecutivos**, incluido Isabelle. Tras el altar de memoria y `tonic5`, se preservaron [la traza íntegra](capturas/fase22/campana-completa-bloqueo-sala5-linux-mint.json) y [la captura](capturas/fase22/final-bloqueo-sala5.png). El fallo ocurrió con 98 PS en `x=0,03392,z=0,06266`, camino a `greenhouse-door`; el juego no rechazó ningún movimiento porque el validador de Playwright detuvo la ruta antes de caminar.

A* había elegido el corredor por `z=0`. El controlador consideraba alcanzado ese waypoint a 0,06266 m de distancia, mientras el validador exigía el margen preventivo de 0,08 m empleado para planificar. Junto al archivador de `x=5,8,z=1`, el segmento horizontal en `z=0,06266` no cumple ese margen, aunque sí es transitable con el radio físico del personaje de 0,34 m. Cinco reintentos repitieron la misma ruta. La validación de ejecución ahora usa la misma geometría y el radio del juego más 0,005 m por precisión numérica; A* conserva su margen preventivo para elegir corredores. Si un tramo se bloquea realmente, el siguiente intento calcula desde la posición observada, evita el punto fallido y omite la ruta directa; una firma impide repetir sin avance la misma ruta. `useObject` sigue exigiendo que `greenhouse-door` sea el interactuable seleccionado antes de E.

La regresión reproduce el camino desde `tonic5`, las posiciones intermedias exactas, el segmento rechazado y una ruta alternativa; también se conservan las pruebas de rutas de las 29 salas. Pasaron `npm test` (40 archivos, 201/201), `npm run build`, `npm run format:check` y `git diff --check`. `npm run test:browser` no pudo conectarse: este sandbox deniega `listen` a Vite con `EPERM`. **Los capítulos posteriores y el final histórico siguen pendientes de una nueva ejecución real.**

## 14. Nuevas colisiones: bloqueo del centro de combate de Lucius

La ejecución real más reciente de Linux Mint confirmó `test:browser` y `test:rescue:browser` con código 0, GPU Intel HD Graphics 620 y 58,94 FPS. La campaña continua entró legítimamente en Lucius, leyó `note8` y presenció la formación imposible, pero se detuvo antes del combate: desde `(-4,27383,4,93027)` A* no pudo alcanzar `(0,1,4)` con radio `0,2`. El destino estaba ocupado por la estela sólida `roman-echo-threshold`; no era un problema de GPU ni una pared ficticia del planificador. La disposición física, corrección y auditoría preventiva se documentan en [RESCATE_LUCIUS_CONECTIVIDAD.md](RESCATE_LUCIUS_CONECTIVIDAD.md). **No se acredita Lucius ni ningún capítulo posterior con la nueva disposición hasta otra ejecución real completa. El juego permanece NO APTO PARA PUBLICACIÓN.**

## 15. Lucius certificado con nuevas colisiones; bloqueo de la mansión

La siguiente [traza real de Linux Mint](capturas/fase22/campana-completa-trace.json) acredita Lucius 189 desde Nueva partida, su guardado y recarga, y la derrota legítima de la sombra `enemy0`. Las baterías `test:browser` y `test:rescue:browser` terminaron con código 0 en Intel HD Graphics 620 a 58,94 FPS, según los resultados comunicados. La campaña se detuvo antes de Aurelia porque el script exigía ocupar el centro de `ritual-table` en `(0,3,1)`. Se preserva la traza fallida. La causa, corrección y auditoría de estados dinámicos se detallan en [RESCATE_CONECTIVIDAD_DINAMICA.md](RESCATE_CONECTIVIDAD_DINAMICA.md). **Lucius está certificado con estas colisiones; Aurelia y el resto siguen pendientes de una nueva ejecución real. NO APTO PARA PUBLICACIÓN.**

## 16. Transición de planta tras enemy0 y reconstrucción REBORN

Un intento posterior comunicó `Origen bloqueado para el personaje` en sala 0, `(3,73383,-5,63937)`, camino a `mosaic-portal` tras derrotar a `enemy0`. El movimiento permitía entrar lateralmente en el rellano superior sin validar los colisionadores de esa planta; el actor terminaba dentro de `gallery-chart`. El motor ahora valida la ocupación del piso de destino y A* de planta baja no usa el rellano como atajo. Los portales de 1491 y 1610, antes colocados en ese mismo rellano pero declarados en planta baja, se trasladaron a dos vanos accesibles del muro sur, con jambas y colisionadores físicos. Se preservan IDs, desbloqueos y transiciones.

La regresión exacta y la auditoría de 29 salas/409 rutas dinámicas pasaron; `npm test` registró 230/230, además de compilación y formato. La prueba de navegador del sandbox cargó Nueva partida con SwiftShader, pero se bloqueó durante movimiento a unos 2,41 FPS; las otras pruebas de navegador no iniciaron Chrome por `crashpad EPERM`. No hay ejecución real completa de Linux Mint posterior a esta corrección. **No se acreditan Aurelia ni los capítulos siguientes ni el final histórico. El juego permanece NO APTO PARA PUBLICACIÓN.** El registro de arquitectura y pruebas está en [REBORN_REGISTRO.md](REBORN_REGISTRO.md).

## 17. Cinco capítulos recorridos; espera del control H

La [traza real más reciente](capturas/fase22/campana-completa-trace.json) inició Nueva partida en Linux Mint y completó Lucius, Aurelia, Maeve, Samira e Idris en una sola sesión. Registra 597/598 checks aprobados, guardado y recarga de los cinco capítulos, y cero errores JavaScript. Sus duraciones fueron 41,453 s; 35,648 s; 35,914 s; 33,960 s; y 38,560 s, respectivamente. Antes de Oona, con 32 PS, cordura 0 y `Tónico 0`, la prueba leyó el estado demasiado pronto tras pulsar H y falló; la captura de fallo ya mostraba 72 PS y el tónico retirado. Se conserva [la traza anterior](capturas/fase22/campana-completa-trace-2026-10-27T06-57-09.750Z.json) y la captura previa al nuevo fallo.

El controlador espera ahora el retiro observable de un único tónico y verifica el efecto y la estabilidad en el siguiente fotograma. `npm test` pasó 242/242, además de compilación, formato y auditoría geométrica de 29 salas/409 rutas. La causa y las pruebas aisladas se describen en [GOLD_MASTER_ESTADO.md](GOLD_MASTER_ESTADO.md). **Oona y el final siguen sin certificar con el código corregido. NO APTO PARA PUBLICACIÓN.**

## 18. Siete capítulos y bloqueo legítimo del invernadero

La [traza real de Linux Mint](capturas/fase22/campana-completa-trace.json) acredita siete capítulos consecutivos desde Nueva partida: Lucius, Aurelia, Maeve, Samira, Idris, Oona e Isabelle, con 977 checks aprobados y cero errores JavaScript. Después, `enemy5` murió en combate real, `memory-altar` otorgó el juramento y +30 PS, y se recogió `Tónico 5`. El personaje llegó a 1,043 m de `greenhouse-door` en sala 5, pero la transición a sala 6 no ocurrió. La puerta exige el puzle `genealogy`, omitido por el script; el juego actuó según sus reglas.

La ruta acumulativa lee ahora `note5` y resuelve `genealogy` con los tres botones antes de interactuar con la puerta. Se añadió diagnóstico de bloqueos y regresión física de la ruta, y pasaron 244/244 pruebas, compilación, formato y auditoría de 29 salas/408 rutas más cuatro puertas con requisito de puzle. La traza anterior se conserva en [el archivo fechado](capturas/fase22/campana-completa-trace-2026-10-27T07-20-51.661Z.json). **El cruce real corregido, Tomás y los capítulos posteriores siguen pendientes de otra ejecución Linux Mint. NO APTO PARA PUBLICACIÓN.**
