# Fase 17 — Auditoría integral profesional

Fecha: 24 de octubre de 2026. Rama `fase11/campana-historica`, base `05e6dad`. El informe registra el estado local al cerrar la auditoría, antes de la publicación conjunta de las fases 17, 18 y 18.1.

## Resumen ejecutivo y veredicto

**No alcanza aún la meta de 9,5/10 ni acredita 45 FPS sostenidos en todas las zonas.** La campaña y los sistemas principales pasaron las pruebas ejecutadas, y una partida automatizada derrotó a la Raíz de los Nombres en sus tres fases. La planta superior cayó a 40,45 y 42,86 FPS en la peor ventana móvil de 60 fotogramas de dos muestras independientes. También hay encuadres superiores donde el personaje o el enemigo tapan la pista y ocupan gran parte de la pantalla. No se detectó un P0 ni un bloqueo de progresión en los recorridos realizados. Veredicto: **preparación condicionada; no declarar calidad 9,5/10**.

## Entorno y método

- Equipo: HP EliteBook 840 G4, Intel Core i5-7200U, Linux Mint/Ubuntu kernel 7.0.0-38, Chrome instalado en `/usr/bin/google-chrome`.
- Chrome headless con WebGL 2: `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`. El identificador se verificó en cada escenario; estas cifras no proceden de SwiftShader.
- Ventana 1280 × 720, calidad **Baja**, canvas interno 1024 × 576, cámara clásica, efectos psicológicos activos y volumen 0 para evitar interferencia acústica. Desarrollo Vite en `127.0.0.1:5173`; la compilación de producción se abrió aparte desde `/SANITY-404/`.
- Cada escenario de rendimiento carga un guardado aislado, calienta más de 100 fotogramas y registra **600 intervalos consecutivos** de `requestAnimationFrame`. FPS = 1000 / intervalo medio; P95 y P99 son percentiles de tiempo, no FPS. La ventana mínima de 60 intervalos es el peor tramo de un segundo aproximado. Son muestras cortas y mayormente estáticas, sin movimiento humano continuo. El heap indicado es solo memoria JavaScript medida por Chrome, no VRAM ni RAM total.

## Pruebas y escenarios ejecutados

| Comprobación                                            | Resultado real                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                              | 174/174 pruebas, 37 archivos. Incluye estado, guardados, IA, combate, campaña, cámaras y mundo.                                                                                                                                                                                                                      |
| `npm run build`                                         | TypeScript estricto y bundle Vite correctos. Producción: 233,76 kB de JS de juego y 525,11 kB de Three sin comprimir.                                                                                                                                                                                                |
| `npm run format:check`                                  | Correcto después de los cambios locales.                                                                                                                                                                                                                                                                             |
| `npm run test:browser`                                  | Nueva partida, movimiento, carta, llave, inventario, guardado y carga, tres puzles, campaña base, dos desenlaces, daño, muerte/reintento, WebGL perdido/restaurado; sin errores JavaScript reportados. Esta batería usa SwiftShader por configuración del script, por lo que acredita función, no rendimiento Intel. |
| `npm run test:launcher`                                 | PATH/NVM, arranque concurrente, puerto alternativo, cierre y recuperación correctos.                                                                                                                                                                                                                                 |
| `SANITY_HARDWARE=1 npm run test:phase1`                 | Chrome Intel: locomoción, cámara, IA, defensa, victoria en combate e interacción. Mando mediante Gamepad API **simulada**, sin mando físico.                                                                                                                                                                         |
| `SANITY_HARDWARE=1 node scripts/browser-historical.mjs` | Portales romano y medieval, puzles, artefactos, elección y recarga. Sus escenas se comprobaron en navegador, no solo con pruebas unitarias.                                                                                                                                                                          |
| `node scripts/audit-route-phase17.mjs`                  | Recorrido con teclas desde planta baja por escalera continua hasta retratos y observatorio; guardado en el rellano, cierre por recarga y carga en la misma posición de planta 1. [Trazas](capturas/fase17/auditoria/recorrido-planta-superior.json).                                                                 |
| `node scripts/audit-boss-phase17.mjs`                   | Combate con teclado: fases 1, 2 y 3 observadas; Raíz derrotada, Élise con 54 de salud, cero errores de consola. [Trazas](capturas/fase17/auditoria/jefe-combate.json).                                                                                                                                               |
| Bundle de producción                                    | Chrome Intel abrió `/SANITY-404/`, canvas 1024 × 576, HUD visible y observador de desarrollo ausente. [Captura](capturas/fase17/auditoria/production-smoke.png).                                                                                                                                                     |

