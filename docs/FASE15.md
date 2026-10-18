# Fase 1.5 — Remasterización visual

## Dirección y cambios

La revisión conserva escenarios, documentos, guardado, inventario, sellos, medallón, enemigos, combate y cordura. No incorpora capítulos ni modifica el lanzador Linux. Todo el contenido de presentación nuevo procede de geometría y texturas generadas para SANITY-404, sin recursos extraídos de juegos comerciales.

Élise tiene una silueta anatómica más estrecha, torso entallado, abrigo de viaje, cuello de blusa, solapas, cinturón y hebilla, botones, bolsillos, bandolera, botas, rodillas, manos con cinco dedos, facciones y cabello recogido. Son mallas volumétricas con articulaciones; los detalles rígidos se agrupan por material dentro de cada articulación. Reposo, caminar, correr, ataque, defensa y reacción al daño tienen poses diferenciadas; no se incorpora captura de movimiento ni simulación física de ropa.

La mansión combina arquitectura previa con cortinas plegadas, apliques y pantallas, escritorio con cajones, tiradores y patas torneadas, chaise acolchada, bordes bordados y retratos originales de la familia ficticia Veyr. Se sustituyen los bloques de mobiliario de prueba manteniendo sus volúmenes de colisión y las rutas de campaña.

## Materiales e iluminación

Se generan mapas deterministas de albedo, rugosidad y normales de madera, piedra, latón oxidado, tela, cuero y enlucido. Son texturas originales de 128 × 128 con mipmaps; se comparten durante toda la sesión para evitar duplicarlas en transiciones. Albedo usa sRGB y los mapas de datos usan espacio lineal. Los retratos de 128 × 192 son ilustraciones procedurales originales sobre cuadros del escenario; no sustituyen al protagonista ni a los enemigos.

La luz principal cálida es un foco con penumbra y sombras PCF suaves. El exterior aporta una dirección azulada; los apliques y los objetos reciben luz cálida secundaria. Solo un foco proyecta sombras. La niebla moderada, el polvo de baja opacidad, las variaciones lentas del sistema de cordura, ACES y una viñeta menos agresiva completan el tratamiento de color. Reducir efectos desactiva el polvo y las variaciones psicológicas. No hay destellos rápidos, bloom de pantalla completa ni efectos costosos de desenfoque.

Los objetos próximos se señalan con un aro volumétrico discreto y texto de interacción. La interfaz tiene paneles de contraste, letras y barras mayores, con tamaños específicos para 720p y 1080p.

## Cámara

Se mantienen los tres encuadres de la mansión. Un rayo desde la altura del torso comprueba cajas tridimensionales de paredes, columnas y mobiliario sólido antes y después de interpolar la cámara. Si la línea está bloqueada, la cámara se acerca al personaje y centra el encuadre en él. No cambian los ejes ni los controles de movimiento.

Es una solución basada en volúmenes sólidos, no una garantía de visibilidad de cada dedo o de transparencias perfectas ante toda pieza ornamental. Las barandillas finas y los textiles decorativos no son obstáculos de cámara independientes.

## Comparación visual

[Comparador interactivo antes/después](comparativa-fase15.html).

| Encuadre | Cámara conservada         | Antes                                | Después                                        |
| -------- | ------------------------- | ------------------------------------ | ---------------------------------------------- |
| Entrada  | (6.8, 4.3, 7.25), FOV 58° | [Fase 1](capturas/fase1-entrada.png) | [Fase 1.5](capturas/fase15/fase15-entrada.png) |
| Umbral   | (5.9, 4.6, −0.2), FOV 58° | [Fase 1](capturas/fase1-umbral.png)  | [Fase 1.5](capturas/fase15/fase15-umbral.png)  |

Se conserva la referencia 800 × 600 y no se retocan las capturas. Los estados de personaje y el momento de animación pueden variar; las posiciones de cámara se comprueban numéricamente con tolerancia de 10⁻⁶. Las capturas de referencia se toman con calidad media. Las imágenes 720p y 1080p verifican además la interfaz en formato 16:9.

## Presupuesto de calidad

| Perfil | Resolución interna máxima       | Sombras       | Polvo          |
| ------ | ------------------------------- | ------------- | -------------- |
| Baja   | 1024 × 576, escala máxima 0,8   | desactivadas  | 32 partículas  |
| Media  | 1600 × 900, escala máxima 1,0   | un mapa 1024² | 80 partículas  |
| Alta   | 1920 × 1080, escala máxima 1,25 | un mapa 2048² | 160 partículas |

