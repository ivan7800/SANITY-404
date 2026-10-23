# Fase 10B · revisión de la ejecución 39834313353

Fecha de revisión: 23 de octubre de 2026. Rama: `fase10/remaster-gamecube-2002`. La PR #14 permanece abierta como borrador, sin fusionar. El remoto apunta a `fcd83eac22edd1ecd30aedb3f9e9d3d44274f9e4`; el checkout local está en `9008941`, un commit por detrás. La única diferencia en archivos seguidos respecto al remoto, además de este informe, es una ampliación local previa de `docs/FASE10B-AUDITORIA.md`. El cambio local del workflow ya coincide con `fcd83ea`. Los archivos sin seguimiento preexistentes se conservaron.

## Evidencia de GitHub Actions

La [ejecución 39834313353](https://github.com/ivan7800/SANITY-404/actions/runs/39834313353) probó el merge de la PR con `main` (`4e24ce7`), cuya rama fuente era `fcd83ea`. `verify` y `browser` terminaron con resultado `success`.

- `verify`: formato correcto; 23 archivos y 98 pruebas aprobadas en el checkout de CI; compilación de TypeScript y Vite correcta. El recuento local anterior de 184 incluía pruebas del directorio ajeno `fase8-worktree/`.
- `browser`: Google Chrome 155.0.8059.39 en Ubuntu 24.04. La suite imprimió `PASS historical portals, puzzles, artifacts, save and choice`. Incluye aviso e interacción del acceso romano, transición a 189, aviso de la carta astral, rutas medievales, puzles y persistencia. El diagnóstico guardado contiene `faults: []`.
- El [artefacto original](https://github.com/ivan7800/SANITY-404/actions/runs/39834313353/artifacts/12450381422) tiene SHA-256 `71ee194be98c455a14099ca24ee6f2797eb0fed0796a105dafccec9d474a53c1`. Se verificó ese digest antes de extraer [portal-romano.png](capturas/fase10b/actions-39834313353/portal-romano.png), [rellano-astral.png](capturas/fase10b/actions-39834313353/rellano-astral.png), [diagnostico.json](capturas/fase10b/actions-39834313353/diagnostico.json) y [sanity-vite.log](capturas/fase10b/actions-39834313353/sanity-vite.log). Son capturas de Chrome real en CI, a 960 × 640. El script usa un guardado sembrado para situar a Élise en las dos zonas y no demuestra por sí solo la calidad del trayecto andando.

## Revisión visual de las dos capturas

El vestíbulo muestra escalera, muebles, ventanas, cortinas, materiales con dibujo, iluminación cálida y siluetas 3D originales. El aviso de la grieta romana aparece desde la planta baja, y el de la carta astral aparece en el rellano. No se observa una superposición entre portal y escalera; la prueba de interacción confirma que el acceso lleva al santuario romano.

La composición del acceso romano **necesita otra iteración**: la columna, las cortinas y un objeto de primer plano cubren buena parte del marco y del hueco. El jugador recibe el aviso, pero la puerta no se identifica de inmediato en la captura. En el rellano, Élise ocupa el centro y la carta queda pequeña y parcialmente oculta por la barandilla y el personaje. La arquitectura y los personajes todavía muestran formas geométricas sencillas y detalles repetidos. Estas imágenes no acreditan por sí solas una calidad final comparable a un survival horror tridimensional de GameCube de 2002. La prioridad visual es ajustar la cámara y la composición desde posiciones jugables, luego revisar proporciones y materiales con capturas comparables.

## Límites de la validación local y del rendimiento

El navegador MCP abrió el menú en `127.0.0.1:5173`, pero el clic en «Continuar» fue rechazado por la revisión automática de aprobación (`MCP tool call requires approval, but approval policy is never`). El intento local de `node scripts/browser-historical.mjs` acabó al iniciar Chrome: Crashpad informó `setsockopt: Operation not permitted` y el proceso terminó con `SIGTRAP`. Esto no invalida la pasada aprobada de Actions ni proporciona una inspección jugable local nueva.

No hay acceso a la Intel HD Graphics 620 física desde este proceso: `/dev/dri` no existe y `glxinfo -B` no puede abrir `:0`. La ejecución de CI tampoco identifica una GPU física ni mide FPS. La pasada anterior a la reubicación del portal en [FASE10.md](FASE10.md) registró 48,67 FPS en la peor ventana de combate 1927; no certifica este incremento. **La puerta de 45 FPS sostenidos posterior a Fase 10B sigue pendiente.**

En una sesión X11 con la HD 620 expuesta, usar un checkout de `fcd83ea` o posterior que contenga la corrección, cerrar otras cargas 3D y ejecutar:

```bash
npm run dev -- --host 127.0.0.1 --port 5190
# En otra terminal, con Chrome visible y /dev/dri disponible:
node scripts/performance-phase10.mjs --url=http://127.0.0.1:5190/ --seconds=60 --headed --hardware --only=1927:combat --output=docs/capturas/fase10b/hardware-combat-1927-nueva.json
```

Aceptar la muestra sólo si el JSON identifica un renderizador Intel físico (`gpuType: physical`), no informa errores, marca `scenarioValid: true` y `performancePass: true`, y la peor ventana de 60 intervalos supera 45 FPS. Repetir la pasada si hay interferencia o variación térmica. Para comprobar las nueve combinaciones de época y escenario, quitar `--only=1927:combat` y escribir a un archivo nuevo. Para las capturas de recorrido, ejecutar `SANITY_ARTIFACT_DIR=docs/capturas/fase10b/recorrido-nuevo SANITY_TEST_URL=http://127.0.0.1:5190/ node scripts/browser-historical.mjs` y comparar las imágenes nuevas con las dos de CI.

## Decisión y siguiente trabajo

La regresión funcional del portal y la carta queda aprobada por CI. **Fase 10B no se cierra como validación visual y física completa**: hay problemas de encuadre observables y falta la pasada nueva en HD 620. La PR #14 sigue como borrador.

El siguiente incremento debe corregir primero los encuadres del portal y del rellano, volver a capturar ambas vistas y completar la medición física. Después, el desarrollo de la campaña seguirá el contrato de [CAMPANA-12.md](CAMPANA-12.md): extraer identificadores y estados de capítulo con migración explícita de guardados v1, convertir un tramo existente en capítulo piloto completo y verificar su salida, combate, puzle, audio, accesibilidad y rendimiento antes de producir otro. Los nueve capítulos restantes siguen siendo diseño; no se crean entradas jugables vacías.

## REA y Skills consultadas

`mcp__rea__binary_session({})` respondió con paquete y servidor `rea-agents` 6.5.0, protocolo `2025-06-18`, catálogo de 207 herramientas y sesión `open: false`. Se leyó la Skill local `reverse-engineer-anything` v42: excluye el análisis ordinario de un repositorio con código fuente completo, por lo que no se abrió ningún binario ni se atribuyó a REA la revisión del juego.

Se consultaron `ecc:browser-qa` para separar interacción, capturas y límites de accesibilidad; `ecc:frontend-design-direction` para exigir revisión del resultado renderizado; `ecc:benchmark-optimization-loop` para exigir una línea base física y una métrica reproducible; y `ecc:change-impact` para relacionar cámara, portal, colisiones y prueba histórica. Para la siguiente etapa se consultaron `ecc:contract-first` y `ecc:module-regression`; su maquinaria de contratos entre servicios y de ledger de regresión se evaluará sólo si los límites y dependencias reales del sistema de capítulos la justifican. Se consultó `ecc:blender-motion-state-inspection`, pero no se aplicó: los personajes de esta fase son mallas procedurales del proyecto, sin una escena Blender que inspeccionar.
