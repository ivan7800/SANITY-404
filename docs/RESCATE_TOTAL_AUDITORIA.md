# Operación Rescate Total — auditoría técnica en curso

**Fecha:** 26 de octubre de 2026. **Rama:** `fase11/campana-historica`. **Veredicto:** **NO APTO PARA PUBLICACIÓN**.

La investigación posterior del bloqueo en `save0`, los FPS de Linux Mint, la corrección de deltaTime y los nuevos modos de Chrome están en [Rescate: movimiento y rendimiento WebGL](RESCATE_RENDIMIENTO_MOVIMIENTO.md). Las cifras de navegador anteriores de este documento describen ejecuciones previas a esa corrección.

## Alcance y protección

Se revisó el estado de Git antes de editar. Los cambios previos de campaña e interfaz se conservaron. El estado de trabajo al reanudar quedó archivado en `/tmp/sanity404-rescate-reanudacion-20261026.tar.gz`; es una copia local temporal, no una publicación ni un commit. No se cambió `main`, no se hizo merge, push ni despliegue.

| Fase de la orden maestra | Estado verificable |
| --- | --- |
| A · Diagnóstico | Causas de movimiento e interacción identificadas; análisis visual integral pendiente. |
| B · Motor físico | Barrido subdividido y objetos tangibles implementados; estados físicos de puertas pendientes. |
| C · Navegación | Planificador y juego comparten geometría; recorrido largo en navegador pendiente. |
| D · Escenarios | 29 salas auditadas por construcción y alcance estático; inspección visual y juego real pendientes. |
| E · Gameplay | Ataques y movimiento de IA revisados en código; combates de toda la campaña sin nueva regresión. |
| F · Campaña | Siete capítulos acreditados por trazas anteriores; los cinco restantes y final sin certificar. |
| G · Calidad | UI con evidencia previa; GPU objetivo, cámara y accesibilidad global sin medición nueva. |
| H · Certificación | 213 tests y compilación aprobados; navegador y campaña completa no aprobados en este rescate. |

## Causas estructurales y correcciones

| Hallazgo | Cambio comprobable | Límite de la evidencia |
| --- | --- | --- |
| El motor comprobaba únicamente el destino de cada movimiento; un paso largo podía atravesar una pared estrecha. | `collision.ts` subdivide movimientos en pasos máximos de 0,08 m, prueba ambos ejes y conserva el deslizamiento. Jugador, enemigos y navegación importan la misma regla `blocked`. | La prueba unitaria cubre paso rápido, diagonal y sólidos de las 29 salas; faltan pruebas físicas jugadas con todos los controles. |
| Muchos objetos interactivos visibles, incluidas hojas de puerta y escritorios, no tenían volumen sólido. | `World.add` deriva un AABB de la geometría visible y lo inserta en la planta correcta; `World.remove` lo retira. | Un AABB puede ser más amplio que un objeto irregular; hace falta una revisión visual de ajustes finos. |
| Un guardado antiguo o una transición podían colocar al personaje dentro de un objeto ahora sólido. | `loadRoom` busca una posición libre próxima con `safeSpawn`; falla explícitamente si no existe. No cambia el esquema de guardado. | La conectividad de **todas** las entradas aún no se ha recorrido en navegador. |
| La selección por distancia permitía interactuar con objetos a través de geometría alta. | `World.nearest` y el planificador QA usan la misma línea de interacción a la altura de la planta. | Faltan pruebas de regresión jugadas para cada puerta y objeto. |
| El nuevo escritorio superior cerraba el corredor; un pilar impedía usar el escritorio de las ruinas; el eco de Lucius se solapaba con un tónico. | Se recolocaron esos tres elementos visibles. La auditoría geométrica volvió a encontrar posiciones seleccionables. | La composición visual final necesita inspección manual. |
| Los scripts de navegador caminaban al centro de hojas de puerta y escritorios que ahora son sólidos. | Se retiraron esos trayectos redundantes de la campaña y el recorrido corto usa A* antes de caminar con teclas reales. | El recorrido corto modificado y la campaña completa necesitan una nueva ejecución satisfactoria. |

