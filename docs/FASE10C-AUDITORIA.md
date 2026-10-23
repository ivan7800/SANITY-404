# Fase 10C · acceso romano y rellano astral

Estado inicial del incremento: pendiente de revisión de las nuevas capturas de navegador y de medición en Intel HD Graphics 620 física. La PR #14 sigue como borrador.

## Causa visual y cambio realizado

Las [capturas anteriores](FASE10B-VALIDACION-2026-10-23.md) muestran el acceso romano tapado por una columna, cortinas y el encuadre desde la pared oriental. La columna genérica de `src/world/scene.ts` estaba en `(6.8, 3)`, junto al portal `(6.2, 3)`. Dos paños interiores de `src/world/furnishings.ts` caían sobre el vano. La cámara clásica de entrada estaba en `(6.8, 2.35, 7.25)`, demasiado pegada a esa pared. En el rellano, la cámara estaba lejos de la carta y la barandilla y Élise reducían su lectura.

- La columna oriental de esa crujía se desplaza a `z=0.7` con su luz asociada; conserva su volumen y colisión. Las columnas de otros escenarios no cambian.
- Se retiran sólo los dos paños interiores que cubrían el vano; los paños exteriores y las barras quedan como cortinas laterales. Los dos antiguos huecos de ventana de la crujía se convierten en un trasfondo de piedra con paneles y molduras; las demás ventanas permanecen.
- El acceso tiene ahora una losa oscura, grieta irregular y remates de latón propios. No añade una fuente de luz dinámica que penalice la HD 620.
- La cámara clásica tiene un plano específico del acceso desde el interior del vestíbulo y un plano del rellano más próximo y lateral. La cámara moderna conserva su seguimiento.
- La carta astral gana marco, contraste, superficie legible y marcas de calibración. La escalera, las barandillas, la altura, las posiciones interactivas y el guardado mantienen sus contratos.

## Verificación ya ejecutada

- `npx vitest run tests/mansion-vertical.test.ts`: 5/5 aprobadas. Comprueba colisión libre en la posición anterior de la columna, colisión en la nueva, selección del portal, zona de cámara y proyección de la carta separada de la silueta.
- `npm test`: 42 archivos y 185 pruebas aprobadas en el árbol local, que incluye el respaldo `fase8-worktree/` ajeno a la PR.
- `npm run format:check`: correcto.
- `npm run build`: TypeScript y Vite correctos.
- `scripts/browser-historical.mjs` ahora comprueba las zonas de cámara y la ausencia de corrección de colisión antes de guardar ambas capturas. La ejecución en Chrome de CI está pendiente al publicar este incremento.
- REA MCP 6.5.0 analizó de forma estática el bundle JavaScript compilado de `dist` y emitió la evidencia `ev_c5f3d6d9dd92f941c362799dc381cf7d05f541b0414302d07f761c083f488938`: 635153 bytes leídos, un archivo JavaScript analizado sin errores de parseo. El grafo quedó parcial por el límite elegido de 10000 nodos. Esa evidencia no demuestra el renderizado ni la ejecución del juego.

Se aplicaron las Skills consultadas `ecc:change-impact` (alcance de geometría, cámara, colisiones e interacción), `ecc:frontend-design-direction` (comparación renderizada), `ecc:browser-qa` (capturas y recorrido funcional) y `ecc:benchmark-optimization-loop` (mantener la puerta física de 45 FPS separada de CI). La Skill local `reverse-engineer-anything` se consultó para el alcance de REA; REA se usó sobre el artefacto compilado por solicitud expresa. No se atribuye a esa inspección estática una validación visual.

## Puertas aún abiertas

Revisar las capturas nuevas del mismo guardado y resolución de 960 × 640, y corregir cualquier obstrucción residual. Verificar en GitHub Actions el recorrido de las tres épocas y registrar el diagnóstico de consola. En Linux Mint con acceso X11 y `/dev/dri`, ejecutar una pasada física de 60 segundos de combate 1927 y confirmar renderizador Intel, escenario válido y peor ventana de 60 intervalos superior a 45 FPS. La medición anterior de Fase 10 no certifica este incremento.
