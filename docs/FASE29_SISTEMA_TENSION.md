# Fase 29 · sistema de tensión existente y ajuste

No se crea un director paralelo. `PsychologicalDirector` elige eventos según sala, cordura, lectura, objetos, descubrimientos, tiempo desde entrada, prioridad y enfriamiento por evento. `TerrorDirector` ofrece anticipación localizada y reacción a la IA. `Audio` sintetiza viento, lluvia, reloj, pasos, lamento y señales direccionales, con límite de voces. La percepción de cordura no altera colisiones, puzles ni progreso guardado.

## Ciclo verificable

1. **Calma:** ocho segundos de gracia tras entrar en una sala; tras combate, al menos seis segundos; tras un nuevo documento, objeto o acontecimiento, cuatro segundos.
2. **Sospecha:** eventos elegibles dependen de una pista o del lugar, no de un sorteo sin contexto.
3. **Anticipación:** `TerrorDirector` anuncia la cercanía y dirección de ciertas amenazas.
4. **Manifestación:** el evento de cordura se reproduce solo fuera de persecución, anticipación de ataque, ataque y recuperación.
5. **Recuperación:** el director conserva el enfriamiento global de 12 o 16 segundos y el individual de 48 segundos, con protección adicional contra repetición reciente.

La pausa, menú y lectura ya detienen el ciclo normal de `update()` en `main.ts`; las nuevas condiciones no necesitan persistirse en la partida. Al cargar se crea un director para la sala con nueva gracia de entrada. El cambio no sustituye una prueba de pausa, carga y audio en Chromium real.

## QA y coste

Regresiones deterministas: `tests/phase8.test.ts` verifica peligro sostenido, ventana posterior, pausa después de lectura, manifestación contextual y ausencia de cambios persistentes. Coste adicional: comparación de `aiState`, tres contadores de progreso y actualización de una marca temporal; no añade geometría, luces ni voces. FPS, p95 y tiempo GPU de Intel HD 620 **pendientes de medición comparable**. La muestra anterior de 12,71 FPS de Viuda en Medio contiene solo 36 fotogramas y no es referencia general.
