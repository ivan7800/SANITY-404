# Fase 25 — remasterización atmosférica de Mansión Veyr

Estado: **recorrido físico de escalera y prueba de cámara aprobados en Linux Mint; combate manual, optimización de FPS y certificación final pendientes**. Base: `20cfe74`.

## Diagnóstico inicial

- La luz principal cálida proyectaba la silueta ampliada del candelabro sobre la bóveda. La sombra dominaba la entrada y parecía una estructura opaca flotante.
- El foco, cuatro apliques y la luz ambiente iluminaban el vestíbulo con una dominante cálida uniforme. La escalera era legible, pero la diferencia entre lámparas y ventanas era débil.
- Madera, piedra y metal ya usaban mapas PBR procedurales compartidos. El contraste y brillo del bronce y los acabados del techo resultaban demasiado limpios para una mansión envejecida.
- El sistema de audio ya generaba viento, dron grave, crujidos y eventos de cordura. Faltaba un ritmo ambiental propio de la casa durante la exploración.
- Las cámaras de las dos habitaciones superiores siguen siendo estrechas. Se probó un encuadre desde la puerta, pero ocultaba más pistas y se descartó; la cámara original se conserva.

## Cambios implementados

1. **Luz localizada en la sala 0.** El foco cálido, la luz lunar fría y la luz de apoyo de la escalera tienen color y potencia propios. Los cuatro apliques siguen situados junto a sus lámparas, con menor intensidad. Solo el foco existente proyecta sombras; no se añadieron luces con mapa de sombra.
2. **Sombra del candelabro.** El metal y las velas permanecen visibles. Sus piezas se agrupan por material sin proyectar la silueta desproporcionada en la bóveda; el resto de arquitectura conserva sus sombras.
3. **Materiales.** La madera, el mármol y el bronce del vestíbulo tienen acabados más mates y una paleta menos saturada. La bóveda y sus arcos emplean yeso y piedra más fríos. Se reutilizan los mapas existentes; no hay texturas descargadas ni dependencias nuevas.
4. **Audio original.** Un par de pulsos mecánicos discretos aparece cada 13,2 segundos en la sala 0. Se sintetiza en Web Audio tras activar el audio, pasa por el volumen general, baja de nivel con «Reducir audio», no se reproduce en otras salas y libera sus nodos al terminar. Los eventos de cordura y los silencios existentes permanecen.
5. **QA.** Se añadió una captura diagnóstica de siete posiciones con la cámara normal y con actor y enemigo visibles. Registra sala, planta, posición, cámara, selección, enemigo, errores JS y nombre del renderizador. Las posiciones diagnósticas no certifican el recorrido físico ni el combate; para la escalera se mantiene la prueba de movimiento real de Fase 24.

## Comparación visual

Los pares se capturaron con Chromium a 881 × 793, calidad media, desde las mismas coordenadas y con 350 ms de asentamiento de cámara. «Antes» procede de una copia recuperable del commit `20cfe74`; «Después», del árbol actual. Las capturas usan la cámara del juego. La posición se fija con el diagnóstico de desarrollo, de modo que las imágenes permiten juzgar composición e iluminación, no accesibilidad física.

| Punto               | Coordenadas           | Antes                                          | Después                                          | Evaluación                                                                                       |
| ------------------- | --------------------- | ---------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Vestíbulo           | planta 0, (0, 4,5)    | [ver](capturas/fase25/antes/entrada.webp)      | [ver](capturas/fase25/despues/entrada.webp)      | Desaparece la sombra gigante; escritorio, acceso y escalera siguen legibles.                     |
| Pie de escalera     | planta 0, (5, -1,3)   | [ver](capturas/fase25/antes/pie.webp)          | [ver](capturas/fase25/despues/pie.webp)          | Peldaños y barandilla visibles.                                                                  |
| Mitad               | planta 0, (5, -3,35)  | [ver](capturas/fase25/antes/mitad.webp)        | [ver](capturas/fase25/despues/mitad.webp)        | Se mantiene la lectura de la carta astral al fondo.                                              |
| Descansillo y Viuda | planta 1, (5,3, -5,8) | [ver](capturas/fase25/antes/descansillo.webp)  | [ver](capturas/fase25/despues/descansillo.webp)  | Carta astral visible; la Viuda aún puede ocluir parcialmente a Élise.                            |
| Galería             | planta 1, (2, -5,8)   | [ver](capturas/fase25/antes/galeria.webp)      | [ver](capturas/fase25/despues/galeria.webp)      | Balustrada y paso visibles; ambiente frío al fondo.                                              |
| Retratos            | planta 1, (-5, -3)    | [ver](capturas/fase25/antes/retratos.webp)     | [ver](capturas/fase25/despues/retratos.webp)     | Estancia y pista visibles, pero la cámara es cercana y el Reptante puede llenar el primer plano. |
| Observatorio        | planta 1, (-1,3, -3)  | [ver](capturas/fase25/antes/observatorio.webp) | [ver](capturas/fase25/despues/observatorio.webp) | El objeto sigue legible; la habitación permanece oscura.                                         |

