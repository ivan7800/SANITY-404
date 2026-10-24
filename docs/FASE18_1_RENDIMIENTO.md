# Fase 18.1 — Estabilización del rendimiento

Fecha: 24 de octubre de 2026. Rama `fase11/campana-historica`. Se conservaron todos los cambios locales de las fases 17 y 18. El informe registra el estado al cerrar la fase, antes de la publicación conjunta. Incidencia de origen: [A17-01](FASE17_AUDITORIA.md).

## Resultado y alcance

**Las seis ejecuciones válidas de esta fase cumplen el umbral de 45 FPS en cada ventana móvil de 60 fotogramas.** El peor caso final fue **57,16 FPS** en combate y **59,03 FPS** en planta superior. Cada ejecución contiene 600 intervalos consecutivos tras 100 fotogramas de calentamiento, en una ventana real de Chromium con `innerWidth × innerHeight = 1280 × 720`, sin iframe. El canvas WebGL midió 1024 × 576. El renderizador informado fue `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`. Se usó calidad Baja, cadencia de `requestAnimationFrame` sincronizada alrededor de 60 Hz, una recarga y guardado inicial independientes por ejecución, y otras pestañas en blanco.

A17-01 queda **resuelta en los dos escenarios medidos con este método**. No se extrapola la cifra a todos los capítulos ni a una sesión prolongada. La prueba es una escena de combate en planta baja y una posición de planta superior, con el personaje vivo y la partida activa al finalizar. [Datos brutos previos](capturas/fase18_1/baseline-real-1280x720.json) y [finales](capturas/fase18_1/optimized-real-1280x720.json) contienen los 600 intervalos de cada ejecución, estado, contadores y tiempos.

| Escenario | Ejecución | Media antes FPS | Peor 60 antes FPS | P95 antes ms | Media después FPS | Peor 60 después FPS | P95 después ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Combate | 1 | 56,01 | 46,77 | 33,3 | 59,63 | **57,16** | 16,7 |
| Combate | 2 | 56,18 | 50,72 | 33,3 | 59,72 | **58,08** | 16,7 |
| Combate | 3 | 56,90 | 52,96 | 33,2 | 59,73 | **58,08** | 16,7 |
| Planta superior | 1 | 56,89 | 46,77 | 33,2 | 59,92 | **59,04** | 16,7 |
| Planta superior | 2 | 57,90 | 51,44 | 16,8 | 60,02 | **60,02** | 16,7 |
| Planta superior | 3 | 59,14 | 56,26 | 16,7 | 59,93 | **59,03** | 16,7 |

«Peor 60» es el mínimo de `60000 / suma(ms de 60 intervalos)` sobre las 541 ventanas móviles de cada ejecución. El P95 es el intervalo ordenado en el índice `floor(599 × 0,95)`. La salud final fue 16/16/28 antes y 28/28/28 después en combate; 40 en todas las ejecuciones superiores. Ninguna acabó pausada. Los intervalos mayores de 25 ms pasaron de 42/41/33 a 4/3/3 en combate, y de 32/21/9 a 1/0/1 arriba. La variabilidad entre recargas impide interpretar la diferencia de una pareja de filas como efecto exacto; el aislamiento del velo se comprobó además con una ablación específica.

## Diagnóstico de A17-01

La medición de fase 18 que alcanzó **42,37 FPS** utilizaba un iframe interno de 1280 × 720 recortado por una ventana exterior de 881 × 793. Una repetición de **32,16 FPS** terminó con salud cero y no era válida para aceptación. En esta fase se consiguió una ventana exterior real de 1280 × 720: la línea base del mismo código dio un mínimo de 46,77 FPS. En una comparación controlada dentro de la ventana real, el iframe totalmente visible dio 52,19 FPS en su peor ventana y, al recortar ese mismo iframe con la ventana exterior de 881 × 793, 48,02 FPS; la media cayó de 56,54 a 50,44 FPS sin aumento correspondiente del tiempo de juego CPU/GPU. Por tanto, el recorte y la composición alteraban la cadencia medida. La sincronización vertical se mantuvo activa: la cuantización de los intervalos alrededor de 16,7 y 33,3 ms muestra fotogramas perdidos, pero no se pudo separar por completo el planificador de Chrome, el controlador y el compositor mediante una traza de bajo nivel.