Los ataques de combate ya llaman a `strikeClear` antes de causar daño; la IA común mueve enemigos con `move`. `wrongReflection` tiene una reaparición sobrenatural explícita que comprueba el punto de destino, pero no recorre físicamente el trayecto. No se modificaron daños, salud, recursos, dificultad, inventario ni progreso para pasar pruebas.

## Auditoría geométrica por sala

`npm run audit:rooms` construye cada escena dos veces: estado inicial y una **configuración hipotética de contenido desbloqueado** que sirve solo para revisar geometría. Busca desde un punto libre sobre una cuadrícula de 0,2 m y exige una posición desde la que `World.nearest` seleccione cada objeto. El [JSON por sala](RESCATE_SALAS_DATOS.json) conserva posiciones, cantidades, objetos y resultados. La configuración hipotética **no es una partida ni evidencia de campaña**.

| Sala | Lugar | Colisionadores suelo/superior al inicio | Objetos suelo/superior al inicio | Objetos con contenido desbloqueado | Resultado geométrico |
| --- | --- | ---: | ---: | ---: | --- |
| 00 | Mansión Veyr | 23/14 | 10/4 | 22/4 | Accesos detectados |
| 01 | Biblioteca prohibida | 21/0 | 9/0 | 12/0 | Accesos detectados |
| 02 | Cripta de los nombres | 18/0 | 6/0 | 6/0 | Accesos detectados |
| 03 | Capilla del silencio | 31/0 | 10/0 | 13/0 | Accesos detectados |
| 04 | Ruinas del intervalo | 20/0 | 4/0 | 4/0 | Accesos detectados |
| 05 | Archivo familiar | 23/0 | 7/0 | 12/0 | Accesos detectados |
| 06 | Invernadero de vidrio negro | 20/0 | 6/0 | 6/0 | Accesos detectados |
| 07 | Sótanos de la vigilia | 27/0 | 7/0 | 8/0 | Accesos detectados |
| 08 | Santuario de los nombres | 35/0 | 8/0 | 8/0 | Accesos detectados |
| 09 | Claustro de la ceniza | 25/0 | 4/0 | 4/0 | Accesos detectados |
| 10 | Scriptorium del silencio | 32/0 | 5/0 | 5/0 | Accesos detectados |
| 11 | Taller de los rostros | 23/0 | 5/0 | 5/0 | Accesos detectados |
| 12 | Horno de las teselas | 24/0 | 5/0 | 4/0 | Accesos detectados |
| 13 | Muelle de los nombres | 23/0 | 5/0 | 5/0 | Accesos detectados |
| 14 | Archivo de la marea | 28/0 | 5/0 | 4/0 | Accesos detectados |
| 15 | Terraza del astro ausente | 23/0 | 5/0 | 5/0 | Accesos detectados |
| 16 | Cúpula de las tres horas | 22/0 | 5/0 | 4/0 | Accesos detectados |
| 17 | Cantera de los nombres | 27/0 | 5/0 | 5/0 | Accesos detectados |
| 18 | Cámara del arco | 23/0 | 5/0 | 4/0 | Accesos detectados |
| 19 | Hospital del camino | 20/0 | 5/0 | 5/0 | Accesos detectados |
| 20 | Enfermería de los nombres | 21/0 | 6/0 | 5/0 | Accesos detectados |
| 21 | Imprenta de frontera | 21/0 | 5/0 | 5/0 | Accesos detectados |
| 22 | Sala de las planchas | 23/0 | 7/0 | 6/0 | Accesos detectados |
| 23 | Casa Veyr de 1610 | 14/0 | 5/0 | 5/0 | Accesos detectados |
| 24 | Galería de retratos | 16/0 | 7/0 | 6/0 | Accesos detectados |
| 25 | Teatro de autómatas | 22/0 | 5/0 | 5/0 | Accesos detectados |
| 26 | Tramoya de las voces | 24/0 | 7/0 | 6/0 | Accesos detectados |
| 27 | Archivo fotográfico | 23/0 | 5/0 | 5/0 | Accesos detectados |
| 28 | Cuarto de revelado | 25/0 | 7/0 | 6/0 | Accesos detectados |

