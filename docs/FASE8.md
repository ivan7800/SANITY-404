# Fase 8 · Terror psicológico

## Integración

La rama `fase8/terror-psicologico` parte de `main` con la Fase 7 integrada. El director de cordura elige acontecimientos de un catálogo por sala, época, umbral de cordura y pistas leídas o descubiertas. El orden es determinista: las pistas narrativas tienen prioridad, hay ocho segundos de margen al entrar, doce o dieciséis segundos entre eventos según la cordura, 48 segundos de enfriamiento por evento y protección contra las dos repeticiones más recientes. Una manifestación única puede volver tras 96 segundos. El director no escribe en el guardado.

Los sucesos nuevos vinculan la inscripción y la tablilla de Lucius en Roma, la campana y el registro de Isabelle en el claustro, el margen del códice en el scriptorium y el reflejo de Adrien en el invernadero. Activan glifos, libro, sombra o aparición ya integrados en la escena. Los retratos, la falsa puerta, la lluvia y los demás sucesos anteriores siguen disponibles. Los efectos caducan y se restauran; no añaden obstáculos ni cambian puertas, puzles, combate o finales.

El audio usa el mismo objeto `Audio` y el mismo contexto Web Audio de la Fase 7. Campana, rito y manuscrito tienen motivos sintetizados distintos; las voces mantienen el límite de doce y se desconectan al terminar. `reduced` suprime las manifestaciones, `reduceFlashes` elimina la oscilación de luces y limita el brillo de los glifos, `reduceDistortion` elimina deformaciones y `reduceAudio` suprime las señales psicológicas. No se han añadido destellos bruscos.

El formato de guardado sigue siendo versión 1 y no incorpora datos del director. Al cargar o cambiar de sala empieza un nuevo margen de entrada. Las tres épocas, los controles y los perfiles gráficos permanecen integrados.

## Validación realizada

| Comando | Resultado |
| --- | --- |
| `npm run format:check` | Pasa. |
| `npm test` | 86 pruebas en 19 archivos pasan. Incluyen director, tiempos, repeticiones, épocas, progresión, accesibilidad, restauración, audio y guardado v1. |
| `npm run build` | TypeScript y Vite pasan. |
| `npm run test:browser` | Pasa el recorrido general de campaña, guardado, puzles, muerte y opciones. El servicio en `localhost:5173` era externo a este clon; este resultado no acredita por sí solo el código de Fase 8. |
| `node scripts/browser-phase8.mjs` | No completada: Chrome termina con `SIGTRAP` por `crashpad setsockopt: Operation not permitted` en el sandbox. |
| Servidor Vite aislado (`--port 5188`) | No inicia: `listen EPERM: operation not permitted`. |

El script `scripts/browser-phase8.mjs` comprueba en navegador las tres manifestaciones nuevas, guardados v1, audio reducido, límite de voces y ausencia de errores JavaScript. Debe ejecutarse contra esta rama mediante `SANITY_URL` cuando se permita iniciar Vite y Chrome en el mismo entorno.

## Rendimiento

`lspci` identifica una **Intel HD Graphics 620**. En este entorno no se pudo iniciar un servidor de la rama ni Chrome para tomar fotogramas de exploración y de un evento psicológico. **No hay medición de FPS de Fase 8 y no se declara alcanzado el objetivo de 45 FPS sostenidos.** Las cifras de Fase 7 no se extrapolan a esta fase. Queda pendiente medir ambas escenas en el hardware con el perfil Bajo, registrar una serie temporal de fotogramas y observar memoria y voces durante una sesión prolongada.

## Estado de entrega

Los cambios están preparados y probados en la rama local. La publicación en GitHub queda condicionada a ejecutar satisfactoriamente la prueba específica de navegador y la medición que este sandbox impidió realizar.