## Rendimiento medido

Medición puntual en la entrada, x=0, z=4,5, calidad media, ventana 881 × 793 y Chromium que declaró `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)`. Ambos procesos se sirvieron por separado en el mismo puerto 5175; se tomó la instantánea tras unos 9,5 s. DevTools abierto y variación entre ejecuciones limitan la precisión. Es **una medición de un punto**, no un recorrido completo ni un FPS mínimo de la mansión.

| Métrica                           | Commit `20cfe74` |                             Fase 25 |
| --------------------------------- | ---------------: | ----------------------------------: |
| FPS medio de la instantánea       |            28,89 | 27,06 tras 15,5 s; 25,82 tras 9,5 s |
| Tiempo de fotograma mediano / p95 |     33,3 / 50 ms |                        33,3 / 50 ms |
| GPU mediana / p95                 | 20,92 / 30,85 ms |        21,28 / 29,07 ms tras 15,5 s |
| Llamadas de dibujo                |              140 |                                 142 |
| Triángulos                        |           84 864 |                              84 864 |
| Geometrías / texturas             |         151 / 21 |                            155 / 21 |

La GPU mediana aumentó aproximadamente 0,36 ms y aparecieron dos llamadas de dibujo por la separación del candelabro. La media de FPS fluctúa más que ese coste, así que no se atribuye toda la diferencia al cambio. En esta sesión no se alcanzaron 60 FPS; hace falta una medición sin DevTools abierto, con el mismo recorrido en Linux Mint, antes de afirmar un objetivo de rendimiento. La calidad Baja conserva las sombras desactivadas y no añade luces nuevas.

## Pruebas y límites

- Regresiones nuevas: presupuesto de luces, candelabro sin sombra de bóveda y reloj limitado a sala 0 con audio reducido, silencio programado y limpieza de nodos.
- `npm test -- --maxWorkers=1`: **53 archivos y 259 pruebas PASS**. El trabajador único evita agotamientos de 5 s que se habían observado bajo carga paralela, sin modificar aserciones ni límites. La regresión de audio se repitió después del último ajuste: **3/3 PASS**.
- `npm run build`: **PASS**. `npm run format:check`: **PASS**. `npm run audit:rooms`: **PASS**, 29 salas y 418 rutas físicas; esta auditoría no equivale a jugar la campaña. `git diff --check`: **PASS**.
- La prueba `test:mansion:cinema:browser` terminó en Linux Mint con **código 0, 7/7 vistas capturadas y cero errores JavaScript**. El informe [recorrido.json](capturas/fase25/navegador-linux-mint/recorrido.json) identifica la Intel HD Graphics 620. La prueba usa posiciones diagnósticas y cámara normal; no certifica movimiento físico entre esas vistas.
- El recorrido físico posterior a los cambios terminó en Linux Mint con **código 0, 16 tramos, 22/22 comprobaciones PASS y cero errores JavaScript**. Informe: [recorrido.json](capturas/fase25/qa-escalera-linux-mint/recorrido.json). El modo arquitectónico de esta prueba oculta enemigos; certifica la ruta y la interacción, no el combate.
- El intento de Playwright dentro del sandbox falló antes de iniciar el juego por `crashpad setsockopt: Operation not permitted`. La traza fallida permanece local y queda fuera de la publicación.
- Las capturas QA no prueban combate real de la Viuda, guardado, recarga ni campaña; esas verificaciones siguen pendientes para esta fase.

Con Vite ejecutándose en el puerto 5174, repetir en Linux Mint:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_MANSION_CINEMA_OUTPUT=docs/capturas/fase25/navegador-linux-mint npm run test:mansion:cinema:browser
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_MANSION_STAIR_OUTPUT=docs/capturas/fase25/escalera-linux-mint npm run test:mansion:stair:browser
```

## Defectos pendientes

1. La oclusión de Élise por la Viuda en el rellano requiere evaluación en combate real; el diagnóstico visual fija posiciones y puede exagerar la proximidad inicial.
2. Retratos conserva un encuadre cercano y el Reptante invade el primer plano. La variante de cámara ensayada reducía la visibilidad de la pista; se descartó. Requiere diseño de cámara y combate en una sesión jugada.
3. No hay comparación de FPS del recorrido completo ni cifra fiable de memoria de GPU. La medición puntual no garantiza 60 FPS.
4. No se ha repetido la campaña histórica completa después de esta fase. **GOLD MASTER no certificado**.