El primer intento del script de recorrido falló por un defecto del **script**: reinsertaba el guardado de partida inicial al recargar. Se corrigió el script para sembrar datos solo si no existe guardado y el recorrido completo pasó. No se atribuyó ese fallo al juego. Un intento de mover los puntos de cámara superior hizo fallar la prueba de colisión de cámara; el cambio se retiró y la cobertura no se redujo.

## Evidencia visual y de enemigos

Capturas tomadas en esta auditoría con Chrome Intel: [entrada](capturas/fase17/auditoria/exploracion.png), [combate](capturas/fase17/auditoria/combate.png), [escalera](capturas/fase17/auditoria/recorrido-escalera.png), [retratos](capturas/fase17/auditoria/recorrido-retratos.png), [observatorio](capturas/fase17/auditoria/recorrido-observatorio.png), [cordura baja](capturas/fase17/auditoria/cordura.png), [jefe durante encuentro](capturas/fase17/auditoria/jefe.png) y [jefe derrotado](capturas/fase17/auditoria/jefe-combate-final.png). Los portales históricos se capturaron como [romano](capturas/fase17/auditoria/portal-romano.png) y [rellano astral](capturas/fase17/auditoria/rellano-astral.png). Son fotogramas reales del canvas; no prueban por sí solos ausencia de defectos durante todo el movimiento.

| Enemigo             | Evidencia y límite                                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Huésped Inmóvil     | Prueba unitaria confirma inmovilidad bajo observación y avance fuera de la vista; modelo activo en planta superior. La orientación fina de cabeza y todas las colisiones dinámicas no tuvieron inspección visual cuadro a cuadro. |
| Viuda del Rellano   | Encuentro activo en escalera y prueba de descenso físico. Hay geometría y animación de velo en código; no se escuchó humanamente el audio espacial.                                                                               |
| Reptante            | Prueba unitaria de variación de velocidad según observación y lógica de retirada tras ataque. Su locomoción completa no se inspeccionó visualmente en una secuencia de navegador.                                                 |
| Reflejo Equivocado  | Apareció con cordura baja en navegador; prueba unitaria de reposicionamiento y ventana de reacción. La captura muestra el efecto, pero no cuantifica la desincronización visual.                                                  |
| Raíz de los Nombres | Victoria real automatizada y tres fases observadas. La traza registra daño efectivo durante vulnerabilidad y ausencia de bloqueo permanente en este encuentro. El encuadre cercano sigue siendo mejorable.                        |

La arquitectura activa **un solo encuentro a la vez** en la mansión. Por ello no existe un escenario jugable de varios enemigos simultáneos; no se presenta una medición ficticia de ese caso. Las pruebas de colisión y cámara de 29 salas no equivalen a inspección visual manual de cada estancia. No se observaron objetos flotantes en las capturas revisadas, pero una inspección exhaustiva de todas las mallas queda pendiente.

## Rendimiento real

Datos brutos: [seis escenarios, 600 intervalos por escenario](capturas/fase17/auditoria/mediciones.json); [repetición aislada de planta superior](capturas/fase17/auditoria/medicion-planta-superior.json). Los intervalos de 33,3 ms indican fotogramas que saltan un refresco en pantalla de 60 Hz.

| Escenario                   | FPS medio | Mín. ventana 60 FPS | P95 / P99 ms |        Pico ms | Intervalos >25 ms |     Heap JS MB |
| --------------------------- | --------: | ------------------: | -----------: | -------------: | ----------------: | -------------: |
| Exploración                 |     59,90 |               59,01 |  16,7 / 16,8 |           33,4 |                 1 |           25,2 |
| Combate                     |     56,16 |               52,94 |  33,3 / 33,4 |           33,4 |                41 |           22,0 |
| Escalera                    |     54,80 |               51,43 |  33,3 / 33,4 |           33,5 |                57 |           31,9 |
| Planta superior             |     52,56 |           **40,45** |  33,3 / 33,4 |           50,0 |                84 |           25,9 |
| Cordura baja                |     59,61 |               58,07 |  16,8 / 16,8 |           33,5 |                 4 |           23,9 |
| Jefe                        |     54,96 |               46,75 |  33,3 / 33,4 |           50,0 |                54 |           24,7 |
| Planta superior, repetición |     55,90 |           **42,86** |  33,3 / 33,4 | Consultar JSON |    Consultar JSON | Consultar JSON |

El criterio de 45 FPS **sostenidos** falla en la planta superior pese a que su media supera 45. Las muestras no cubren sesiones largas, variación térmica sistemática ni otros equipos. Los números históricos de `docs/FASE17.md` pertenecen a otra ejecución y no se mezclan con esta tabla.

## Incidencias y correcciones

