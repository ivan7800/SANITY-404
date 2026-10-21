# Fase 7 · Terror cinematográfico, IA y sonido

## Cambios

- Los enemigos patrullan desde su punto de aparición, vigilan con distancia y campo visual, investigan ruido y la última posición conocida, abandonan la búsqueda y vuelven a patrullar. Obstáculos altos cortan la visión. La sombra de 1927 usa ahora el mismo ciclo; acechador, centurión y copista conservan alcances, velocidades, memoria y anticipaciones diferentes.
- El enemigo fija la dirección al iniciar la anticipación. El golpe comprueba alcance, arco y obstáculos al impactar; defensa y esquiva siguen disponibles durante la señal. Un impacto al enemigo interrumpe su ataque. El anillo junto al enemigo aumenta de intensidad durante la anticipación.
- La entrada a sala, la investigación y la persecución activan señales originales sintetizadas con posición estéreo. La proximidad antes del primer encuentro atenúa el bus ambiental y lo recupera gradualmente sin temporizadores. Puerta y luces existentes reaccionan suavemente sin crear geometría nueva. Los cambios son deterministas y locales a la sala.
- El sonido usa Web Audio tras la interacción de inicio, conserva el volumen del usuario, limita voces simultáneas a doce, desconecta cada voz al terminar y cierra el contexto al abandonar la página. Las opciones existentes de movimiento, luz y audio reducidos se aplican a los eventos nuevos.

## Verificación

| Prueba | Resultado |
| --- | --- |
| `npm run format:check` | Pasa |
| `npm test` | 80 pruebas en 18 archivos pasan |
| `npm run build` | TypeScript y Vite pasan |
| `npm run test:browser` | Campaña completa, guardado/carga, puzles, muerte y opciones pasan; sin errores JavaScript |
| `node scripts/browser-historical.mjs` | Portales, artefactos, elección y recarga de las tres épocas pasan |
| `node scripts/browser-phase2-combat.mjs` | Tres ventanas del guardián, defensa y golpes fuertes pasan |
| `node scripts/browser-phase7.mjs` | Ataque anticipado, impacto, audio y volumen en las cuatro salas representativas pasan |

Las pruebas nuevas cubren visión, obstáculos, ruido, pérdida del objetivo, retorno a patrulla, interrupción de ataques, arco de impacto y reducción de eventos. Se mantienen los datos de guardado versión 1, las tres épocas, los controles y el perfil Bajo.

### Rendimiento

Chrome con aceleración Intel HD Graphics 620 (Mesa, ANGLE), calidad Baja. Medición con `requestAnimationFrame`; el dato representa la media de cada muestra, no una garantía de FPS mínimos continuos. [Exploración](capturas/fase7/exploration.json): 120 fotogramas por sala, 60,0 FPS en mansión, Roma, claustro y scriptorium, viewport 881×793 y canvas 704×634. Combate a 1280×720, canvas 1024×576: [mansión](capturas/fase7/combat.json), tres muestras de 360 fotogramas, 58,2 / 59,5 / 60,0 FPS; [Roma y claustro](capturas/fase7/combat-eras.json), 240 fotogramas cada uno, 59,8 / 59,0 FPS; [scriptorium](capturas/fase7/combat-medieval.json), 240 fotogramas, 60,0 FPS. Todas las muestras aisladas superan 45 FPS. Una muestra corta inicial de la mansión con otras pruebas gráficas en paralelo dio 44,2 FPS, por lo que el margen depende de la carga del equipo.

Los informes registran geometrías, texturas y heap al cierre de cada muestra; no contienen una serie temporal de memoria. El bus de audio reutiliza el contexto y limita voces, pero queda pendiente una medición prolongada de posibles fugas.

## Limitaciones y pendientes

- La patrulla usa puntos locales y evasión lateral simple; en muebles complejos puede detenerse antes de encontrar una ruta alternativa. No hay navegación por malla.
- Las señales direccionales usan paneo estéreo y no oclusión acústica por paredes.
- Las mediciones se hicieron en Chrome de escritorio. Electron comparte Web Audio y la compilación web, pero no se ejecutó una prueba específica del empaquetado Electron.
- Las muestras de rendimiento duran entre dos y seis segundos. Falta una sesión prolongada de combate y exploración para evaluar memoria y FPS sostenidos durante horas.
