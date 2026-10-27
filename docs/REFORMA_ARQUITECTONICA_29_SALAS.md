# Reforma arquitectónica de las 29 salas · 27-10-2026

**Estado: reforma parcial implementada; inspección visual y jugable real pendiente.** Este documento separa la geometría comprobada de las observaciones que exigen Chromium en Linux Mint. Ninguna sala recibe certificación visual por un plano o por A*.

## Resguardo y método

- Rama comprobada: `fase11/campana-historica`. El árbol ya contenía cambios locales; se conservaron.
- Copia completa del árbol, incluidos archivos nuevos y capturas: `.local-backups/architectural-reform-20261027.tar.gz`, SHA-256 `869099e3d06f659655a51e7ba06b42784358db063e8724ac9ad5e396403af1dc`. `tar -tzf` confirmó su contenido. No se incluyeron `.git`, `node_modules`, `dist` ni las copias anteriores.
- [Datos espaciales de las 29 salas](planos/datos.json), [planos SVG](planos/00.svg) y [plano de la planta alta](planos/00-planta-alta.svg) generados por `npm run audit:architecture` desde las instancias `World` y sus colisionadores. Cada registro incluye dimensiones, accesos, objetos, obstáculos, planta superior, posición de referencia, aparición genérica del enemigo y cámara representativa. La mansión tiene además amenazas dinámicas que no aparecen como un único punto. Los planos usan un estado hipotético con capítulos desbloqueados para mostrar accesos tardíos; no son capturas del navegador ni una partida certificada.
- Planta base de todas las salas: recinto de 16 × 16 m, con geometría propia por época. Radio físico del actor: 0,34 m. El margen de maniobra de 1,2 m en torno a puertas es una señal de revisión de diseño, no una regla de bloqueo del motor. La auditoría de campaña sigue ejecutando pasos del motor; no sustituye la prueba jugada.

## Reformas implementadas

1. **Vestíbulo:** la chaise sobredimensionada junto al arranque de la escalera es ahora un sillón tallado, con geometría y colisionador derivados del mismo diseño. La distancia desde el arranque al sillón pasó de 1,05 m a 1,675 m. El escritorio se desplazó completo, incluidos cajones, patas y libros; su colisionador usa la nueva posición. La llave, el tónico, el escritorio del legado y los portales de 1217, 1899 y del pasaje temporal se reorganizaron para separar interacciones. Dos pilastras que interferían con portales se reubicaron sin perder su volumen visual.
2. **Biblioteca:** los cuatro módulos de estanterías siguen contra los muros, pero se separan de `archive-door` y `library-shortcut`. La pilastra de este último acceso pasó a un tramo de muro que no invade el umbral.
3. **Capilla:** los bancos se agruparon en dos hileras laterales y las columnas se retiraron de `chapel-side`, `basement-door` y `chapel-shortcut`. Se intentó centrar el altar; la auditoría detectó que solapaba `seal3`, por lo que se mantuvo la posición lateral original. El puzle y la ruta al sello permanecen accesibles.
4. **Archivo familiar:** ocho armarios siguen flanqueando la estancia; se redistribuyeron para dejar un espacio de maniobra frente a `archive-back` y `greenhouse-door`, conservando los documentos y el árbol genealógico.
5. **Sótano:** los armarios próximos a `basement-back` se movieron a tramos laterales. El acceso y la identidad de almacén se mantienen.
6. **Portales de la mansión:** `photo-1899-portal` se separó físicamente de `medieval-portal`; la prueba acumulativa usa la nueva posición real del portal y continúa moviendo al personaje mediante controles. `hospital-portal`, `legacy-passage`, la llave y el tónico recibieron posiciones coherentes con la nueva circulación. Los identificadores, destinos y requisitos de campaña no cambiaron.

La [regresión de circulación](../tests/architecture-circulation.test.ts) recorre con `mansionMove` el acceso a ambos desembarcos y comprueba la separación de muebles y columnas en cuatro salas. Las regresiones existentes comprueban `roman-return`, `tonic5 → note5` y `genealogy → greenhouse-door` mediante el motor físico y las reglas de selección; **todavía falta ejecutar esas interacciones de nuevo en Chromium real tras esta reforma**.

## Matriz de las 29 salas

`S` = navegación y colisiones comprobadas por simulación de motor y auditoría; `P` = cámara y juego real pendientes. Todos los planos muestran colisionadores y objetos, no capturas antes/después. «Sin cambio de planta» significa que la inspección de código y la auditoría no justificaron mover mobiliario allí; sigue pendiente jugar e inspeccionar esa sala. Cada SVG contiene el plano técnico y `datos.json` da las coordenadas exactas.

