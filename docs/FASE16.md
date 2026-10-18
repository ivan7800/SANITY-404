# Fase 1.6 — Cámara y lectura cinematográfica

Implementación local, sin publicación. Recursos originales; se conserva el formato de guardado v1, las cinco estancias, documentos, inventario, sellos y desenlaces.

## Cambios

- Cámara clásica con entrada a 2,35 m, galería a 2,1 m y umbral a 1,95 m, frente a los 3,7–4,6 m anteriores. Seguimiento moderno a 2,05 m seleccionable en Opciones, persistido y compatible con ajustes antiguos.
- Posición y punto de mirada interpolados; recorte de la visual por volúmenes de muebles, columnas y muros. Encuadre de combate incluye el punto medio entre actores. Reducir movimiento aplica los encuadres directamente.
- WASD, flechas y stick conservan ejes de mundo en ambos modos: un cambio de plano no cambia la dirección mantenida. No son controles relativos a pantalla.
- Golpes de ambos actores comprueban el segmento a altura del torso contra las cajas de colisión. Un mueble alto bloquea; una alfombra no. Se conserva distancia y recuperación del combate.
- Anticipación articulada enemiga, círculo tenue de proximidad que se refuerza durante la preparación, reacción al impacto, borde discreto de daño/defensa y sonido adicional al golpear. Caída articulada del jugador antes de mostrar Reintentar; cadáver visual separado del enemigo lógico ya derrotado.
- Rostro con párpados, proporción adulta también en enemigos; se conserva ropa de época, dedos, cabello volumétrico y materiales diferenciados. Mezcla de locomoción y pose de defensa, rodillas articuladas y animación de caída.
- Sombras de contacto suaves bajo actores incluso en Bajo; bruma localizada junto a muros, polvo y luz de cordura lenta conservando visibilidad. Viento filtrado generado y crujidos originales espaciados, respetando volumen y pausa.
- Bajo conserva límite interno de 1024 × 576 y sombras dinámicas desactivadas; interfaz a resolución del navegador. No se han añadido recursos remotos.

## Validación y evidencias

Las 34 pruebas anteriores se conservan íntegramente; cinco adicionales comprueban altura y modos de cámara, transición, ataques obstruidos en ambos sentidos y caída sin mover la raíz de colisión, más el encuadre del pasillo lateral.

Las capturas y mediciones reproducibles de esta fase se generan con `node scripts/cinematic-validation.mjs`, con servidor del lanzador activo. Usa Chrome headless con ANGLE/OpenGL y verifica el nombre real de la GPU; mide intervalos rAF sin eliminar pausas largas, 600 muestras después del calentamiento. El tiempo CPU de envío de render no equivale al tiempo GPU.

## Límites

Las animaciones y caras siguen siendo procedurales, sin captura de movimiento ni interpretación facial. La corrección de cámara usa cajas, no triángulos de cada adorno; algunos recortes muy cercanos pueden requerir nuevos encuadres. Las sombras de contacto son una aproximación suave, no oclusión ambiental completa. El audio ambiental se ha ejecutado en navegador, pero su mezcla requiere escucha humana. El objetivo 45–60 FPS no es garantía universal. Windows, Edge y mando físico requieren verificación en sus equipos; las pruebas de mando usan Gamepad API simulada.

## Resultados reales

- `npm run build`: correcto, TypeScript sin errores. JS de producción 553,88 kB / 147,51 kB gzip; rutas relativas de Vite conservadas.
- `npm test`: **39/39**, incluidas las 34 originales sin modificar.
- `npm run format:check`: correcto.
- `npm run test:browser`: campaña completa hasta el final, guardado/carga, inventario y foco, documentos, llave, cuatro mecanismos, puertas, tres sellos, bloqueos, daño/muerte/reintento y segundo desenlace con efectos reducidos. Sin errores JavaScript. Ejecutado con SwiftShader y repetido con aceleración Intel después del ajuste de locomoción.
- `npm run test:phase1`: personaje articulado, movimiento real, tres zonas de cámara, persecución, anticipación, defensa con daño reducido, dos golpes y derrota, diario y puzle; correcto en navegador.
- Mismo comando verifica Gamepad API simulada: movimiento, pared, LB, inventario, mapa y regreso. Correcto.
- `node scripts/test-launcher.mjs`: inicio/cierre, Node mediante PATH y NVM real, concurrencia, puerto alternativo, URL correcta, cierre autenticado y recuperación de bloqueo incompleto: correctos. `--real-browser`: Chrome abrió el juego y creó el canvas WebGL. Servidor de pruebas detenido al terminar. Doble clic físico en Cinnamon y Windows siguen pendientes.
- `node scripts/cinematic-validation.mjs`: cinco capturas reales, prueba de mantener W atravesando un cambio de zona en ambos modos, comprobación de GPU Intel y selector/persistencia de cámara desde Opciones. Correcto. La última adición de cámara lateral queda comprobada por este script y su prueba unitaria; no cambia la ruta central de campaña ya recorrida.

### Rendimiento a 1280 × 720, Bajo

Chrome headless, renderer verificado: `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`. Equipo de 8 GB, resolución 3D interna 1024 × 576; interfaz nativa 720p. Dos ejecuciones, 600 muestras por fila después del calentamiento, sin otra prueba de navegador en paralelo:

| Escenario | Primera media | Segunda media | P95 del intervalo final |
| --- | ---: | ---: | ---: |
| Galería, posición fija tras caminar desde entrada | 55,5 FPS | 55,9 FPS | 33,3 ms |
| Combate con IA activa y defensa mantenida | 42,3 FPS | 46,9 FPS | 33,4 ms |

Son muestras breves y escenarios concretos, no mínimos ni promedios de toda la campaña. La variación entre ejecuciones impide afirmar 45–60 FPS estables durante todo el combate. Los otros tres registros tienen menos de 600 muestras y sirven de evidencia visual, no de benchmark comparable. No se ha medido esta fase a 1080p ni en Firefox/Edge; los números de Fase 1.5 son históricos y no se trasladan a esta versión.

Datos completos: [ejecución inicial](capturas/fase16/mediciones-iniciales.json), [ejecución final](capturas/fase16/mediciones.json). Ambas incluyen encuadres, estado, tamaño del canvas, triángulos, draw calls, memoria de recursos Three.js y métricas sin resumir. No representan toda la RAM ni la VRAM.

[Comparativa visual](comparativa-fase16.html): antes de Fase 1.5 y después, clásica, moderna, combate, corredor lateral de biblioteca y aparición por cordura. El corredor es el espacio existente entre estantería y muro, con plano específico a 1,85 m; no se ha añadido una estancia vacía. La aparición se captura con una partida válida de cordura 20 y tiempo 21; el observador de pruebas es solo de lectura y se elimina de producción.

### Pendientes

Optimizar los peores momentos de combate para sostener el objetivo; valorar la presentación mediante revisión humana. Verificar Firefox y Edge actuales, mando físico, mezcla de audio en altavoces/auriculares y Windows. No se atribuye una nota automática ni equivalencia artística con un título comercial.
