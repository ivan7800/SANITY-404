# Fase 21 — Campaña histórica: implementación y estado de verificación

**Fecha:** 25 de octubre de 2026. **Rama de trabajo:** `fase11/campana-historica`. **Dictamen:** **NO APTO PARA VERSIÓN 1.0**. Este documento parte de los defectos F20-01 a F20-09 de `FASE20_AUDITORIA_INTEGRAL.md`. «Implementado» describe reglas presentes; «verificado» exige jugar entrada, objetivo, puzle, combate y salida sin preparar el estado. Ningún capítulo histórico alcanza aquí ese último nivel.

## 1. Grafo narrativo final y reglas de acceso

```text
Nueva partida → Élise, 1927: vestíbulo y rutas de la mansión
  ├─ Memoria adelantada de Isabelle, 1348 (acceso temprano opcional)
  ├─ Lucius 189 → Aurelia 312 → Maeve 537 → Samira 783 → Idris 1092
  │   → Oona 1217 → Isabelle 1348 → Tomás 1491 → Inés 1610
  │   → Amara 1786 → Émile 1899
  ├─ Ruinas o sótano → decisión explícita de cierre anticipado
  └─ Ruinas o sótano + 11 capítulos concluidos + 11 artefactos
      + memoria reconciliada + cuaderno de Adrien + decisión Lucius/Isabelle
      → decisión de cierre histórico completo
```

La visita temprana a Isabelle se presenta como **recuerdo adelantado**. Concluirla antes de Oona no abre Tomás hasta concluir Oona. El vestíbulo conserva portales de capítulos ya visitados para poder volver a contenido desbloqueado, incluidos los de guardados antiguos. Las rutas de ruinas y sótano ofrecen siempre «Volver a investigar»; el jugador puede elegir un final anticipado sin que sea un salto involuntario. El final histórico se bloquea si falta cualquier conclusión, artefacto o condición indicada. Las once conclusiones se exigen en 1927; el juego todavía permite investigar épocas en un orden parcial mediante accesos ya abiertos.

La consecuencia persistente mínima de cada época es su artefacto y la marca `campaign.completed`; documentos leídos, derrotas y elecciones se guardan en el formato v2. La introducción específica aparece al primer cruce de cada portal. Los epílogos específicos y objetivos/puzles existentes se conservan. Las armas de época ahora tienen alcance, cadencia, coste de golpe fuerte y ventana de parada propios, además de su nombre y técnica en el inventario; siguen compartiendo animación y controlador de daño.

## 2. Matriz de los doce capítulos

**Criterio de estado:** todos quedan **IMPLEMENTADO PARCIAL** porque esta fase no consiguió completar en navegador sus recorridos de entrada a salida con controles reales. Las pruebas de lógica y los guardados preparados no cambian esa clasificación. «Duración —» significa no medida. El detalle anterior de salas, enemigos, documentos y puzles está en la matriz de Fase 20; esta tabla registra el contrato y la evidencia nueva.

