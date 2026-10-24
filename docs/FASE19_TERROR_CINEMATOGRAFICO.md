# Fase 19 — Terror cinematográfico

Fecha: 24 de octubre de 2026. Rama `fase11/campana-historica`, base de trabajo `b304f4c`.

Las secciones de fase 19 conservan el estado de su primera revisión. **El estado vigente y la recomendación de publicación están al final, en «Fase 19.1».**

## Método y alcance de la auditoría

Abrí las **29 salas reales** en Chromium mediante DevTools, con WebGL 2 en `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`. Cada sala se cargó desde un guardado preparado para esa sala en la posición de entrada `x=0,z=5`, calidad Baja y cámara clásica. Las salas 1–28 se capturaron en un iframe visible a 881 × 793; la mansión se repitió en una ventana directa de 1280 × 720. Estas capturas **no** son muestras de rendimiento. Comprobé que la partida estaba activa, leí la zona de cámara y el inventario de interactivos de la escena, capturé la pantalla y revisé [tres hojas de contacto](capturas/fase19/contacto-1.jpg), [segunda](capturas/fase19/contacto-2.jpg) y [tercera](capturas/fase19/contacto-3.jpg). Las [29 capturas individuales](capturas/fase19/) y la [traza de sala e interactivos](capturas/fase19/auditoria-salas.json) son la evidencia primaria. La primera captura de la mansión cayó en el menú; se repitió tras confirmar `paused=false` y se sustituyó.

Esta es una **auditoría de encuadre de entrada por sala**, no un recorrido visual completo de cada rincón. Las rutas e interactivos de la tabla proceden del mundo efectivamente cargado en el navegador; no afirmo haber activado cada uno. La legibilidad de puertas se juzga desde la entrada, y las amenazas son las asignadas por el estado de combate de esa sala. Se recorrió físicamente la planta superior de la mansión por separado.

