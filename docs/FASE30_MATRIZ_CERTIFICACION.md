# Fase 30 · matriz de certificación

**Leyenda:** PASS = ejecutado y validado con evidencia en esta revisión; FAIL = defecto reproducido; BLOCKED = entorno impidió ejecutar; PENDING = aún no probado. La [traza de Fase 22](capturas/fase22/campana-completa-trace.json) validó la campaña el 27-10-2026, antes de los cambios locales F26–F30; aparece como antecedente y no como PASS actual.

| Capítulo | Sala inicial | Antecedente 27-10 | Campaña continua F30 | Combate, puzle, objeto, guardado/recarga F30 |
|---|---:|---|---|---|
| Lucius · 189 | 8 | PASS histórico | PENDING | PENDING |
| Aurelia · 312 | 11 | PASS histórico | PENDING | PENDING |
| Maeve · 537 | 13 | PASS histórico | PENDING | PENDING |
| Samira · 783 | 15 | PASS histórico | PENDING | PENDING |
| Idris · 1092 | 17 | PASS histórico | PENDING | PENDING |
| Oona · 1217 | 19 | PASS histórico | PENDING | PENDING |
| Isabelle · 1348 | 9 | PASS histórico | PENDING | PENDING |
| Tomás · 1491 | 21 | PASS histórico | PENDING | PENDING |
| Inés · 1610 | 23 | PASS histórico | PENDING | PENDING |
| Amara · 1786 | 25 | PASS histórico | PENDING | PENDING |
| Émile · 1899 | 27 | PASS histórico | PENDING | PENDING |
| Élise · 1927 y final | 0 | PASS histórico | PENDING | PENDING |

| Sistema | Estado F30 | Evidencia / límite |
|---|---|---|
| 29 salas construidas | PASS | `audit:rooms` enumera 00–28; no certifica inspección visual. |
| 418 rutas geométricas de campaña | PASS | Auditoría física estática, 0 inaccesibles; no es recorrido WASD. |
| Puzles e inventario deterministas | PASS | Suite unitaria actual; prueba humana pendiente. |
| Suite unitaria, compilación y formato | PASS | 277/277, build y Prettier con el código final. |
| Guardado válido y protección frente a estado imposible | PASS | `tests/state.test.ts` y `tests/save.test.ts`; recarga real pendiente. |
| Audio de transición entre salas | PASS | Envolvente probada en `mansion-atmosphere.test.ts`; escucha real pendiente. |
| Viuda: persecución y cámara real | PENDING | La última traza Intel anterior falló por muestras idénticas; script revisado, sin ejecución real nueva. |
| Benchmark Intel, seis escenarios × dos perfiles | BLOCKED | Chrome no arrancó en sandbox; manifiesto de doce casos probado, sin FPS nuevos. |
| Campaña completa desde Nueva partida | PENDING | Evidencia histórica de F22, no posterior a F26–F30. |
| Final anticipado y fracaso | PENDING | No repetidos en esta revisión. |
| Inspección visual de 29 salas | PENDING | Geometría estática y capturas antiguas no la sustituyen. |
| Publicación/GitHub Pages | PENDING | No autorizada; no se ha hecho commit ni push. |

**Recuento actual:** capítulos certificados con el árbol F30: **0/12**; antecedente histórico: **12/12**. Salas verificadas geométricamente: **29/29**; salas inspeccionadas visualmente con esta revisión: **0/29**. Rutas geométricas: **418/418**; rutas reales recorridas en esta revisión: **0/418**.