| Sala y plano | Problema espacial original observado o riesgo | Cambio de planta | Navegación / física / cámara | Capturas antes/después |
| --- | --- | --- | --- | --- |
| [00 Vestíbulo](planos/00.svg) | Sillón invadía aproximación a escalera; portales y escritorio muy próximos | Sillón, escritorio, llave, tónico, pilastras y varios portales reorganizados | S / S / P; dos vanos sur aún estrechos | [Antes](capturas/rescate/sala-0.png); después pendiente |
| [01 Biblioteca](planos/01.svg) | Estantes y pilastra reducían umbrales laterales | Estantes a muros, pilastra fuera de `library-shortcut` | S / S / P | Pendientes |
| [02 Cripta](planos/02.svg) | Sarcófagos laterales; ningún bloqueo concreto localizado | Sin cambio de planta | S / S / P | Pendientes |
| [03 Capilla](planos/03.svg) | Columnas y bancos junto a accesos; riesgo de solape con `seal3` | Hileras y columnas reorganizadas; altar lateral conservado | S / S / P | Pendientes |
| [04 Ruinas](planos/04.svg) | Columnas circulares; revisar visibilidad en combate | Sin cambio de planta | S / S / P | Pendientes |
| [05 Archivo](planos/05.svg) | Armarios limitaban maniobra ante las dos puertas | Armarios agrupados a los muros, umbrales despejados | S / S / P | [Antes](capturas/fase19/sala-05.jpg); después pendiente |
| [06 Invernadero](planos/06.svg) | Bancales laterales; revisar cámara y puerta en juego | Sin cambio de planta | S / S / P | Pendientes |
| [07 Sótano](planos/07.svg) | Armario cercano a `basement-back` | Armarios redistribuidos en la pared lateral | S / S / P | Pendientes |
| [08 Roma 189](planos/08.svg) | Altar y columnas cercanos a objetivos; `roman-return` requiere prueba jugada | Sin cambio de planta | S / S / P | Pendientes |
| [09 Claustro 1348](planos/09.svg) | Altar junto al acceso al scriptorium; comprobar encuadre | Sin cambio de planta | S / S / P | Pendientes |
| [10 Scriptorium](planos/10.svg) | Atriles y estantes rodean zona de combate | Sin cambio de planta | S / S / P | Pendientes |
| [11 Taller 312](planos/11.svg) | Mesas laterales; revisar recogida de pistas | Sin cambio de planta | S / S / P | Pendientes |
| [12 Horno 312](planos/12.svg) | Horno monumental y mesas ocupan frente norte | Sin cambio de planta | S / S / P | Pendientes |
| [13 Muelle 537](planos/13.svg) | Carga lateral y eje de embarque | Sin cambio de planta | S / S / P | Pendientes |
| [14 Archivo 537](planos/14.svg) | Estantes laterales alrededor de registro | Sin cambio de planta | S / S / P | Pendientes |
| [15 Terraza 783](planos/15.svg) | Instrumentos y parapeto abierto; verificar cámara | Sin cambio de planta | S / S / P | Pendientes |
| [16 Cúpula 783](planos/16.svg) | Instrumentos en torno a puzzle central | Sin cambio de planta | S / S / P | Pendientes |
| [17 Cantera 1092](planos/17.svg) | Bloques de piedra y acceso a cámara | Sin cambio de planta | S / S / P | Pendientes |
| [18 Cámara 1092](planos/18.svg) | Dovelas y zona de combate | Sin cambio de planta | S / S / P | Pendientes |
| [19 Hospital 1217](planos/19.svg) | Camas laterales y acceso a enfermería | Sin cambio de planta | S / S / P | Pendientes |
| [20 Enfermería 1217](planos/20.svg) | Camas y zona de combate | Sin cambio de planta | S / S / P | Pendientes |
| [21 Imprenta 1491](planos/21.svg) | Bancos de impresión; validar siluetas al jugar | Sin cambio de planta | S / S / P | Pendientes |
| [22 Planchas 1491](planos/22.svg) | Máquinas y pista central | Sin cambio de planta | S / S / P | Pendientes |
| [23 Casa Veyr 1610](planos/23.svg) | Mobiliario doméstico; revisar visibilidad | Sin cambio de planta | S / S / P | Pendientes |
| [24 Galería 1610](planos/24.svg) | Retratos y combate; revisar oclusión | Sin cambio de planta | S / S / P | Pendientes |
| [25 Teatro 1786](planos/25.svg) | Escenario y asientos; verificar líneas de visión | Sin cambio de planta | S / S / P | Pendientes |
| [26 Tramoya 1786](planos/26.svg) | Poleas y columnas físicas; verificar combate | Sin cambio de planta | S / S / P | Pendientes |
| [27 Archivo 1899](planos/27.svg) | Trípodes y estantes; verificar paso en navegador | Sin cambio de planta | S / S / P | Pendientes |
| [28 Revelado 1899](planos/28.svg) | Mesas y luz roja; verificar pista y enemigo | Sin cambio de planta | S / S / P | Pendientes |

## Límites y siguiente validación

Los planos y la auditoría permiten detectar intersecciones físicas y posiciones de interacción, pero no evalúan composición, legibilidad, animación, aparición de enemigos ni rendimiento Intel. En el vestíbulo, los pilares entre `press-1491-portal` y `veyr-1610-portal` quedan a 1,09 y 1,04 m de sus centros: el actor de radio 0,34 m puede circular según la geometría, pero ese margen merece una prueba de cámara e interacción con mando/teclado. No se han generado capturas comparativas reales tras esta reforma. Tampoco se ha completado la campaña de doce capítulos tras mover mobiliario y portales.

Con Vite en el puerto 5174 de Linux Mint, ejecutar la auditoría visual de navegador, revisar sus capturas y después la campaña auténtica:

```bash
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:reborn:survey
SANITY_HARDWARE=1 node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

Hasta comprobar las 29 salas en pantalla, los combates e interacciones tras la reforma, los desenlaces y el rendimiento Intel: **GOLD MASTER NO CERTIFICADO**.
