# Fase 31 · auditoría de experiencia

Fecha: 28-10-2026. Alcance de esta tanda: lectura del código y de las auditorías F29–F30, más regresiones deterministas. **No es una sesión manual ni una evaluación audiovisual de las 29 salas.** La campaña 12/12 y la Viuda PASS son resultados reales comunicados por el usuario, anteriores a los cambios F31; requieren repetición tras esta tanda.

## Hallazgos comprobables

| ID | Sistema | Evidencia de código | Consecuencia | Estado |
|---|---|---|---|---|
| EXP-01 | Pasos | `main.ts` emitía un paso cuando había entrada (`len > 0.1`), aunque `move` devolviera la posición inicial por una colisión. | Sonido de caminar contra un mueble o pared sin desplazamiento. | Corregido y probado con colisión y deslizamiento. |
| EXP-02 | Identidad acústica | `Audio.step` distinguía solo escalera, invernadero y sótano; la mayoría de las salas compartían el mismo timbre. | Las épocas y materiales perdían carácter al explorar. | Cinco superficies asignadas a 29 salas; escalera conserva su timbre. Escucha real pendiente. |
| EXP-03 | Escalera | `main.ts` trataba cualquier altura positiva de la mansión como escalera, incluida la galería a 2,64 m. | Los pasos de la planta superior sonaban como peldaños. | La detección usa la altura real del tramo; regresión geométrica añadida. Escucha pendiente. |
| EXP-04 | Interacción | El aviso contextual mostraba tecla y nombre (`E / A · nombre`); no expresaba si leería, recogería o guardaría. Varios nombres ya incluyen verbo. | Posible ambigüedad o redundancia al acercarse a objetos juntos. | Añadido verbo solo cuando el nombre no lo contiene; prueba unitaria PASS. Preparada comprobación física de guardado en navegador; móvil pendiente. Una puerta dice «examinar» porque puede estar bloqueada. |
| EXP-05 | Ritmo | Las doce investigaciones siguen el patrón documento → amenaza → puzle → artefacto. | Posible repetición percibida, no demostrada por QA automatizado. | Pendiente de sesión humana completa. No se alteró la progresión. |
| EXP-06 | Rendimiento | La muestra corta anterior de la Viuda a 12,7 FPS en Medio no cubre toda la campaña; benchmark F30 preparado. | No hay comparación fiable antes/después de F31 en Intel. | Pendiente de benchmark real con Bajo y Medio. |

## Doce capítulos

La matriz siguiente identifica el foco de inspección jugable; **no marca capítulos como certificados tras F31**.

| Capítulo | Salas | Foco de experiencia pendiente |
|---|---|---|
| Lucius 189 | 8 | Lectura de inscripción mientras el centurión amenaza. |
| Aurelia 312 | 11–12 | Claridad de teselas y diferenciación acústica del taller. |
| Maeve 537 | 13–14 | Ritmo del muelle al archivo y atmósfera húmeda. |
| Samira 783 | 15–16 | Visibilidad de pistas astrales y sonido del observatorio. |
| Idris 1092 | 17–18 | Lectura de marcas de cantera durante persecución. |
| Oona 1217 | 19–20 | Comprensión del dilema y pausa tras el combate. |
| Isabelle 1348 | 9–10 | Legibilidad del códice y orientación entre claustro y scriptorium. |
| Tomás 1491 | 21–22 | Distinción de tiradas y maquinaria sin fatiga sonora. |
| Inés 1610 | 23–24 | Comprensión del árbol familiar y presencia del retrato. |
| Amara 1786 | 25–26 | Silencio del puzle teatral frente al ambiente. |
| Émile 1899 | 27–28 | Cámara, contraste y supervivencia en cuarto oscuro. |
| Élise 1927 | 0–7 | Orientación en mansión, escalera, Viuda, guardado y final. |

## Inventario de 29 salas

La sala y el material acústico proceden de `world/scene.ts` y `audio.ts`. La auditoría geométrica comprueba conexiones, no legibilidad, ritmo ni calidad visual.

| Sala | Escenario | Superficie de pasos | Validación experiencial |
|---:|---|---|---|
| 0 | Mansión Veyr | madera; escalera propia | Pendiente de escucha/cámara real |
| 1 | Biblioteca prohibida | madera | Pendiente |
| 2 | Cripta de los nombres | piedra | Pendiente |
| 3 | Capilla del silencio | piedra | Pendiente |
| 4 | Ruinas del intervalo | piedra | Pendiente |
| 5 | Archivo familiar | madera | Pendiente |
| 6 | Invernadero de vidrio negro | húmeda | Pendiente |
| 7 | Sótanos de la vigilia | piedra | Pendiente |
| 8 | Santuario de los nombres | piedra | Pendiente |
| 9 | Claustro de la ceniza | piedra | Pendiente |
| 10 | Scriptorium del silencio | piedra | Pendiente |
| 11 | Taller de los rostros | tesela | Pendiente |
| 12 | Horno de las teselas | tesela | Pendiente |
| 13 | Muelle de los nombres | madera | Pendiente |
| 14 | Archivo de la marea | húmeda | Pendiente |
| 15 | Terraza del astro ausente | piedra | Pendiente |
| 16 | Cúpula de las tres horas | metal | Pendiente |
| 17 | Cantera de los nombres | piedra | Pendiente |
| 18 | Cámara del arco | piedra | Pendiente |
| 19 | Hospital del camino | madera | Pendiente |
| 20 | Enfermería de los nombres | madera | Pendiente |
| 21 | Imprenta de frontera | madera | Pendiente |
| 22 | Sala de las planchas | metal | Pendiente |
| 23 | Casa Veyr de 1610 | madera | Pendiente |
| 24 | Galería de retratos | madera | Pendiente |
| 25 | Teatro de autómatas | madera | Pendiente |
| 26 | Tramoya de las voces | metal | Pendiente |
| 27 | Archivo fotográfico | madera | Pendiente |
| 28 | Cuarto de revelado | húmeda | Pendiente |

La asignación es una decisión de diseño basada en la función de cada estancia; la impresión acústica y su correspondencia con la geometría visible requieren escucha y capturas en juego. No se han identificado defectos visuales nuevos sin inspección real.

## Sistemas jugables revisados

| Sistema | Comprobación realizada | Límite |
|---|---|---|
| Movimiento y colisiones | Se comparó la entrada con la posición devuelta por `move`/`mansionMove`; nueva regresión de pared y deslizamiento. | Respuesta subjetiva y mando/táctil pendientes de jugar. |
| Interacciones y orientación | Se revisó `World.nearest`, la línea de visión de interacción y el aviso; se añadió verbo contextual sin alterar selección ni alcance. | Legibilidad móvil y objetos contiguos pendientes de navegador. |
| Documentos, inventario y guardado | Se conservaron rutas existentes; suite completa de regresión PASS. | No se releyeron manualmente todos los documentos ni se hicieron recargas F31. |
| Combate, esquiva e IA | Sin cambios de daño, alcance, resistencia o navegación; la Viuda PASS comunicada por el usuario es anterior a F31. | Repetición real de campaña/Viuda pendiente. |
| Cordura y terror | `PsychologicalDirector` y `TerrorDirector` ya limitan eventos contextuales, silencios y apariciones; no se añadieron manifestaciones arbitrarias. | Escucha y ritmo subjetivo pendientes. |
| Cámara y visuales | Sin cambios geométricos ni de cámara. | Inspección visual de 29 salas pendiente. |
