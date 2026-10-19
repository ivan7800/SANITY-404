# Fase 4.4 — Decisiones que sobreviven a los siglos

Además de la mesa de las tres edades, el archivo familiar Veyr contiene ahora un altar de memoria. Solo aparece después de recuperar la Tablilla del intervalo y el Códice de Montfort y reconciliar ambas memorias.

- **Juramento de Lucius:** restaura 30 de salud una sola vez y enciende un círculo de bronce.
- **Promesa de Isabelle:** restaura 30 de cordura una sola vez e ilumina el círculo de tinta violeta.
- La elección es excluyente, se conserva en el guardado v1 y añade un matiz propio al desenlace de memoria reconciliada. No altera ni bloquea los finales originales.
- El inventario muestra la elección activa. Al volver al altar se recuerda la opción tomada; no se puede repetir la bonificación.
- Se añaden pruebas de exclusividad, efectos, guardado, regreso a la campaña y presencia del altar.

**Límites:** elecciones y visuales implementados, sin animaciones cinematográficas nuevas ni escenas adicionales en esta entrega. Deben validarse con pruebas GitHub Actions y navegación real. No afirmar FPS sin mediciones.

---

# Fase 4.4 — El legado de las tres edades

Los resultados de Roma (189), Francia (1348) y la mansión (1927) ahora afectan de forma persistente a la aventura de Élise.

- La mesa de las tres edades, situada en el vestíbulo de 1927, revela qué testimonio falta.
- Recuperar la Tablilla del intervalo y el Códice de Montfort permite reconciliar las memorias de Lucius e Isabelle. La acción añade Memoria reconciliada al inventario, restaura una sola vez hasta 20 de cordura y crea un pasaje temporal reversible entre el vestíbulo y el archivo Veyr.
- Las ruinas muestran un nuevo círculo luminoso tras reconciliar los testimonios.
- Un desenlace alternativo se desbloquea si se reconcilian las dos memorias y además se investiga el cuaderno de Adrien en el invernadero. Los desenlaces originales no quedan bloqueados.
- El progreso utiliza la estructura de guardado v1 ya existente, sin modificar las partidas anteriores.
- Las pruebas verifican reconciliación única, shortcut bidireccional, persistencia y condiciones de final.

## Validaciones pendientes
GitHub Actions: npm ci, npm run format:check, npm test, npm run build. Después comprobar en Chrome el acceso al escritorio de recuerdos, salida del pasaje, controles, guardado en ambas puntas, desenlace con y sin la investigación opcional, y FPS sobre Intel HD 620.

## Limitaciones
Todavía no hay nuevas cinemáticas 3D, doblaje ni transición temporal elaborada. Se trata de consecuencias jugables y narrativas sobre el mundo existente, no de una campaña totalmente rehecha.

---

# Fase 4.3 — Francia, 1348

Se implementan dos salas nuevas: claustro (9) y scriptorium (10), conectadas con un portal opcional desde el vestíbulo de 1927. Protagonista: Isabelle de Montfort, copista, modelo procedural original sobre el rig animado existente. Enemigo: copista de las fiebres (plagueScribe), con perfil de combate propio. Objetivo: descifrar el primer signo del registro, vencer al custodio y recuperar el Códice de Montfort. Final narrativo conectado a Lucius Varro y Élise.

El regreso está disponible aunque no se complete la misión para evitar bloqueos. El esquema de partidas guardadas mantiene la versión 1 y admite nuevas salas, notas, adversarios y objetos. Tres pruebas automatizadas cubren rutas, personaje, enemigo y guardado.

## Limitaciones

Es un capítulo medieval compacto en dos salas, no un monasterio extensivo con catacumbas. Los modelos son geometría Three.js, no GLB riggeados. No se han medido FPS en Intel HD 620 ni realizado prueba visual local desde este entorno.

## Validación

Exigir GitHub Actions verde: formato, Vitest y compilación Vite/TypeScript. Luego comprobar manualmente en Chrome: portal de 1927, control de Isabelle, acceso al scriptorium, resolución del puzle, combate, adquisición del códice, guardado/carga y regreso sin bloqueos.

---

# SANITY-404 — Fase 4.2: Lucius Varro (189 d. C.)

## Nueva entrega

- Lucius Varro es ahora el protagonista 3D controlable del santuario romano, con armadura, casco y gladius originales construidos con geometría ligera.
- Nuevo centurión sin rostro con silueta exclusiva, vida diferenciada y embestida anticipada.
- Inscripción del altar: acertijo con tres respuestas y pérdida moderada de cordura si se falla. Se conserva la resolución como Marca de Varro en partidas existentes.
- La tablilla requiere resolver el acertijo y derrotar al centurión.
- Epílogo narrativo conecta Roma con la futura mansión y Élise.
- Se puede salir de Roma sin completar la misión; no hay bloqueo irreversible.
- Tres pruebas nuevas para personaje, enemigo y persistencia del acertijo.

## Pendiente y límites

La versión usa la animación articular existente y geometría procedural; todavía no incluye modelo GLB ni animación facial. Roma sigue siendo un capítulo compacto de una sola sala, no una campaña multiescenario. El capítulo medieval de 1348 no se ha desarrollado.

## QA pendiente

Ejecutar npm ci, npm run format:check, npm test, npm run build y npm run test:browser. Verificar recorrido y combate en navegador real antes de fusionar.

---

# SANITY-404 — Fase 4.1: La memoria de Roma (189 d. C.)

## Implementado
- Santuario de los nombres: escenario Three.js original con columnas, altar y arco romano.
- Portal desde el vestíbulo de 1927 y portal de regreso.
- Combate existente, documento histórico y Tablilla del intervalo coleccionable.
- Compatibilidad del guardado v1 con la nueva sala 8 y el artefacto.
- Tres pruebas automatizadas de escenario, conexiones y persistencia.

## Cómo acceder
Desde el vestíbulo busca la grieta romana junto al fondo derecho. Interactúa, explora Roma, lee el documento y recoge la tablilla frente al altar. Regresa por la puerta cercana a la entrada.

## Pendiente
No es la Fase 4 completa: falta convertir a Lucius Varro en protagonista jugable específico, desarrollar enemigo romano original, puzles avanzados, Edad Media y la conexión profunda entre épocas. Actualmente la incursión utiliza a Élise y el sistema de combate existente.

## QA antes de fusionar
Ejecutar npm ci, npm run format:check, npm test, npm run build y npm run test:browser. Verificar guardado y carga en Roma, vuelta a la mansión, recuperación del artefacto y ausencia de regresiones. Medir FPS reales en Intel HD 620.

El acceso local a GitHub para compilar no estaba disponible en esta sesión. No fusionar ni publicar en Pages sin validación.