# Bloqueo de Lucius y conectividad de salas

**26 de octubre de 2026. Estado actualizado: Lucius superó después una ejecución real en Linux Mint con las nuevas colisiones. La campaña completa sigue pendiente. NO APTO PARA PUBLICACIÓN.**

## Evidencia recibida

En Linux Mint, `test:browser` y `test:rescue:browser` terminaron con código 0 sobre Intel HD Graphics 620; se midieron 58,94 FPS y pasaron 214 pruebas unitarias. La certificación continua desde Nueva partida entró en Lucius, leyó `note8` y presenció la formación imposible. Falló al planificar desde `(-4,27383, 4,93027)` hacia `(0, 1,4)`: `Sin destino accesible`, radio `0,2`, 55 fuentes, 3927 nodos explorados. Esta ejecución **no certifica Lucius con las nuevas colisiones**.

## Causa geométrica

El objetivo del combate estaba dentro del colisionador de la estela sólida `roman-echo-threshold`, centrada antes en `(0, 1,35)` y de `0,72 × 0,55 m`. Con el radio del jugador `0,34 m`, el punto `(0, 1,4)` estaba ocupado. Los pilares, altar, mesa de nota y otras estelas dejaban pasillos conectados; A* podía recorrer la sala, pero ningún punto del radio solicitado alrededor del destino era transitable. La estela visual y su colisionador sí coincidían. El centro de combate estaba mal distribuido.

La sala 8 tiene **35 colisionadores**: cuatro paredes, cuatro pilares del perímetro, ocho columnas con ocho basamentos, un altar y dos soportes, y ocho objetos interactivos sólidos (escritorio, documento, tres estelas, inscripción, salida y tablilla). Sus dimensiones y posiciones efectivas se conservan en `collisionGeometry` del [JSON de auditoría](RESCATE_SALAS_DATOS.json). La estela usa el AABB de su pedestal visible; los mosaicos del suelo y molduras altas no bloquean al jugador.

La estela y su marca de suelo se situaron en `(2, 1,35)`, conservando el objeto, su colisión y su función narrativa. El centro `(0, 1,4)` queda libre. La automatización se acerca a la nueva posición para leer el testimonio mediante controles y comprueba el objeto seleccionado antes de E.

## Detección preventiva

`npm run audit:rooms` construye las 29 escenas en estado inicial y en una variante hipotética desbloqueada. Desde las entradas, una búsqueda geométrica con radio real del actor exige acceso a cada objeto, puerta y salida, y confirma que `World.nearest` lo selecciona. Ahora comprueba también las posiciones de combate y pasajes usadas por la campaña desde entrada y después del documento; para Lucius incluye exactamente el origen del fallo. Cualquier destino inaccesible termina con código distinto de cero y aparece en [el JSON por sala](RESCATE_SALAS_DATOS.json). Este análisis geométrico no prueba combates, transiciones ni una partida real.

El modo `--through=final` ejecuta esta auditoría como condición previa, registra su salida en la traza y aborta antes de abrir Chromium si encuentra un destino geométricamente imposible. En el sandbox esa condición previa pasó; Chromium terminó después con `crashpad EPERM`.

La regresión unitaria reproduce las coordenadas de Linux Mint, demuestra que la disposición anterior falla, verifica la nueva ruta y recorre sus segmentos mediante `move` con las colisiones activadas. El diagnóstico de navegador `test:rescue:browser` incluye la ruta de Lucius desde esa posición QA usando WASD real y registra pasos, salud y captura. La colocación inicial QA está aislada del modo campaña; `--through=final` sigue empezando desde Nueva partida.

## Validación

| Comprobación | Resultado |
| --- | --- |
| `npm run audit:rooms` | PASS: 29 salas, dos variantes, objetos y posiciones de combate accesibles geométricamente. |
| Regresión dirigida | PASS: antigua disposición rechazada y ruta nueva transitable. |
| `npm test` | PASS: 43 archivos, 215 pruebas. |
| `npm run build` y `npm run format:check` | PASS. |
| Navegador en sandbox | Chrome termina al iniciar con `crashpad setsockopt EPERM` / `SIGTRAP`; no llegó al juego. |
| Campaña completa con la corrección | Pendiente de Linux Mint. |

Con Vite en el puerto 5174, ejecutar antes de repetir la campaña:

```bash
npm run audit:rooms && SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:rescue:browser && SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:browser && node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

El código de salida 0 del diagnóstico QA, la batería estándar y la campaña deben verificarse por separado. Los doce capítulos y el final histórico siguen sin certificación con estas colisiones.

**Actualización posterior:** Linux Mint superó ambas baterías de navegador y completó Lucius con estas colisiones. La [traza siguiente](capturas/fase22/campana-completa-trace.json) confirma también su guardado, recarga y `enemy0` derrotado. La frase anterior corresponde al estado previo a esa ejecución; la campaña completa y el final histórico continúan pendientes.