| # / protagonista | Contrato presente en código | Evidencia Fase 21 y pendiente para verificar | Estado |
| --- | --- | --- | --- |
| 1 Lucius · 189 | Introducción del cartógrafo de la guardia; santuario 08; inscripción, formación, signos, centurión, gladius, tablilla y epílogo. | Entrada e introducción comprobadas con guardado dirigido; arma y condiciones en pruebas. Faltan puzle, combate, salida y carga jugando. Duración —. | IMPLEMENTADO PARCIAL |
| 2 Aurelia · 312 | Taller/horno 11–12; cinabrio, teselas, custodio, martillo, molde y epílogo. | Reglas y perfil de arma probados; sin salida en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 3 Maeve · 537 | Muelle/archivo 13–14; mareas, registro, custodio, cuchillo, lista y epílogo. | Reglas y perfil de arma probados; sin salida en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 4 Samira · 783 | Terraza/cúpula 15–16; carta, horas, vigilante, bastón, disco y epílogo. | Reglas y perfil de arma probados; sin salida en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 5 Idris · 1092 | Cantera/arco 17–18; cuña, ensamblaje, obrero, martillo, plano y epílogo. | Reglas y perfil de arma probados; sin salida en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 6 Oona · 1217 | Hospital/enfermería 19–20; hierbas, remedio, custodio, bastón, cuaderno y elección Ada/Bran. | La conclusión es requisito efectivo de Tomás cuando Isabelle fue visitada antes; no se completó jugando. Duración —. | IMPLEMENTADO PARCIAL |
| 7 Isabelle · 1348 | Claustro/scriptorium 09–10; códice, sello, copista, bastón, epílogo y reconciliación posterior. | Portal temprano rotulado y bloqueo de Tomás comprobados con guardados preparados; capítulo sin recorrido completo. Duración —. | IMPLEMENTADO PARCIAL |
| 8 Tomás · 1491 | Imprenta 21–22; pruebas de impresión, secuencia, tipógrafo, palanca, plancha y epílogo. | Acceso posterior condicionado a Oona e Isabelle, con excepción de visita previa; salida no completada en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 9 Inés · 1610 | Veyr/galería 23–24; genealogía, acta, retrato, estoque y epílogo. | Reglas y perfil de arma probados; sin salida en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 10 Amara · 1786 | Teatro/tramoya 25–26; poleas, ritmo, autómata, llave, partitura y epílogo. | Reglas y perfil de arma probados; sin salida en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 11 Émile · 1899 | Archivo/revelado 27–28; exposición, sombra, trípode, placa y epílogo. | Su conclusión y placa bloquean ahora el final histórico; salida no completada en navegador. Duración —. | IMPLEMENTADO PARCIAL |
| 12 Élise · 1927 | Mansión 00–07; llave, medallón, sellos, enemigos, dos umbrales y decisiones de cierre. | La ruta limpia 00–04 y el final anticipado se completaron; los cierres dirigidos se probaron con guardados preparados. Falta una partida limpia tras los once capítulos, sótano y duración. | IMPLEMENTADO PARCIAL |

En cada época histórica, el evento de cordura procede de la amenaza, documentos o errores del puzle y sus efectos compartidos; no se añadió una escena de cordura exclusiva por capítulo. La herramienta diferenciada afecta parámetros de combate, pero no constituye once mecánicas nuevas. El contrato narrativo existe en código; su claridad para una persona sin ayudas sigue sin prueba humana.

## 3. Cambios de código frente a Fase 20

- `src/systems/campaign.ts`: lista explícita de once pruebas históricas, comprobador de requisitos de final e introducciones propias. `src/world/scene.ts`: cadena posterior condicionada a Oona e Isabelle, acceso temprano a Isabelle identificado y reentrada de portales ya visitados.
- `src/main.ts` y `src/systems/legacy.ts`: selección de final anticipado o histórico; regreso a investigar; condición completa para el desenlace histórico; objetivo contextual de 1927, presentación de arma y registro de conclusión de Élise en memoria al cerrar.
- `src/systems/weapons.ts` y `src/systems/combat.ts`: perfiles de once armas aplicados a alcance, cadencia, resistencia y parada. No se modificaron geometría, luces, audio ni recursos de las fases 18 y 19.
- `tests/campaign.test.ts`, `tests/legacy.test.ts`, `tests/late-chapters.test.ts` y `tests/weapons.test.ts`: condiciones negativas/positivas de final, acceso posterior y perfiles de combate. `scripts/browser-smoke.mjs` llama «ruta corta» al recorrido limpio y elige el final anticipado explícitamente; `scripts/phase21-browser-cases.mjs` separa los portales, la introducción y los finales con guardados preparados. `scripts/browser-phase21-chapter-exits.mjs` prepara comprobaciones de salida/carga de once capítulos, pero **no produjo resultados de capítulos** en esta sesión.

## 4. Pruebas funcionales y evidencias de navegador