**Lectura correcta:** la escena se construye, tiene colisionadores y luces, y la búsqueda geométrica encontró un punto para seleccionar cada objeto. Esta tabla no valida por sí sola suelos, techos, iluminación, cámara, enemigos, transiciones ni calidad artística mediante juego real. El modo `?qa=1` solo existe en desarrollo y permite abrir salas, colocar un actor en un punto libre, inspeccionar objetos y colisionadores y dibujar una ruta; las partidas de ese modo no se guardan. No se usa para certificar la campaña.

## Campaña, interfaz y rendimiento

La [última traza real de Linux Mint](capturas/fase22/campana-completa-bloqueo-sala5-linux-mint.json) acredita Lucius, Aurelia, Maeve, Samira, Idris, Oona e Isabelle en secuencia, con sus guardados y recargas. Se detuvo después de Isabelle camino del invernadero. **Tomás, Inés, Amara, Émile, el desenlace histórico de Élise y la campaña completa aún no están certificados.** Los siete capítulos acreditados corresponden al código anterior a las nuevas colisiones y requieren una regresión completa.

La UI móvil tiene una [traza previa satisfactoria de Linux Mint](capturas/remaster/ui-qa-certificado-linux-mint.json), pero no se ha evaluado de nuevo tras este rescate. En un intento de navegador de este entorno, Chrome alcanzó Nueva partida y guardado con cero errores JavaScript antes de que se modificara el script de recorrido; marcó ~3,1 FPS y 148 geometrías/21 texturas en la mansión bajo **SwiftShader**, que no representa la Intel HD Graphics 620. Otros lanzamientos terminaron antes de cargar la página con `crashpad setsockopt EPERM` y `SIGTRAP`. No se atribuye ese fallo al juego. No hay medición fiable actual en la GPU objetivo ni revisión visual completa de las 29 salas.

## Pruebas y bloqueos pendientes

**Resultados actuales:** `npm test` pasó **213/213** en 43 archivos; `npm run build`, `npm run format:check` y `npm run audit:rooms` terminaron con código 0. El usuario confirmó que `test:rescue:browser` pasó en Linux Mint con 29 salas, 6 choques y cero errores JavaScript **antes de la nueva reproducción dirigida del vestíbulo**. `test:browser` falló allí: el segmento hacia `x=-3,5` a `z=4,46` intentaba cruzar el colisionador de `save0`; el motor actuó correctamente. Otra ejecución de sandbox descubrió un margen de 5 mm demasiado grande en el validador de navegador, ya corregido y cubierto por regresión. La nueva navegación, el modo GPU física y el ajuste de deltaTime aún necesitan una ejecución real de principio a fin. En este sandbox, Vite recibió `listen EPERM` y Chrome terminó en intentos posteriores antes de cargar la página por `crashpad setsockopt EPERM`/`SIGTRAP`; el [JSON del intento QA](capturas/rescate/navegador.json) conserva ese fallo anterior a la carga. No se reclama aprobación de la batería actual de navegador.

**Pendientes críticos:** campaña completa desde Nueva partida con las nuevas colisiones; estados y paso físico de todas las puertas abiertas; verificación jugada de las 29 salas y de enemigos contra obstáculos; rutas de todas las entradas y salidas; prueba de guardado/recarga real tras varios capítulos; final histórico; métricas en GPU compatible. **Pendientes importantes:** colisionadores más precisos para elementos irregulares, evaluación de cámara, iluminación, accesibilidad y aspecto final. Por ello no corresponde asignar la nota objetivo de 9,5/10.

## Reproducción

Con Vite activo en el puerto 5173: `npm run test:browser && npm run test:rescue:browser`. Para la campaña auténtica desde Nueva partida, con Vite en el puerto 5174: `node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final`. La prueba QA de salas no reemplaza ese último comando.