| # y sala | Identidad visual y narrativa; luz y composición observadas | Interactivos y rutas cargadas | Amenaza y tensión | Legibilidad y problema visto en la captura de entrada |
| --- | --- | --- | --- | --- |
| [00 Mansión Veyr](capturas/fase19/sala-00.jpg) | Vestíbulo de madera y piedra con escalera; sombras frías y luz cálida lateral. | Guardar, documento, llave, tónico, caja y ritual; biblioteca, Roma y recuerdo medieval; arriba, folio, carta y guardado. | Sombra asignada. La escalera permite anticipar un peligro que aún no se ve. | La ruta vertical existe y se recorrió; desde entrada los portales laterales y el rellano no se leen de un vistazo. |
| [01 Biblioteca prohibida](capturas/fase19/sala-01.jpg) | Estantes de color y mesa de lectura en luz tenue azul y ámbar. | Guardar, documento, tónico, manuscritos, sello; vestíbulo, cripta, archivo y capilla. | Sombra asignada; los estantes permiten ocultación. | El marco próximo ocupa el lado izquierdo; la puerta de regreso se indica por texto, las otras quedan fuera de esta toma. |
| [02 Cripta de los nombres](capturas/fase19/sala-02.jpg) | Volúmenes pétreos y altar bajo luz cálida aislada. | Guardar, documento, tónico, sello; biblioteca y capilla. | Sombra asignada; centro abierto para aviso de ataque. | El altar se distingue, pero la salida siguiente no queda encuadrada al entrar. |
| [03 Capilla del silencio](capturas/fase19/sala-03.jpg) | Mesa y muros oscuros con un punto de luz al fondo; la capilla se percibe poco desde este ángulo. | Guardar, documento, tónico, sello, bóveda; cripta, ruinas, invernadero, sótanos y biblioteca. | Ritual asignado; varias rutas crean incertidumbre. | Cinco conexiones dependen de acercarse al umbral y leer el aviso; desde entrada no hay jerarquía visual clara entre ellas. |
| [04 Ruinas del intervalo](capturas/fase19/sala-04.jpg) | Espacio oscuro con restos de piedra y un núcleo más iluminado. | Guardar, documento, cierre del intervalo; regreso a capilla. | Sombra asignada; el centro ofrece una revelación gradual. | El objetivo central se intuye; regreso fuera del campo inicial. |
| [05 Archivo familiar](capturas/fase19/sala-05.jpg) | Archivadores y madera, iluminación de estudio ámbar. | Guardar, documento, tónico, árbol genealógico y libro de socios; biblioteca e invernadero. | Acechador asignado; estantes sostienen persecución y búsqueda. | Mesas legibles; el marco de retorno ocupa el primer plano. |
| [06 Invernadero de vidrio negro](capturas/fase19/sala-06.jpg) | Plantas geométricas verdes y vidrio oscuro; luz verdosa diferenciada. | Guardar, documento, tónico, cuaderno; archivo y capilla. | Acechador asignado; vegetación permite siluetas ambiguas. | Plantas claras, conexión con capilla no visible al entrar. |
| [07 Sótanos de la vigilia](capturas/fase19/sala-07.jpg) | Columnas y piedra baja con fondo negro y luz cálida de altar. | Guardar, documento, tónico, mordazas, placa y umbral; regreso a capilla. | Guardián asignado; el centro despejado favorece el combate. | Objetivos distribuidos; la dirección del umbral no se revela en esta vista. |
| [08 Santuario de los nombres](capturas/fase19/sala-08.jpg) | Arquitectura romana con columnas y suelo cálido; foco sobre mesa. | Guardar, documento, tres testimonios, inscripción y tablilla; regreso a 1927. | Centurión asignado; columnas crean anticipación. | El retorno muestra aviso desde entrada, pero la columna próxima tapa parte de la profundidad. |
| [09 Claustro de la ceniza](capturas/fase19/sala-09.jpg) | Claustro de columnas grises y mesa; contraste cálido en el altar. | Guardar, documento; scriptorium y regreso a 1927. | Copista de peste asignado; arcadas abren líneas de visión. | El gran marco izquierdo invade el encuadre; scriptorium fuera de pantalla. |
| [10 Scriptorium del silencio](capturas/fase19/sala-10.jpg) | Mesas, códice y estantes de madera; luz cálida sobre el trabajo. | Guardar, documento, códice sellado y recuperación; vuelta al claustro. | Copista de peste asignado; el papel puede anunciar movimiento mínimo. | Códice y mesa identificables; entrada próxima tapa parte del lateral. |
| [11 Taller de los rostros](capturas/fase19/sala-11.jpg) | Taller romano ámbar, columnas y pigmento en mesa. | Guardar, documento, pigmento; horno y regreso a 1927. | Mosaico asignado; piezas del taller pueden sugerir una copia falsa. | Mesa visible, horno fuera del encuadre inicial. |
| [12 Horno de las teselas](capturas/fase19/sala-12.jpg) | Piedra cálida y mesas de teselas; composición parecida al taller. | Guardar, documento, recomposición y molde; vuelta al taller. | Mosaico asignado; la revelación depende del puzle. | Retorno señalado; poca diferenciación de silueta respecto al taller desde entrada. |
| [13 Muelle de los nombres](capturas/fase19/sala-13.jpg) | Tablones y barandillas con luz fría cian de costa. | Guardar, documento, tabla de mareas; depósito y regreso a 1927. | Ahogado asignado; los huecos entre barandillas sugieren presencia. | La mesa destaca; depósito no se ve desde el plano inicial. |
| [14 Archivo de la marea](capturas/fase19/sala-14.jpg) | Estanterías claras en una habitación fría verdiazul. | Guardar, documento, cruce de fechas y lista de pasajeros; regreso al muelle. | Ahogado asignado; los estantes estrechan la visión. | Registro legible, marco próximo a la cámara. |
| [15 Terraza del astro ausente](capturas/fase19/sala-15.jpg) | Columnas abiertas y mesa astronómica bajo luz azul. | Guardar, documento, carta astral; cúpula y regreso a 1927. | Vigilante ciego asignado; el silencio puede guiar la aproximación. | La mesa sirve de ancla; entrada a cúpula fuera de esta toma. |
| [16 Cúpula de las tres horas](capturas/fase19/sala-16.jpg) | Instrumentos de piedra y luz azul gris. | Guardar, documento, astrolabio y disco; vuelta a terraza. | Vigilante ciego asignado; el mecanismo puede anunciarse por sonido. | Instrumento central visible; composición muy similar a la terraza desde entrada. |
| [17 Cantera de los nombres](capturas/fase19/sala-17.jpg) | Bloques de piedra bajo luz amarilla gris, espacio despejado. | Guardar, documento, cuña; cámara del arco y regreso a 1927. | Cantero asignado; bloques crean ocultación. | Objetos cercanos legibles, arco posterior fuera del campo inicial. |
| [18 Cámara del arco](capturas/fase19/sala-18.jpg) | Piedra monumental más oscura y columnas al fondo. | Guardar, documento, ensamblaje y plano; vuelta a cantera. | Cantero asignado; el arco es el foco narrativo. | El retorno es claro por aviso; arco no domina todavía la toma. |
| [19 Hospital del camino](capturas/fase19/sala-19.jpg) | Camas y biombo, paleta verde apagada. | Guardar, documento, hierbas; enfermería y regreso a 1927. | Custodio asignado; camas permiten apariciones de fondo. | La cama se reconoce; puerta de enfermería fuera del primer cuadro. |
| [20 Enfermería de los nombres](capturas/fase19/sala-20.jpg) | Camas alineadas, luz verde gris más limpia. | Guardar, documento, remedios, cuaderno y testimonio; vuelta al hospital. | Custodio asignado; ausencia en camas puede generar duda. | Mesas de trabajo visibles; alta similitud de entrada con el hospital. |
| [21 Imprenta de frontera](capturas/fase19/sala-21.jpg) | Máquina y madera marrón con luz cálida puntual. | Guardar, documento, prueba de impresión; planchas y regreso a 1927. | Tipógrafo asignado; golpes de máquina ofrecen ritmo sonoro. | Prensa reconocible, puerta siguiente no visible. |
| [22 Sala de las planchas](capturas/fase19/sala-22.jpg) | Bloques y matriz sobre madera oscura. | Guardar, documento, dos pruebas, ordenación y plancha; vuelta a imprenta. | Tipógrafo asignado; la falsa tirada es foco del suspense. | Objetos pequeños pierden presencia desde la entrada. |
| [23 Casa Veyr de 1610](capturas/fase19/sala-23.jpg) | Madera oscura y retrato al fondo, luz muy contenida. | Guardar, documento, inventario; galería y regreso a 1927. | Retrato asignado; el rostro aislado invita a vigilarlo. | El retrato se ve, pero la galería queda fuera del plano inicial. |
| [24 Galería de retratos](capturas/fase19/sala-24.jpg) | Retrato y caja en una habitación sombría. | Guardar, documento, fecha, huella, confrontación y acta; vuelta a casa. | Retrato asignado; cambio de mirada como oportunidad. | El cuadro es legible; entrada casi igual a la de la casa de 1610. |
| [25 Teatro de autómatas](capturas/fase19/sala-25.jpg) | Mecanismo y madera roja con sombras de escenario. | Guardar, documento, partitura; tramoya y regreso a 1927. | Autómata asignado; contrapesos preparan el sonido. | Elementos mecánicos visibles; salida a tramoya no encuadrada. |
| [26 Tramoya de las voces](capturas/fase19/sala-26.jpg) | Poleas y cajas bajo luz rojiza. | Guardar, documento, polea, contrapeso, alineación y partitura; vuelta al teatro. | Autómata asignado; la voz puede proceder de tras bastidores. | Poleas reconocibles, pero la entrada se parece mucho al teatro. |
| [27 Archivo fotográfico](capturas/fase19/sala-27.jpg) | Equipo fotográfico y mesas frías azuladas. | Guardar, documento, negativo; cuarto de revelado y regreso a 1927. | Sombra reveladora asignada; imágenes sugieren presencia diferida. | Máquina destacada; el cuarto interior no se ve al entrar. |
| [28 Cuarto de revelado](capturas/fase19/sala-28.jpg) | Bandejas y aparato en iluminación baja fría. | Guardar, documento, bisagras, fijador, negativos y placa; vuelta al archivo. | Sombra reveladora asignada; el cambio de imagen sostiene la tensión. | Objetos bajos compiten con el personaje; falta un plano de detalle para juzgar el puzle. |