La resolución también respeta el DPR real. El límite se recalcula al redimensionar; el HUD permanece a resolución CSS nativa. Los perfiles no alteran enemigos, daño, inventario ni cordura.

Las sombras de la escena quieta se reutilizan. Se invalidan al caminar, correr, atacar, defender, recibir daño, cambiar visibilidad del enemigo o mover la IA; Media limita la actualización de sombras a unos 30 Hz y Alta actualiza en cada fotograma activo. La respiración de menos de un centímetro no fuerza una nueva pasada de sombras. La iluminación de los objetos se resuelve con un relleno común y cuatro apliques, en vez de añadir un punto de luz por cada interacción. El aro de proximidad y el texto mantienen su legibilidad.

## Método de medición

Se comprobó `glxinfo -B`: Intel HD Graphics 620 acelerada, memoria unificada. El sistema informa Intel Core i5-7200U y aproximadamente 8 GB de RAM. El banco sin interfaz selecciona ANGLE/OpenGL y usa `--ignore-gpu-blocklist` para solicitar aceleración. Chrome también identificó **ANGLE (Intel, Mesa Intel HD Graphics 620, OpenGL 4.6)**; no se deduce la GPU únicamente del hardware instalado.

Cada perfil se abre en un contexto nuevo, se calienta durante al menos 30 fotogramas y se registran 600 intervalos `requestAnimationFrame`. Las cifras de FPS corresponden al inverso del intervalo medio; P95 es el percentil 95 del tiempo entre fotogramas. El tiempo de envío de comandos JavaScript no se interpreta como tiempo GPU. Los contadores de llamadas y triángulos de Three.js describen el pase principal: la biblioteca reinicia esos contadores después de generar las sombras.

Se mide una vista de entrada en reposo y, por separado, una escena con IA, anuncio de golpes y defensa mantenida. La muestra activa conserva el enemigo y registra salud/combate al finalizar. No equivale a un perfil de toda la campaña o una prueba térmica de 30 minutos.

Los JSON conservan resolución interna, perfil, pose y cámara, métricas, geometrías/texturas residentes y heap JavaScript aproximado. El heap no mide toda la RAM del navegador ni la VRAM; los recuentos de recursos tampoco son una medición exacta de memoria GPU. Los mapas base compartidos ocupan aproximadamente 1,5 MiB con mipmaps; a ellos se añaden retratos, sombras y búferes de pantalla.

Se conserva además la primera pasada con SwiftShader (65 muestras por perfil, sin GPU acelerada) y la primera pasada de hardware previa a la optimización. El perfil Bajo se volvió a medir después de limitar su imagen interna a 1024 × 576. Sus cifras no deben mezclarse con las de la versión final.

## Resultados medidos en Intel HD 620

Vista de entrada en reposo, 600 muestras por fila, después de calentamiento:

| Salida      | Perfil | Imagen interna | FPS medios | P95 de fotograma |
| ----------- | ------ | -------------- | ---------: | ---------------: |
| 1280 × 720  | Baja   | 1024 × 576     |       54.8 |          33.3 ms |
| 1280 × 720  | Media  | 1280 × 720     |       44.7 |          33.4 ms |
| 1280 × 720  | Alta   | 1280 × 720     |       42.8 |          33.4 ms |
| 1920 × 1080 | Baja   | 1024 × 576     |       48.8 |          33.4 ms |
| 1920 × 1080 | Media  | 1600 × 900     |       28.7 |          50.0 ms |
| 1920 × 1080 | Alta   | 1920 × 1080    |       20.8 |          66.7 ms |

Con IA y defensa activas (600 muestras por fila):

| Salida      | Perfil | Imagen interna | FPS medios |     P95 | Salud al finalizar |
| ----------- | ------ | -------------- | ---------: | ------: | -----------------: |
| 1280 × 720  | Baja   | 1024 × 576     |       49.5 | 33.4 ms |             85/100 |
| 1280 × 720  | Media  | 1280 × 720     |       28.3 | 50.1 ms |             70/100 |
| 1920 × 1080 | Baja   | 1024 × 576     |       36.1 | 33.4 ms |             76/100 |

El enemigo seguía vivo y junto al personaje al cerrar las muestras activas. El daño amortiguado confirma que no se midió una escena inmóvil sin IA. Esta carga no cubre todos los puzles, transiciones y ángulos de combate.

