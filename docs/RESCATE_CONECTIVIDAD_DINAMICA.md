# Conectividad dinámica de campaña tras Lucius

**Estado: corrección implementada; Aurelia→final pendientes de una nueva ejecución real. SANITY-404 permanece NO APTO PARA PUBLICACIÓN.**

## Bloqueo real de Linux Mint

La [traza original](capturas/fase22/campana-completa-trace.json) confirma Lucius 189 completado, guardado y recargado, y `enemy0` derrotado. `test:browser` y `test:rescue:browser` pasaron en Intel HD Graphics 620 a 58,94 FPS. La campaña se detuvo en la mansión, desde `(1,34946,-2,985)` al intentar caminar a `(0,3,1)` antes de entrar en Aurelia.

El actor estaba libre. `(0,3,1)` cae dentro del volumen sólido de `ritual-table`, centrado en `(0,2,7)` y de aproximadamente `1,22 × 0,80 m`; con el radio del actor de `0,34 m`, su zona bloqueada llega hasta `z=3,44`. La mesa visual y el colisionador coinciden. `enemy0` derrotado deja de ser visible, pero su cadáver no se añade a `World.obstacles`; los portales y muebles activos son los de `World(0)` con Lucius completado. A* agotó 3705 nodos porque el destino intermedio era imposible, no porque el vestíbulo estuviera desconectado.

El destino jugable real es `mosaic-portal`. Desde la posición exacta, A* sí encuentra una ruta física de 13 waypoints hasta `(5,3,-1,7)`, donde el portal de Aurelia es el objeto seleccionado. Se eliminó únicamente el waypoint artificial ocupado por la mesa; `enterPortal` continúa caminando mediante controles normales, comprueba el prompt y exige la transición legítima. También existe una ruta al perímetro de `ritual-table` si se desea interactuar con ella, sin exigir ocupar su centro. No se cambió ninguna colisión, enemigo o dificultad.

## Auditoría preventiva

`npm run audit:rooms` conserva la revisión geométrica de 29 salas y añade [estados de campaña reconstruidos](RESCATE_SALAS_DATOS.json): antes y después de los once combates, tras pistas, puzles y artefactos, al regresar a 1927, y tras serializar y validar once estados con `parseSave`. Comprueba que los objetos se pueden seleccionar desde un punto físico alcanzable; para las puertas y portales busca un punto de interacción legítimo en su perímetro. Usa `safeSpawn` solamente al reproducir las entradas que el motor repara de ese mismo modo.

La auditoría analiza las llamadas directas a `go()` en `phase22-start-probe.mjs` y falla si aparece un destino sin contexto declarado. Comprueba además cada portal siguiente en los estados de desbloqueo acumulativo. Antes de abrir Chromium, `--through=final` exige que la auditoría termine con código 0. El JSON contiene sala, estado de campaña, destino, objetivo, bloqueadores cercanos, motivo y alternativa cuando existe. Estos estados reconstruidos son diagnóstico geométrico; la certificación sigue requiriendo jugar desde Nueva partida.

## Resultado de esta corrección

La auditoría ha comprobado **409 rutas, 24 destinos del script y 11 serializaciones/recargas de estado**, sin destinos inaccesibles. Los 24 incluyen los cuatro `go(0, chapter.portal[1])` de los capítulos tardíos. La regresión reproduce la posición y el estado tras `enemy0`, demuestra el bloqueo de `(0,3,1)`, confirma la ruta al portal y verifica que la mesa puede seleccionarse desde su perímetro. Las pruebas de navegador de Linux Mint comunicadas corresponden al código anterior a esta corrección; Aurelia y los capítulos posteriores siguen pendientes de ejecución real con el código actual.

Verificación local posterior: `npm test` **217/217**, `npm run build`, `npm run format:check`, `npm run audit:rooms` y `git diff --check` terminaron correctamente. No se repitió Chromium en el sandbox: los intentos anteriores terminaron al iniciar con `crashpad EPERM`, antes de cargar el juego.