Hallazgo transversal **P19-01**: muchas salas comparten el mismo encuadre de entrada con un poste o marco muy próximo a la izquierda y el aviso de regreso en primer término. Las capturas muestran una identidad material distinta por época, pero menos variedad de composición de la deseable. Falta revisar todas las puertas desde varios ángulos y durante movimiento para valorar la orientación completa.

## Cambios realizados y tres encuentros

1. **El pasillo que observa.** El Huésped conserva exactamente su giro de cabeza mientras está en cámara. Tras 0,8 segundos fuera de vista, la pose avanza un paso de 0,18 radianes, con límite; su desplazamiento y congelación existentes siguen dependiendo de la visibilidad real y de paredes. La cámara de la galería se alejó para mostrar más pasillo sin atravesar colisiones. La pose es efímera y se reconstruye al cargar; la derrota persiste con el identificador de guardado existente. [Plano final](capturas/fase19/huesped-final.jpg).
2. **El lamento del rellano.** Al subir la escalera suena **una sola vez** un lamento procedural, antes de que la Viuda sustituya a la amenaza de planta baja. Se atenúa el ambiente durante 2,8 segundos; el lamento se panoramiza hacia el rellano y pierde volumen con la distancia. No se dispara si la Viuda ya fue derrotada. Si el encuentro empieza en otra posición, el lamento sigue sonando al iniciar persecución. El velo y las puertas ya existentes continúan reaccionando sin añadir colisionadores. [Vista del rellano](capturas/fase19/viuda.jpg). No hubo escucha humana ni medida de HRTF; la prueba acredita disparo, prioridad y parámetros, no percepción subjetiva del sonido.
3. **El reflejo imposible.** La cadencia de reaparición depende de la cordura (3,2 segundos bajo 30; 5,2 si es mayor). Reaparece 2,5 m detrás y 1,1 m a un lado cuando hay suelo válido y espacio libre; dispone de al menos 1,6 segundos de enfriamiento antes de atacar. Su posición inicial se separó lateralmente de Élise y la cámara de combate abrió a 72° con lente dentro de la sala. [Antes](capturas/fase19/reflejo.jpg) y [después](capturas/fase19/reflejo-final.jpg): ambos cuerpos son distinguibles en la captura temprana, aunque **P19-02 quedó abierto al cerrar la fase 19** porque en contacto cercano aún podían solaparse. La alucinación no altera puertas, colisiones ni progreso. La cordura baja sola no causa daño.

