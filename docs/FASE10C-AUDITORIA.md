# Fase 10C · acceso romano y rellano astral

Estado al 23 de octubre de 2026: corrección funcional y visual de los dos encuadres revisada con capturas de Chrome en CI. Sigue pendiente la medición en Intel HD Graphics 620 física. La PR #14 permanece abierta como borrador y no se ha fusionado.

## Causa visual y cambio realizado

Las [capturas anteriores](FASE10B-VALIDACION-2026-10-23.md) muestran el acceso romano tapado por una columna, cortinas y el encuadre desde la pared oriental. La columna genérica de `src/world/scene.ts` estaba en `(6.8, 3)`, junto al portal `(6.2, 3)`. Dos paños interiores de `src/world/furnishings.ts` caían sobre el vano. La cámara clásica de entrada estaba en `(6.8, 2.35, 7.25)`, demasiado pegada a esa pared. En el rellano, la cámara estaba lejos de la carta y la barandilla y Élise reducían su lectura.

- La columna oriental de esa crujía se desplaza a `z=0.7` con su luz asociada; conserva su volumen y colisión. Las columnas de otros escenarios no cambian.
- Se retiran sólo los dos paños interiores que cubrían el vano; los paños exteriores y las barras quedan como cortinas laterales. Los dos antiguos huecos de ventana de la crujía se convierten en un trasfondo de piedra con paneles y molduras; las demás ventanas permanecen.
- El acceso tiene ahora una losa oscura, grieta irregular y remates de latón propios. No añade una fuente de luz dinámica que penalice la HD 620.
- La cámara clásica tiene un plano específico del acceso desde el interior del vestíbulo y un plano del rellano que separa la carta y el personaje. La cámara moderna conserva su seguimiento.
- La carta astral gana marco, contraste, superficie legible y marcas de calibración. Una segunda revisión detectó que su montaje en la pared norte la dejaba detrás de los balaustres, por lo que se trasladó a la cara interior de la barandilla lateral. La escalera, el cierre de las barandillas, la altura, las posiciones interactivas y el guardado mantienen sus contratos.
- El guardado de la captura del portal sitúa ahora a Élise a `(5.05, 3)`, delante del umbral; el guardado inicial la colocaba dentro de la malla y producía una imagen engañosa.

## Verificación ya ejecutada

- `npx vitest run tests/mansion-vertical.test.ts`: 5/5 aprobadas. Comprueba colisión libre en la posición anterior de la columna, colisión en la nueva, selección del portal, zona de cámara y proyección de la carta separada de la silueta.
- `npm test`: 42 archivos y 185 pruebas aprobadas en el árbol local, que incluye el respaldo `fase8-worktree/` ajeno a la PR.
- `npm run format:check`: correcto.
- `npm run build`: TypeScript y Vite correctos.
- `scripts/browser-historical.mjs` comprueba las zonas de cámara y la ausencia de corrección de colisión antes de guardar ambas capturas. El [CI final 39966848382](https://github.com/ivan7800/SANITY-404/actions/runs/39966848382), sobre `5194bd3`, aprobó `verify` (23 archivos y 99 pruebas, formato y compilación) y `browser` (tres épocas, portales, puzles, artefactos, guardado y elección). Chrome 155.0.8059.39; el diagnóstico tiene `faults: []`.
- REA MCP 6.5.0 analizó de forma estática el bundle JavaScript compilado de `dist` y emitió la evidencia `ev_c5f3d6d9dd92f941c362799dc381cf7d05f541b0414302d07f761c083f488938`: 635153 bytes leídos, un archivo JavaScript analizado sin errores de parseo. El grafo quedó parcial por el límite elegido de 10000 nodos. Esa evidencia no demuestra el renderizado ni la ejecución del juego.

Se aplicaron las Skills consultadas `ecc:change-impact` (alcance de geometría, cámara, colisiones e interacción), `ecc:frontend-design-direction` (comparación renderizada), `ecc:browser-qa` (capturas y recorrido funcional) y `ecc:benchmark-optimization-loop` (mantener la puerta física de 45 FPS separada de CI). La Skill local `reverse-engineer-anything` se consultó para el alcance de REA; REA se usó sobre el artefacto compilado por solicitud expresa. No se atribuye a esa inspección estática una validación visual.

## Comparación de capturas reales

| Zona          | Antes, Actions 39834313353                                                                     | Después, Actions 39966848382                                                                         | Revisión                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Acceso romano | [Portal tapado por columna y cortinas](capturas/fase10b/actions-39834313353/portal-romano.png) | [Portal despejado, Élise delante del umbral](capturas/fase10c/actions-39966848382/portal-romano.png) | El vano y la grieta se identifican sin depender sólo del aviso. La columna y cortinas se mantienen en la arquitectura contigua. |
| Rellano       | [Carta pequeña tras la barandilla](capturas/fase10b/actions-39834313353/rellano-astral.png)    | [Carta visible junto al atril](capturas/fase10c/actions-39966848382/rellano-astral.png)              | La carta queda en primer plano sin barras sobre el dibujo; Élise y el atril caben en el encuadre.                               |

La [primera captura intermedia](capturas/fase10c/actions-39965152874/rellano-astral.png) mostró que acercar la cámara no bastaba; la [segunda](capturas/fase10c/actions-39965962904/rellano-astral.png) reveló la barandilla trasera delante de la carta. Sus artefactos originales corresponden a [39965152874](https://github.com/ivan7800/SANITY-404/actions/runs/39965152874) y [39965962904](https://github.com/ivan7800/SANITY-404/actions/runs/39965962904). El [artefacto final](https://github.com/ivan7800/SANITY-404/actions/runs/39966848382/artifacts/12507925777) tiene SHA-256 `df3ca986c54e303a70c100d893e367ac54ed95bbf85611706308998575b95d7f`, verificado antes de extraer las capturas.

La mejora es de legibilidad y composición de estas zonas. La iluminación sigue contrastada, pero las mallas de personajes, la grieta y varios acabados conservan formas simples. Estas capturas no prueban paridad artística global con un título comercial de GameCube de 2002. El recorrido automatizado usa guardados sembrados y comprueba interacciones y transiciones; no equivale a una pasada manual completa andando con mando físico.

## Puertas aún abiertas

`lspci` identifica la Intel HD Graphics 620 (`8086:5916`), pero en este proceso no existe `/dev/dri` y `glxinfo -B` no puede abrir `:0`. CI no mide la GPU física. En Linux Mint con acceso X11 y `/dev/dri`, iniciar Vite en el puerto 5190 y ejecutar `node scripts/performance-phase10.mjs --url=http://127.0.0.1:5190/ --seconds=60 --headed --hardware --only=1927:combat --output=docs/capturas/fase10c/hardware-combat-1927-nueva.json`. Aceptar sólo `gpuType: physical`, `scenarioValid: true`, `performancePass: true`, sin errores y peor ventana de 60 intervalos superior a 45 FPS. La medición anterior de Fase 10 no certifica este incremento.
