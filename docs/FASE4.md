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