| ID     | Severidad | Hallazgo                                                                                                                                                                                                            | Estado                                                                                                                       |
| ------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A17-01 | **P1**    | Planta superior por debajo de 45 FPS en ventanas de 60 fotogramas, reproducido en dos muestras Intel.                                                                                                               | Abierto. Requiere perfil GPU/CPU específico de esa zona y optimización con comparación pareada.                              |
| A17-02 | **P2**    | En las dos salas superiores y cerca del jefe, personaje, puertas o enemigo pueden ocupar demasiado encuadre y tapar pistas/anticipaciones. Véanse capturas del recorrido y jefe.                                    | Abierto. Dos ajustes fijos de cámara probados no mejoraron de forma estable; se retiraron al detectar regresión de colisión. |
| A17-03 | **P2**    | HUD móvil de 480 × 320 superpone textos y reduce ayuda a 9 px; [captura de prueba](capturas/fase17/auditoria/movil-480x320.png).                                                                                    | Abierto. Requiere rediseño responsivo y comprobación de navegación con zoom.                                                 |
| A17-04 | **P2**    | Los guardados automáticos llaman `writeSave` sin comprobar su valor de retorno. Si falla `localStorage`, la confirmación del guardado manual sí lo comunica, pero algunos avances automáticos pueden no advertirlo. | Abierto; no se observó corrupción en las pruebas de recarga.                                                                 |
| A17-05 | **P3**    | Portada decía «Once lugares» y «piloto romano» pese a 29 salas y campaña histórica.                                                                                                                                 | Corregido en `src/main.ts`; compilación, formato y pruebas de presentación correctas.                                        |

La revisión de recursos encontró `dispose` del mundo, geometrías, materiales, sombras, audio y efectos al cambiar sala; no hay temporizadores `setInterval`/`setTimeout` de juego. Los listeners globales se instalan una vez al iniciar el módulo. No hubo evidencia de fuga en los recorridos cortos; falta una prueba de horas y uso de memoria GPU. El guardado `v1` se migra a `v2` y las pruebas cubren datos inválidos y planta superior; el recorrido confirmó una recarga real en planta 1. Solo `Audio.start()` es asíncrono en `src` y tiene `.catch`; los scripts escucharon `pageerror` y errores de consola, pero no se hizo una instrumentación independiente de cada `unhandledrejection`.

## Accesibilidad y experiencia

Los controles están visibles en pantalla y en Opciones; teclado, foco del menú, inventario y Escape pasaron pruebas automatizadas. Hay opciones para volumen, movimiento reducido, destellos, distorsión y sonidos intensos; el daño usa señal visual y barra de salud, y los objetivos aparecen como texto. No se hizo escucha humana de mezcla, medición de audio espacial, prueba con lector de pantalla ni auditoría completa WCAG 2.2. Las capturas de 1280 px muestran texto legible, pero el HUD pequeño y la superposición móvil impiden declarar accesibilidad completa. El `aria-live` de objetivos y mensajes está presente en el DOM; su lectura con tecnología asistiva queda pendiente.

## Riesgos y puntuación

| Área                     | Nota /10 | Motivo                                                                                   |
| ------------------------ | -------: | ---------------------------------------------------------------------------------------- |
| Técnica y guardados      |      8,5 | 174 pruebas, build y migración pasan; avisos de fallo de autoguardado incompletos.       |
| Jugabilidad y progresión |      8,2 | Recorridos base/históricos y jefe superados; no se recorrieron manualmente las 29 salas. |
| Enemigos                 |      8,0 | Cinco comportamientos diferenciados; cobertura visual y auditiva desigual.               |
| Visual 3D                |      6,8 | Mansión y escalera transitables; encuadres estrechos en planta superior.                 |
| Rendimiento Intel HD 620 |      7,0 | Medias >45, pero dos ventanas sostenidas de planta superior <45.                         |
| Accesibilidad y UX       |      6,8 | Controles y ajustes útiles; móvil y lector de pantalla pendientes.                       |

**Puntuación global orientativa: 7,5/10.** Es una valoración de esta evidencia, no una media estadística ni una certificación. Para cerrar la fase con criterio de publicación hacen falta corregir A17-01, verificar A17-02 con juego en movimiento, revisar A17-03/04 y repetir sesiones largas y escucha humana. No se cambió `main`, no se hizo merge, commit, push ni publicación.

## Reproducción

Desde la raíz, con `npm ci` y un servidor `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` activo:

```bash
npm test
npm run build
npm run format:check
npm run test:browser
node scripts/audit-phase17.mjs
node scripts/audit-phase17.mjs --only=planta-superior
node scripts/audit-route-phase17.mjs
node scripts/audit-boss-phase17.mjs
```

Los tres scripts de auditoría exigen Chrome en `/usr/bin/google-chrome`, pantalla con aceleración Intel y WebGL 2; `audit-phase17.mjs` detiene la medición si el renderer no contiene `Intel` y `620`. Los scripts usan contextos aislados de navegador y no tocan el guardado del usuario.