| Prueba | Resultado exacto |
| --- | --- |
| `npm test` aislado tras los cambios | **39 archivos, 187/187 pruebas aprobadas**. Una primera ejecución concurrente con Chromium sufrió tiempos de espera; se interrumpió y se repitió aislada con éxito. |
| `npm run build` | Correcto: TypeScript y Vite. |
| `npm run test:browser` | **Correcto al final de la fase.** `browser-smoke`: desde Nueva partida, con teclado y sin alterar el estado, guardado/carga, nota, llave, medallón, biblioteca, cripta, capilla, ruinas y final anticipado. `browser-systems`: bloqueo, cordura, muerte/reintento y segundo desenlace con estados preparados. `browser-phase10`: pérdida/recuperación WebGL. Ninguno recorre las once épocas. |
| Ejecución investigativa de `phase21-browser-cases.mjs` dentro de una sesión Chrome abierta | Con **guardados preparados** pasaron bloqueo/reentrada de Tomás, introducción de Lucius, retorno sin cerrar y final histórico con once pruebas. La aserción de un artefacto ausente encontró inesperadamente el menú tras recarga en dos ejecuciones, incluso tras reforzar la recuperación de foco; no se cuenta como prueba superada. El script dirigido se separó de la batería estándar para conservar la interpretación del recorrido limpio. |
| `node scripts/browser-phase21.mjs` y `node scripts/browser-phase21-chapter-exits.mjs` | Varios lanzamientos separados, incluido uno con pantalla para las salidas, terminaron antes de abrir página: Chrome 156, `crashpad: setsockopt: Operation not permitted (1)`, `SIGTRAP`. No se desactivaron protecciones para sortearlo. Los once casos de salida, inventario y recarga dirigidos quedaron **sin ejecutar**. |
| Conector Chrome DevTools, intento de clic | La revisión automática rechazó `click` porque requería aprobación y la política de esta sesión es `never`; no se utilizó `evaluate_script` para eludirla. |
| Partida íntegra Nueva partida → once épocas → 1927 | **No ejecutada**. La ruta corta limpia demuestra el final anticipado, no la campaña histórica completa. Sin medidas de tiempo de juego por capítulo, muertes o recuperaciones históricas. |

La aserción negativa de «falta un artefacto» sí está cubierta a nivel unitario por `historicalEndingReadiness` y `legacyEnding`; la interfaz correspondiente aún requiere revalidación. No hay capturas nuevas de 29 salas desde varios puntos, sesión humana prolongada, escucha humana, mando físico ni lector de pantalla en Fase 21.

## 5. Guardados y compatibilidad

Se conserva el formato v2 y el lector de v1 de `src/systems/state.ts`; no se cambia el identificador de `localStorage` ni se migran datos destructivamente. La lista `campaign.visited` permite reabrir portales tardíos ya visitados en partidas anteriores aunque falten hitos de la cadena nueva. Los guardados que antes podían alcanzar el final histórico con tablilla y códice ahora conservan sus objetos y ruta, pero necesitan las once conclusiones, once artefactos y decisiones para ese final. El final anticipado sigue disponible. La compatibilidad estructural se cubre con pruebas unitarias; falta cargar una colección real de guardados antiguos y completar sus rutas en navegador. Solo hay una ranura local de guardado. El cierre marca `mansion-1927` en memoria, pero no fuerza un guardado final; tras recargar se puede reintentar el umbral.

## 6. Rendimiento en Intel HD Graphics 620

El script de Fase 10, con Chrome 156, WebGL 2 sobre `ANGLE (Intel, Mesa Intel(R) HD Graphics 620)`, 1280×720, render 1024×576 y guardados preparados, validó enemigo visible y combate activo. Son muestras de **10 segundos**, no rendimiento de la campaña. El límite exigido es peor ventana móvil de 60 fotogramas ≥45 FPS.

| Escenario | FPS medio | Peor ventana de 60 | Resultado |
| --- | ---: | ---: | --- |
| 189 combate, primera pasada | 34,7 | **29,5** | Falla · [JSON](capturas/fase21/intel-189-combat.json) |
| 189 combate, repetición | 37,9 | **34,0** | Falla · [JSON](capturas/fase21/intel-189-combat-retest.json) |
| 1927 combate, control | 34,8 | **29,3** | Falla · [JSON](capturas/fase21/intel-1927-combat.json) |

