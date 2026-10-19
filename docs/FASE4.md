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