En este equipo se recomienda **Baja**, tanto con salida 720p como con salida 1080p; el HUD conserva la resolución nativa y la imagen 3D se limita a 1024 × 576. La muestra activa dio 49,5 FPS y 36,1 FPS, respectivamente. Media a 720p dio 28,3 FPS en la última muestra activa, pese a alcanzar 44,7 FPS en reposo; Alta a 1080p dio 20,8 FPS en reposo y no se recomienda para esta GPU. No se promete bloqueo estable a 30 o 60 FPS en toda la campaña. Pantallas HiDPI, otros controladores, temperatura y procesos de fondo pueden cambiar el resultado. Se muestran las últimas muestras de cada perfil, sin sustituirlas por las cifras más favorables de pasadas anteriores.

En entrada, Three.js contabiliza 64 llamadas y 44.584 triángulos en el pase principal. En combate, 88 llamadas y 62.588 triángulos. Se observaron 64–89 geometrías y 20–21 texturas residentes. El heap JavaScript usado quedó aproximadamente entre 14,1 y 23,3 MiB; no representa la memoria total de Chrome. La distribución de producción ocupa unos 560 KiB en disco, sin las capturas de documentación; el JavaScript principal ronda 549 kB / 146 kB gzip.

Los informes [reposo](capturas/fase15/mediciones.json) y [combate](capturas/fase15/mediciones-combate.json) reúnen las últimas muestras independientes de cada perfil. Sus filas de Baja se actualizan desde los ficheros originales de la repetición tras ajustar el límite de resolución: [Baja en reposo](capturas/fase15/mediciones-integrada-reposo.json) y [Baja con IA](capturas/fase15/mediciones-integrada.json). Se conservan también [hardware antes de optimizar](capturas/fase15/mediciones-previas-optimizacion.json) y [pasada inicial SwiftShader](capturas/fase15/mediciones-swiftshader.json).

Capturas adicionales: [720p](capturas/fase15/fase15-720p.png), [1080p](capturas/fase15/fase15-1080p.png) y [defensa con enemigo](capturas/fase15/fase15-combate.png). Estas imágenes usan Media para mostrar el acabado con sombras; en Baja se conserva geometría, texturas e interfaz, con menor resolución interna y sin sombras proyectadas.

## Reproducir la revisión

Con Node y dependencias ya instalados:

```sh
./INICIAR-SANITY-404.sh --no-browser
npm run build
npm run format:check
npm test
npm run test:browser
npm run test:phase1
node scripts/visual-remaster.mjs --hardware --benchmark
node scripts/visual-remaster.mjs --hardware --benchmark --active
node scripts/visual-remaster.mjs --hardware --benchmark --active --integrated
./INICIAR-SANITY-404.sh --stop
```

La prueba `--hardware` rechaza SwiftShader y llvmpipe: si no hay aceleración real, se debe ejecutar sin esa opción y etiquetar los resultados como software. La variante sin `--hardware` utiliza SwiftShader y toma 65 muestras por perfil. Los scripts no publican ni instalan dependencias.

## Validación y pendientes

Compilación TypeScript/Vite, formato y **34 pruebas unitarias aprobadas**. Cubren además de las reglas previas los mapas PBR compartidos, su colorimetría y presupuesto, límites de resolución en HiDPI, rodillas, carrera y proporción adulta de cabeza/cuerpo, oclusión de cámara y reutilización/invalidez de sombras. La regresión de campaña y fallos se ejecutó en Chrome: partida nueva, guardar/cargar, documentos, llave, medallón, biblioteca, tres sellos, cripta, capilla, ruinas, desenlace, bloqueo de puertas, respuesta incorrecta, muerte/reintento y segundo final. No se publicaron cambios.

Pendientes: ensayo térmico y de memoria prolongado, otras GPU integradas, Windows/Edge, nueva revisión completa de Firefox, mando físico, evaluación artística con jugadores y auditoría integral de accesibilidad. Las capturas y mediciones no convierten automáticamente el acabado en equivalente al de una producción comercial de GameCube.

El lanzador Linux pasó de nuevo su prueba de detección PATH/NVM, inicio concurrente y reutilización, puerto alternativo, cierre autenticado y recuperación de bloqueo incompleto. Las pruebas de Fase 1 también verificaron movimiento, animación, combate con defensa, lectura, puzle y mando virtual. El doble clic en Cinnamon y el mando físico siguen pendientes.