Fase 20 midió 189 en combate a 60,0 y 1927 a 47,4 FPS en la peor ventana, también en muestras breves. La caída actual afecta incluso al perfil base de 1927; esta evidencia no permite atribuirla con certeza al cambio de armas. Sí demuestra que **el criterio de 45 FPS no se cumple en el entorno de esta sesión**. Falta aislar carga del sistema, frecuencia/temperatura y repetición controlada, además de medir transiciones y sesión larga.

## 7. Defectos pendientes y prioridades

| Prioridad | ID | Estado y criterio de cierre |
| --- | --- | --- |
| P1 | F21-01 · heredado F20-01/F20-03 | No hay partida limpia de las once épocas ni salida/combate/guardado de cada capítulo en navegador. Ejecutar recorrido completo, conservar traza y corregir bloqueos hallados antes de declarar cualquier capítulo «COMPLETO VERIFICADO». |
| P1 | F21-02 · heredado F20-04 | Tres mediciones Intel válidas incumplen 45 FPS. Repetir en condiciones controladas, localizar causa y verificar exploración, combate, transición y sesión prolongada tras corrección. |
| P1 | F21-03 | Chrome headless intermitente impide la batería dirigida de once salidas; investigar `crashpad EPERM` sin rebajar protecciones. Revalidar interfaz de prueba material ausente. |
| P2 | F21-04 · heredado F20-05/F20-06 | Armas diferenciadas en parámetros, pero animación/control de daño compartidos; consecuencias de cordura mayormente comunes. Evaluar sensación, equilibrio y decisiones persistentes con jugadores; añadir trabajo solo si el resultado lo exige. |
| P2 | F21-05 · heredado F20-07/F20-08 | Persisten revisión visual de 29 escenarios desde varias posiciones, escucha humana, mando físico y lector de pantalla. |
| P2 | F21-06 · heredado F20-06 | El final es texto y botón de título; faltan créditos y revisión editorial humana de continuidad/legibilidad. |
| P3 | F21-07 · heredado F20-09 | README y diseño mantienen descripciones anteriores, incluida la terminología de Lucius/Isabelle y alcance de guardado. Sincronizar cuando el recorrido esté cerrado. |

**P0 demostrado:** ninguno. La falta de recorrido integral impide descartar un bloqueo P0 latente.

## 8. Plan priorizado para 1.0 y valoración

1. Resolver F21-02 y estabilizar el navegador; repetir las mediciones Intel en condiciones comparables. El umbral de 45 FPS es un criterio de aceptación, no una media deseable.
2. Ejecutar `browser-phase21-chapter-exits.mjs` y después jugar cada época desde un estado legítimo: entrada, nota, puzle, cordura, enemigo, victoria, salida, guardado y carga. Registrar tiempo, bloqueo, muerte y recuperación por capítulo.
3. Hacer una partida limpia ininterrumpida desde Nueva partida por Lucius→Émile y final histórico de 1927. Repetir la rama de Isabelle adelantada y el final anticipado. Conservar traza y capturas de transiciones.
4. Completar pasada humana de narrativa, audio, 29 salas, controles y accesibilidad. Cerrar créditos y documentación contra el ejecutable final.
5. Repetir batería unitaria, compilación, formato, navegador y rendimiento tras cada corrección relevante; emitir acta de aceptación solo con recorrido completo y datos físicos suficientes.

**Valoración de preparación para 1.0: 5,9/10.** Se corrigió la lógica que permitía un final histórico prematuro y se explicitó la rama corta. Existen introducciones y armas diferenciadas en código, y la ruta corta volvió a funcionar. Siguen sin verificarse once recorridos reales y el criterio físico de 45 FPS falla en tres muestras válidas. La puntuación no convierte pruebas aisladas en una campaña terminada.

**NO APTO: FALTA VALIDACIÓN ESENCIAL Y EL RENDIMIENTO MEDIDO NO CUMPLE EL CRITERIO.**