El audio de estos encuentros usa osciladores y ruido generados por el juego; no se añadieron archivos de terceros. Se conservaron los límites de voces, el silencio temporal y el intervalo ambiental. Los cambios no añaden mallas, materiales ni luces; la cámara y la IA ejecutan cálculos escalares pequeños.

## Evidencia funcional y rendimiento

La [traza de recorrido y guardado](capturas/fase19/recorrido-guardado.json) registra entradas de teclado reales en Chromium: subir desde planta 0, entrar en retratos y observatorio, volver al rellano, guardar, recargar con la misma posición y bajar a planta 0. Se desactivaron los enemigos en ese recorrido para aislar la navegación. Las pruebas unitarias ejercen la congelación del Huésped, el único lamento previo, la separación del Reflejo, su ventana de reacción, la colisión de cámara y la lógica de guardado ya existente. La asignación de un solo enemigo activo por zona y las puertas superiores sin colisión añadida reducen el riesgo de bloqueo, pero no se completó una partida de principio a fin tras este cambio.

Medición final en Chromium Intel HD 620, ventana exterior **1280 × 720**, canvas **1024 × 576**, calidad Baja: 100 callbacks de calentamiento, después 600 intervalos consecutivos de `requestAnimationFrame`. «Peor 60» es el mínimo de las 541 ventanas móviles de 60 fotogramas. [Datos brutos finales](capturas/fase19/rendimiento-intel-final.json); la planta superior se repitió tras el último ajuste de pose del Huésped. Una [primera tanda](capturas/fase19/rendimiento-intel.json) se hizo antes del último ajuste del lamento y se conserva como referencia, sin usarla para aceptar el código final.

