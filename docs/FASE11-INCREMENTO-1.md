# Fase 11 · arquitectura y piloto romano

Estado al 23 de octubre de 2026: incremento local compilado y probado a nivel unitario. El piloto **no está verificado como recorrido completo en navegador** y no se publica como capítulo terminado. La campaña de doce capítulos permanece en producción; las nueve épocas nuevas siguen siendo diseño.

## Arquitectura

`src/systems/campaign.ts` registra doce capítulos con identificador estable, época, protagonista, lugar, predecesor, escena existente y estado. Solo Roma 189, abadía 1348 y mansión 1927 apuntan a escenas reales; incluso estos permanecen `production` hasta completar QA. Las otras nueve entradas son `draft`, carecen de sala y no aparecen en una selección jugable. La cadena narrativa definida en [CAMPANA-12.md](CAMPANA-12.md) guía entregas futuras sin crear salas vacías.

El guardado v2 añade capítulos visitados y concluidos y eventos presenciados. `parseSave` migra v1 a v2, conserva inventario, documentos, enemigos, sellos, decisiones y progreso lateral, e infiere visitas desde las salas existentes. Rechaza identificadores de capítulos sin escena y progreso mal formado. La clave de `localStorage` se conserva para que las partidas antiguas sigan cargando.

## Piloto en Roma 189

La ruta usa la grieta del vestíbulo, el santuario, Lucius, el gladius, el centurión, la inscripción, la tablilla y el arco de regreso ya modelados. La nueva secuencia visible en el HUD y el inventario exige leer la pista, presenciar la formación imposible con pérdida de cordura, ordenar las tres edades, derrotar al centurión y recoger la tablilla. El arco sur ofrece entonces un epílogo y guarda el capítulo concluido antes y después del regreso a 1927. Una partida guardada a mitad del recorrido conserva cada requisito.

La estética conserva la escena 3D, cámara clásica, materiales, iluminación, audio y controles existentes; este incremento añade texto de objetivos y conclusión, sin geometría ni luces nuevas. La prueba física de 58,16 FPS medios y 53,75 FPS en la peor ventana de 60 corresponde al combate 1927 **anterior a este incremento**, documentado en [Fase 10C](FASE10C-AUDITORIA.md); no mide el piloto romano ni este bundle.

## Comprobaciones reales

| Comprobación | Resultado |
| --- | --- |
| `npm test` | En la rama aislada: 24 archivos, 103 pruebas aprobadas, incluida migración v1 y secuencia del piloto. El árbol original también pasó 43 archivos y 189 pruebas porque incluye el respaldo local `fase8-worktree/`. Una primera pasada de la rama, ejecutada a la vez que `build`, agotó el tiempo de una prueba de salas; la repetición sin carga concurrente pasó. |
| `npm run build` | TypeScript y Vite correctos |
| `npm run format:check` | Correcto |
| `git diff --check` | Correcto |
| REA 6.5.0 | Análisis estático del bundle `dist/assets/index-Dbjo5yp0.js`; evidencia padre `ev_31815c82ed53fb830e60d0efd3b255014deb32c30163e819390222f3813e34c8`. Grafo parcial por límite de 10000 nodos y un archivo inventariado no seleccionado; no prueba ejecución. |
| Chrome DevTools | Vite cargó el menú y canvas; cero errores o advertencias de consola al abrir. El clic de «Continuar» fue rechazado por la política de aprobación de la sesión. |
| Playwright local | `scripts/browser-historical.mjs` quedó sin salida durante más de 90 s y se interrumpió; no hay resultado de recorrido. |
| Rendimiento físico nuevo | No ejecutable en este proceso: `/dev/dri` ausente y X11 no accesible. Faltan las pasadas de exploración y cordura. |

La comprobación pendiente es recorrer el piloto en navegador con interacción permitida, verificar que el combate se puede ganar, que el epílogo y el guardado sobreviven una recarga, y medir el escenario romano en Intel HD 620. Con la QA de interacción pendiente, el estado del capítulo sigue `production`.

La rama local `fase11/campana-historica` está en el clon aislado `/tmp/sanity404-fase11`, creado desde `233f0b5`, porque `.git` del árbol recibido es de solo lectura. La creación de la rama remota mediante el conector GitHub fue rechazada por la revisión automática de aprobación; por ello este incremento no está publicado. La PR #14 permanece intacta y sin fusionar.