El perfil de la ventana real descarta varios sospechosos como causa principal de estas caídas. En combate hubo 130–131 draw calls y unos 73.440 triángulos; arriba, 75 y 56.360. La escena de combate contenía 213 mallas, 215 geometrías, 139 materiales y 14 texturas enlazadas; la superior, 291, 293, 161 y 14. Ambas tenían 12 mallas transparentes, 80 puntos de partículas, dos mallas de bruma y una luz hemisférica, una direccional, una focal y tres puntuales. Hay mallas marcadas para proyectar sombras, pero **cero luces que las proyecten** en el perfil Baja. El polvo actualiza su búfer a 15 Hz y la bruma desplaza dos mallas por fotograma. El cambio final dejó iguales draw calls, triángulos, luces, partículas y enemigos. No se aislaron individualmente los costes GPU de cada material o luz: la atribución principal procede de los tiempos agregados y la ablación CSS.

En la línea base, el P95 de actualización CPU fue 1,3–1,5 ms en combate y 1,3–1,4 ms arriba; el de render CPU, 8,6–9,6 y 6,1–8,1 ms; el temporizador GPU dio 12,1–12,3 y 11,4–12,1 ms. Tras añadir una medición aislada de IA, su P95 fue 0,4 ms en ambos escenarios. El P95 GPU final incluso fue 13,1 ms en combate y 12,6–12,8 ms arriba, sin descenso que explique la mejora. La actualización de IA, la geometría, las sombras y la carga de WebGL no muestran el patrón de los intervalos de 33,3 ms.

Una ablación A/B/A del velo de pantalla señaló el coste de composición CSS. En combate a 1280 × 720, ocultar todo `#veil` produjo 60,02/60,02 y 59,92/59,04 FPS (media/peor 60); restaurarlo dio 56,27/53,75. Al quitar solo su `box-shadow: inset`, conservando el gradiente, el resultado fue 59,53/58,08; al quitar solo el gradiente y conservar la sombra fue 57,35/54,56; sin ambos, 59,73/58,08; con ambos, 56,36/53,75. [Ablación A/B/A](capturas/fase18_1/ablation-veil-real.json) y [componentes](capturas/fase18_1/ablation-veil-components-real.json). Esta evidencia atribuye la mayor parte del coste al sombreado interior del velo. Es una inferencia de ablación y contadores, no una traza interna del compositor.

## Cambio selectivo y calidad visual

Se sustituyó la combinación de gradiente radial más `box-shadow: inset` de `#veil` por **un único gradiente radial** con transición en el borde. Se conservan la viñeta oscura, iluminación, bruma, partículas, enemigos, sombras configuradas, materiales y geometría. [Captura anterior](capturas/fase18_1/veil-original.png) y [captura final](capturas/fase18_1/veil-gradient-only.png) corresponden a la misma escena estática y ventana. La diferencia absoluta media RGB fue de 0,62/0,57/0,64 niveles sobre 255 en la imagen completa; en el centro, 0,16/0,15/0,16. Las diferencias visuales son mínimas en esa escena; no se hizo comparación automática de todas las ubicaciones.

Se añadió a `FrameMetrics` el tiempo de actualización y de IA, y un perfil de escena invocable en desarrollo. El perfil se consulta fuera del intervalo medido. El cronómetro de IA cubre `syncMansionThreat` y `combat.update`; no pretende representar todo el trabajo de la simulación.

## Regresión jugable y verificaciones

