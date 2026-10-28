# Fase 29 · registro de defectos y riesgos

| ID | Gravedad | Estado | Evidencia, causa y acción |
|---|---|---|---|
| F29-001 | Media | Corregido; 271/271 pruebas PASS; prueba real pendiente | `Sanity.update` llamaba `PsychologicalDirector.choose` sin conocer la persecución. Con cordura bajo umbral podía emitir texto, audio y figura durante una defensa. Se añadió supresión durante estados de combate y recuperación de seis segundos; la aparición activa se retira y no reaparece tras un combate breve. Regresiones deterministas en `phase8.test.ts`. Falta escucha y visión en Chromium real. |
| F29-006 | Media | Corregido; 271/271 pruebas PASS; prueba real pendiente | El director podía emitir una nueva manifestación justo después de leer una pista, recoger un objeto o presenciar un acontecimiento, interrumpiendo su lectura emocional. Se usan los contadores de progreso existentes para reservar cuatro segundos. La regresión dirigida de `phase8.test.ts` pasa 12/12; falta validar el ritmo con jugadores. |
| F29-002 | Alta | Pendiente de certificación | Viuda: la traza Intel anterior recogió solo tres muestras físicas idénticas tras el ataque. La prueba fue corregida para muestrear por fotograma, pero falta repetición en Linux Mint y combate manual. Ver Fase 26. |
| F29-003 | Alta | Pendiente de diagnóstico equivalente | La traza breve de Viuda en perfil Medio registró 12,71 FPS, GPU mediana 29,16 ms y p95 74,02 ms en 36 muestras. No se conoce el cuello de botella dominante ni el resultado Bajo/Medio comparable. |
| F29-004 | Media | Pendiente de inspección | Biblioteca reformada en Fase 27: falta captura posterior con cámara de juego y medición Intel comparable. |
| F29-005 | Media | Pendiente de prueba real | Continuidad de sonidos, efectos de cordura y foco después de pausa, carga y transición histórica. No hay reproducción concluyente de fuga; no se declara bug confirmado. |

No hay certificación audiovisual ni GOLD MASTER. Los cambios de Fases 26–28 permanecen locales y se conservan.