| Escenario | FPS medio | Peor 60 FPS | P95 ms | Estado final |
| --- | ---: | ---: | ---: | --- |
| Exploración sin enemigo activo | 60,02 | 60,01 | 16,7 | Salud 100, partida activa |
| Planta superior, Huésped activo | 60,03 | 60,02 | 16,7 | Salud 100, partida activa |
| Cordura baja, amenaza derrotada | 59,62 | 58,08 | 16,7 | Salud 100, partida activa |
| Escalera, amenaza derrotada | 60,02 | 60,01 | 16,7 | Salud 100, partida activa |

Las cuatro muestras finales superan 45 FPS en todas sus ventanas de 60. Son posiciones mayormente estáticas de unos 10 segundos; no prueban todos los encuentros activos, movimiento continuo ni una sesión larga. En la primera tanda, un intento de combate terminó con Élise muerta; se conserva para transparencia, sin considerarlo una prueba válida de rendimiento. El lanzamiento directo de `/usr/bin/google-chrome` con Playwright falló aquí por `crashpad` (`setsockopt EPERM`); la ventana Intel se abrió mediante DevTools. El navegador de la batería automatizada usa su propia configuración y no sustituye esta medición de hardware.

## QA y pendientes

- `npm test -- --maxWorkers=2 --testTimeout=15000`: **179/179**, 37 archivos.
- `npm run build`: TypeScript y Vite correctos.
- `npm run format:check`: correcto.
- `npm run test:browser`: **incompleto**. `browser-smoke.mjs` pasó sus diez comprobaciones sin errores JS. `browser-systems.mjs` falló una vez por esperar solo un contador de fotogramas que también avanzaba en el menú; el script se corrigió para esperar la sala y la partida activa y, ejecutado de nuevo, pasó todas sus comprobaciones. `browser-phase10.mjs` no llegó a abrir Chrome en dos intentos por `crashpad` (`setsockopt EPERM`). No se atribuye ese fallo al juego; la recuperación de contexto WebGL que cubre ese script queda sin verificar en esta fase.
- `git diff --check`: correcto.

**Pendientes al cerrar la primera revisión:** P19-01, variedad de encuadres y lectura de puertas en las 29 salas; P19-02, solapamiento cercano del Reflejo; P19-03, escucha humana del lamento; P19-04, medición Intel de combate activo y sesión larga. No se realizó prueba con mando físico ni lector de pantalla.

**Puntuación orientativa: 8,1/10.** La nota refleja tres secuencias mejor dirigidas, 29 encuadres de entrada inspeccionados, regresión de ruta y guardado, pruebas automatizadas y cuatro ventanas Intel por encima del umbral. Se limita por la cobertura visual de un solo punto por sala, el encuadre cercano aún estrecho y la ausencia de escucha humana y combate Intel válido.

## Fase 19.1 — Cierre técnico de incidencias

Se conservaron todos los cambios locales anteriores y no se modificó `main`. Esta sección documenta las comprobaciones previas al respaldo de la rama; no acredita una publicación de la fase ni validación humana. [Traza funcional resumida](capturas/fase19/cierre-fase19_1.json).