En la misma ventana Intel se subió de planta 0 a 1, se cruzaron las puertas de retratos y observatorio, se recogieron el Folio y la Carta, se guardó manualmente, se recargó la página, se cargó el guardado con posición y objetos conservados y se descendió a planta 0. La pose de extremidades cambió al caminar y `cameraCorrected=false` en las dos salas ensayadas. En una partida separada, el jefe pasó por las fases 1, 2 y 3 y cayó tras cuatro golpes fuertes efectivos, con defensa activada durante sus avisos de ataque; la protagonista terminó con 100 de salud. [Traza funcional resumida](capturas/fase18_1/regresion-juego-real.json). Los eventos de teclado sintéticos ejercen los listeners reales; no sustituyen una prueba manual de teclado, mando o animación revisada fotograma a fotograma. El código de colisión y animación no se modificó en 18.1.

- `npm test -- --maxWorkers=2 --testTimeout=15000`: **175/175** pruebas, 37 archivos.
- `npm run build`: TypeScript y Vite correctos; paquete JS del juego 234,66 kB sin comprimir.
- `npm run format:check`: correcto.
- `git diff --check`: correcto.

## Reproducción y límites

1. En la raíz, iniciar `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` y usar Chromium con aceleración Intel HD Graphics 620. Verificar con `WEBGL_debug_renderer_info` el renderizador exacto y con `innerWidth/innerHeight` la ventana **1280 × 720**. No usar un iframe ni la emulación de viewport recortada. En este entorno se abrió un popup real y se ajustó con `window.resizeTo(1280, 811)` hasta comprobar `innerHeight=720`; los píxeles de marco pueden variar en otros sistemas.
2. Para cada ejecución, recargar con calidad Baja y un guardado inicial `version:1, room:0, health:100, sanity:100, items:[], collected:[], read:[], defeated:[], seals:[], elapsed:0, ended:false`; combate: `x:0,z:0,floor:0`; superior: `x:-5,z:-5.7,floor:1`. Continuar la partida. Dejar las demás pestañas en blanco. Rechazar la muestra si hay pausa, muerte, error de consola, renderer distinto o tamaño incorrecto.
3. Esperar 100 callbacks de `requestAnimationFrame`; registrar los siguientes **600 intervalos consecutivos** con sus marcas temporales, sin inspección de estado por fotograma. Calcular media, P95 y las 541 ventanas móviles de 60 como se define arriba. Inspeccionar estado y contadores solo antes/después; repetir tres veces con recarga independiente por escenario. Los JSON enlazados guardan todos los intervalos para recalcularlos sin depender de cifras redondeadas.

`scripts/audit-phase18.mjs` contiene la siembra de guardados y el cálculo de ventanas para un host que permita lanzar Chrome mediante Playwright; requiere repetir cada escenario tres veces para reproducir 18.1. Aquí el lanzamiento directo de `/usr/bin/google-chrome` desde Playwright terminó en `SIGTRAP` del proceso de crashpad por `setsockopt EPERM`, y Firefox headless en `SIGSEGV`. Se utilizó Chromium ya conectado por DevTools, en un popup exterior real. La traza de rendimiento de Chrome DevTools no estuvo disponible por la política de aprobación de esta sesión, por lo que no se atribuye un tiempo exacto al compositor. No se dispuso de un control para desactivar VSync; la cadencia observada limita las medias a unos 60 FPS y hace sensibles las colas de fotogramas al estado del sistema. Las tres ejecuciones por escenario no prueban ausencia de caídas en recorridos más largos, otras calidades, resoluciones, hardware ni escenarios no medidos.

## Puntuación y pendiente

Puntuación técnica orientativa actual: **8,4/10** (fase 18: 7,8/10). Se justifica por 175 pruebas, compilación y formato correctos; ruta, guardado/carga y jefe verificados; y seis mediciones válidas con margen mínimo de 12,16 FPS sobre el umbral. No se eleva más porque faltan trazas internas del compositor, una sesión larga y cobertura de otras escenas y equipos. A17-01 se cierra **para los escenarios y condiciones medidos**. Sigue pendiente repetir el protocolo en los demás escenarios de la auditoría y revisar visualmente más posiciones en movimiento y controles físicos.
