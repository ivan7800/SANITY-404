# Fase 10B · auditoría e incremento del 22 de octubre de 2026

## Alcance y estado

La rama local es `fase10/remaster-gamecube-2002`, en `f947a94`. La [PR #14](https://github.com/ivan7800/SANITY-404/pull/14) sigue abierta como borrador contra `main`; no se fusionó. Se conservaron los archivos ajenos sin seguimiento. Las capturas originales de [Fase 10](FASE10.md) muestran un vestíbulo con muebles y escalera transitable; el acceso romano quedaba superpuesto a esa escalera. La mejora de este incremento desplaza el acceso a una crujía libre de la planta baja y le da un marco de piedra y un umbral de latón visibles en la geometría. No añade un capítulo ni cambia el formato de guardado.

## Causa comprobada del CI

En la [ejecución 39827455116](https://github.com/ivan7800/SANITY-404/actions/runs/39827455116), `verify` pasó y `browser` falló en «Browser QA of all three eras». El registro del trabajo `119994418029` indica `AssertionError` en `scripts/browser-historical.mjs:122`: la prueba esperaba `/grieta romana/` y el texto real era `E / A · Examinar carta astral del rellano`. No hay evidencia de Crashpad en ese fallo de GitHub Actions. El guardado de la prueba situaba a Élise en `(5.8, -6)`; el campo de altura de la nueva escalera lo elevaba a 2,64 y la selección de interacción filtraba los objetos de la planta baja. El portal romano estaba en `(5.8, -5.2)`, dentro del mismo recorrido vertical.

Se movió el portal a `(6.2, 3)`, se giró para mirar al pasillo y se actualizó la prueba histórica para usar la nueva ubicación. Una regresión unitaria verifica suelo a altura cero, ausencia de colisión y prioridad del portal. El alcance se limitó a la posición del objeto, su marco visual, la prueba histórica y la prueba de altura; no se tocaron partidas ni lógica de otras salas.

## Sistemas existentes y brechas

| Área | Evidencia actual | Brecha para doce capítulos |
| --- | --- | --- |
| Escenarios | 11 salas: mansión y anexos de 1927, santuario de 189, claustro y scriptorium de 1348 | Zonas históricas completas con entradas, recorridos y salidas propias |
| Protagonistas | Élise, Lucius e Isabelle, con rig y movimiento 3D | Nueve protagonistas y armas de época diseñados, producidos y probados |
| Combate | Ligero, fuerte, defensa, esquiva, IA, ventanas de vulnerabilidad | Objetivos anatómicos, respuesta localizada y variedad de armas |
| Magia | Puzles de sellos y consecuencias narrativas | Gramática ritual combinatoria original, costes, efectos y accesibilidad |
| Cordura | Eventos dependientes de umbral y época; controles de reducción | Catálogo contextual y validación por capítulo |
| Investigación | Documentos, objetos, elección y progreso persistente | Grafo de pistas y consecuencias entre doce capítulos |
| Guardado | Esquema v1 de salas `0..10` | Versión migrable con progreso por capítulo |
| Cámara y controles | Encuadres clásicos, seguimiento moderno, teclado y mando API | QA de todas las zonas, mando físico y ángulos de combate |
| Sonido | Ambiente, pasos y motivos procedurales | Dirección musical por capítulo y revisión auditiva humana |
| Rendimiento | Pasada física previa de nueve escenarios en HD 620 documentada en `FASE10.md` | Repeticiones térmicas y medición de cada capítulo nuevo |

El contrato, la propuesta narrativa y el orden de producción están en [CAMPANA-12.md](CAMPANA-12.md). Ninguno de los nueve capítulos de diseño se registra como implementado.

## Comprobaciones de este incremento

| Comprobación | Resultado |
| --- | --- |
| `npm test` | 42 archivos, 184 pruebas aprobadas |
| `npm run build` | TypeScript y Vite correctos |
| `npm run format:check` | Correcto |
| `git diff --check` | Sin errores de espacios |
| Chrome DevTools conectado a Vite | Página y canvas cargados, rig presente, cero mensajes de error o advertencia; sólo se inspeccionó el menú y la escena pausada |
| `node scripts/browser-historical.mjs` local | **No ejecutable en este sandbox**: Chrome del sistema falló al iniciar con `crashpad ... setsockopt: Operation not permitted` y `SIGTRAP` |
| Interacción en navegador MCP | **Rechazada por la política de aprobación** al pulsar «Nueva partida»; no se completó recorrido ni captura nueva del portal |
| FPS físico posterior al cambio | **Sin medición nueva**. La pasada de Fase 10 documentó mínimo 48,67 FPS, pero no acredita este cambio |

Veredicto de navegador: **NO APTO PARA FUSIÓN TODAVÍA**. La causa del fallo original está corregida en código y cubierta por pruebas unitarias; falta ejecutar la suite histórica en un navegador operativo, obtener una captura nueva del acceso y repetir al menos el escenario de combate de 1927 en la HD 620. El riesgo visual es que el nuevo marco y la puerta se solapen con la columna o la ventana orientales; sólo una captura en juego puede cerrarlo.

Se intentó crear un commit local después de preparar únicamente los siete archivos de este incremento. `git commit` no pudo crear `.git/index.lock` porque el montaje de `.git` es de solo lectura en esta sesión. El incremento se publicó mediante el conector de GitHub como un commit en `fase10/remaster-gamecube-2002`; el árbol local conserva los cambios sin commit local. No se modificó `main` ni se fusionó la PR.

## REA y Skills

El inventario completo está en [SKILLS-INVENTARIO.md](SKILLS-INVENTARIO.md). Se leyeron y aplicaron `ecc:change-impact`, `ecc:frontend-design-direction` y `ecc:browser-qa`; se consultó la Skill local `reverse-engineer-anything`. `mcp__rea__binary_session({})` respondió con sesión cerrada y catálogo de proveedores, lo que confirma la conexión real con Codex. La documentación oficial de la Skill indica que REA se omite para analizar un repositorio ordinario con código fuente completo; no se analizó un binario ni se instaló otro motor. No hay bloqueo de REA para esta tarea.

## Reanudación: evidencia del 22 de octubre de 2026

- La ejecución [39830075172](https://github.com/ivan7800/SANITY-404/actions/runs/39830075172) acabó con `verify` aprobado y `browser` cancelado durante `npx playwright install --with-deps chromium`. El registro termina con «The operation was canceled» tras descargar Chromium; Vite y la suite histórica no llegaron a ejecutarse. Este resultado no confirma ni refuta la corrección del portal.
- La reejecución del trabajo cancelado desde el conector de GitHub fue rechazada por la revisión automática de aprobación de esta sesión. No se modificó la ejecución remota ni la PR #14.
- El juego se cargó en Chrome DevTools y se observó una escena jugable de 1927 con personaje, enemigo, mobiliario y HUD. Esa observación quedó en la sesión del navegador, sin una captura nueva persistida del acceso romano. El clic directo del navegador MCP fue rechazado y el Playwright local volvió a fallar al lanzar Chrome con `crashpad ... setsockopt: Operation not permitted` y `SIGTRAP`. La inspección visual del portal y del rellano sigue **pendiente**.
- Se amplió `scripts/browser-historical.mjs` para comprobar también el aviso de la carta astral en el rellano y guardar capturas del portal, del rellano y del estado de fallo. `.github/workflows/verify-pr.yml` conserva esas capturas, errores de consola y el log de Vite como artefacto incluso si falla la suite; el tiempo máximo del trabajo sube a veinte minutos. La ejecución de Actions sobre estos cambios sigue pendiente.
- `lspci` identifica Intel HD Graphics 620, pero `/dev/dri` no está expuesto y `glxinfo` no puede abrir `:0` desde este proceso. No hay medición física nueva; sigue pendiente la pasada de sesenta segundos de combate 1927 con identificador WebGL físico y peor ventana de 60 intervalos por encima de 45 FPS.

**Puerta de cierre:** mantener la PR como borrador. Para cerrar Fase 10B faltan la ejecución aprobada de `browser`, las dos capturas nuevas revisadas y la medición física posterior al cambio del portal.

## Reproducción pendiente

En una sesión de Chrome que pueda arrancar, iniciar Vite en `127.0.0.1:5173` y ejecutar `node scripts/browser-historical.mjs`. En 1927, comenzar una partida y caminar al ala oriental hasta `(6.2, 3)`: el aviso debe mostrar la grieta romana desde el suelo; al interactuar debe cargar el santuario de 189. Subir después la escalera hasta el rellano: allí debe mostrarse la carta astral. Capturar ambos estados y revisar el marco de piedra. Para rendimiento, repetir el comando de `FASE10.md` con `--headed --hardware`, comprobar el identificador WebGL físico y comparar la peor ventana de 60 intervalos con el umbral de 45 FPS.