### P19-02: separación del Reflejo — resuelta en los espacios comprobados

La IA mantiene ahora **1,35 m de distancia horizontal** entre el Reflejo visible y Élise cuando están en la misma planta. Corrige la posición antes de resolver ataques y después de mover al enemigo. Busca una posición libre alrededor de Élise y comprueba obstáculos, línea libre y suelo transitable de la planta superior. Esa distancia permanece dentro del alcance normal de los ataques: conserva el aviso y la defensa. No se cambiaron los umbrales, eventos ni pérdidas de cordura.

La regresión cubre contacto directo, persecución, aviso de ataque y posiciones transitables del observatorio próximas a paredes y mobiliario. En Chromium Intel, un guardado con ambos personajes en el mismo punto dio **1,35 m** tras cargar, `cameraCorrected=false`, salud 100 y [captura con ambas siluetas separadas](capturas/fase19/reflejo-separado-fase19_1.jpg). Durante la medición de combate, la distancia final volvió a ser 1,35 m. En un espacio sin punto libre a ese radio la corrección no fuerza al enemigo a atravesar una pared; ese caso excepcional no quedó observado en los puntos transitables ensayados.

### Lanzamiento de Chromium y prueba de recuperación WebGL

`browser-phase10.mjs` sigue fallando **antes de abrir una página**: Chrome emite `crashpad: setsockopt: Operation not permitted (1)` y termina con `SIGTRAP`. Una prueba mínima que solo abría `about:blank` con el mismo ejecutable y los mismos argumentos falló igual. `browser-smoke.mjs` y `browser-systems.mjs`, que usan ese Chrome, sí consiguieron lanzarse y pasaron al ejecutarse por separado. La evidencia sitúa el fallo en el **lanzamiento de Chrome bajo las restricciones de este entorno**, aparentemente intermitente, y no en la lógica WebGL del juego ni en las acciones de `browser-phase10.mjs`. No se cambió el aislamiento ni se añadieron opciones para sortearlo; la causa precisa del `EPERM` dentro del sistema sigue sin aislar.

En el Chromium ya conectado por DevTools se ejecutó la secuencia funcional del script: `WEBGL_lose_context` disponible, pérdida de contexto con partida pausada y aviso «Gráficos interrumpidos», restauración con botón «Volver» y avance de tiempo tras reanudar. Esta comprobación **no equivale a un pase del script Playwright**, ni repitió su cambio a viewport de 960 × 640. La ejecución de `browser-phase10.mjs` queda pendiente en un entorno donde Chrome pueda arrancar de forma fiable.

### Lamento de la Viuda — validación técnica

`Audio.lament()` informa ahora si pudo programar sus dos osciladores. Al cargar una partida en la escalera, el director espera a que `AudioContext` esté activo antes de marcar el lamento como reproducido; si los sonidos intensos están reducidos, respeta esa preferencia. El lamento se reproduce una vez y las voces se desconectan al terminar. La prueba nueva verifica el control de volumen maestro, panorámica a ambos lados, pico de la voz principal de **0,042** a distancia cero y **0,0145** a cinco metros, además de la liberación de voces y la supresión por ajuste de audio.

En Chromium Intel, una carga en la escalera con volumen **0,35** dejó el contexto activo, **una voz de lamento** activa a los 280 ms y cero voces a los 2100 ms; no hubo errores de consola. La panorámica usa `StereoPannerNode` y la atenuación es escalar `nivel / (1 + 0,38 × distancia)`: no se comprobó HRTF, reverberación de escalera ni oclusión acústica. **No hubo escucha humana**, por lo que no se valida la calidad subjetiva de la mezcla.

### Rendimiento Intel HD Graphics 620 de los encuentros activos

Ventana directa 1280 × 720, canvas 1024 × 576, calidad Baja, guardia mantenida, 100 fotogramas de calentamiento y 600 intervalos consecutivos por muestra. FPS medio = `600000 / suma de intervalos`; «peor 60» = mínimo de 541 ventanas de 60. [Intervalos y estados brutos](capturas/fase19/rendimiento-encuentros-fase19_1.json).

