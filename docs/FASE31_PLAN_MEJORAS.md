# Fase 31 · plan de mejoras priorizadas

| Prioridad | Intervención | Criterio verificable | Estado |
|---|---|---|---|
| Alta | Silenciar pasos cuando la colisión impide desplazamiento; conservar deslizamiento. | Posición idéntica no produce paso; movimiento lateral legítimo sí. | Implementado; regresión PASS. |
| Media | Diferenciar acústicamente madera, piedra, tesela, metal y humedad en las 29 salas sin aumentar voces. | Una llamada a `tone` por paso, escalera de 63 Hz conservada. | Implementado; regresión PASS; escucha pendiente. |
| Media | Separar peldaños, rellano y galería superior en la detección de pasos. | Solo el tramo inclinado emite el timbre de escalera. | Implementado; regresión geométrica añadida; escucha pendiente. |
| Media | Mostrar un verbo contextual junto al nombre del objeto. | Distinguir leer, recoger, guardar, decidir y examinar; no anunciar puerta abierta sin comprobar su estado. | Implementado y prueba unitaria PASS; legibilidad en escritorio/móvil pendiente. |
| Alta | Repetir campaña y prueba de Viuda tras cambios F31. | Nueva partida, 12 capítulos, final, guardados, cero errores JS. | Pendiente de Chromium real. |
| Alta | Medir el benchmark F30 Bajo/Medio en Intel HD 620. | FPS, p95, GPU, CPU, draw calls bajo mismo recorrido. | Pendiente. |

No se prevén cambios de daño, recursos, puzles, estado guardado ni nuevas luces para esta tanda. Cualquier intervención visual o de ritmo posterior exige evidencia de juego y comparación de rendimiento.