| Encuentro | FPS medio | Peor 60 FPS | P95 ms | Salud antes/después | Estado |
| --- | ---: | ---: | ---: | ---: | --- |
| Reflejo activo, código final | 60,02 | **60,02** | 16,7 | 97 / 82 | Partida activa, separación 1,35 m |
| Viuda activa | 59,23 | **57,16** | 16,7 | 49 / 24 | Partida activa |

Ambas muestras superan 45 FPS en todas las ventanas medidas. Son muestras cortas y mayormente estáticas; no prueban una sesión larga, movimiento continuo, otras calidades ni otros equipos.

### QA final y decisión

- `npm test -- --maxWorkers=2 --testTimeout=15000`: **183/183**, 38 archivos. Incluye separación, lamento y carga con audio aún inactivo.
- `npm run build`, `npm run format:check` y `git diff --check`: correctos.
- `browser-smoke.mjs`: diez comprobaciones pasadas, sin errores JavaScript. `browser-systems.mjs`: puerta, cordura, bloqueo por sellos, muerte/reintento, desenlace y ajustes reducidos pasados, sin errores JavaScript.
- `browser-phase10.mjs`: bloqueado al iniciar Chrome; secuencia WebGL comprobada manualmente por DevTools con el límite explicado arriba.

**Resueltas:** P19-02 en las áreas probadas; reproducción técnica y compatibilidad de carga del lamento; P19-04 para los dos encuentros activos medidos. **Pendientes:** P19-01 (lectura de puertas y composición en más puntos de las 29 salas), P19-03 (escucha humana), ejecución completa de `browser-phase10.mjs` y una sesión larga de rendimiento/jugabilidad.

**Recomendación: todavía no publicar como fase 19 cerrada.** La corrección del Reflejo, la QA funcional disponible y el umbral Intel están acreditados, pero una aventura de terror cuyo lamento no ha sido escuchado humanamente y cuya auditoría visual cubre un solo encuadre por sala aún tiene riesgos de dirección y mezcla. Una escucha y un recorrido visual guiado por las rutas principales, más el script de contexto WebGL en un entorno de lanzamiento estable, permitirían revisar esta decisión. Puntuación técnica orientativa actual: **8,5/10**, sin atribuir certificación artística o auditiva.

## Estado para respaldo técnico

| Estado | Alcance y evidencia | Límite |
| --- | --- | --- |
| **Implementado y verificado** | Pose del Huésped según observación; separación del Reflejo en los espacios ensayados; rutas entre plantas y guardado/carga; 183 pruebas unitarias y de integración; compilación, formato y `git diff --check`; `browser-smoke` y `browser-systems`. | Las pruebas de navegación aislaron los enemigos y no sustituyen una partida completa. |
| **Implementado con validación parcial** | Cámara de galería y combate, lamento espacial procedural, cinco amenazas de la mansión, 29 encuadres de entrada y rendimiento de encuentros activos en Intel HD 620. La recuperación WebGL se ejecutó por DevTools. | Falta inspección desde más ángulos, sesión larga y ejecución completa de `browser-phase10.mjs`; su lanzamiento de Chrome falló con `crashpad: setsockopt EPERM`. El cambio de viewport de ese script tampoco se repitió manualmente. |
| **Pendiente de validación humana** | Escuchar el lamento y la mezcla, juzgar suspense y legibilidad durante juego continuo, completar los cinco encuentros y el combate contra la Raíz sin ayudas de depuración. | No se ha realizado escucha humana ni recorrido manual integral. No se declara cerrada esta validación. |

El procedimiento de 30–45 minutos para Linux Mint, con registro de incidencias y criterios observables, está en la [guía de prueba manual](FASE19_GUIA_PRUEBA_MANUAL.md). El respaldo de código y evidencias en la rama no cambia la recomendación de publicación anterior.
