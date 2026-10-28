# Fase 33 · matriz QA

`PASS` exige ejecución de la comprobación indicada. `BLOCKED` indica que Chromium no llegó a abrir una página; `PENDING` indica que falta una ejecución nativa posterior a F33.

| Área | Estado | Evidencia / límite |
|---|---|---|
| Suite unitaria completa | PASS | 290/290 en 66 archivos tras F33. |
| Compilación y formato | PASS | `npm run build`, `npm run format:check`, sintaxis del script F33 y `git diff --check`. |
| Calidad Bajo/Medio/Alto y cálculo de resolución | PASS unitario | `tests/remaster.test.ts`; Medio ahora 0,9. |
| Persistencia de perfil y texto ampliado | PASS nativo | `tests/phase33-settings.test.ts` y `capturas/fase33/accesibilidad-intel/accesibilidad.json`: 7/7. |
| Liberación de geometrías y materiales | PASS unitario | Tres escenas; no equivale a prueba de memoria GPU prolongada. |
| Texto y diario a 390 × 844 | PASS automatizado nativo; PENDING inspección humana | JSON y capturas de `capturas/fase33/accesibilidad-intel/`. |
| Movimiento, cámara, controles y audio | PASS regresión general nativa comunicada | La regresión general de navegador pasó en Linux Mint; no equivale a inspección manual completa. |
| Cambio de perfil durante combate activo | PENDING nativo | El script F33 comprueba cambio en partida pausada sin combate; salud y progreso se comparan. El encuentro de la Viuda necesita prueba propia. |
| Recuperación WebGL F32 | PASS nativo comunicado | El usuario confirmó recuperación WebGL en Linux Mint. |
| 29 salas y 418 rutas geométricas | PASS geométrico | `npm run audit:rooms`: cero inaccesibles. No es recorrido de navegador. |
| Doce capítulos y final histórico | PASS nativo | `capturas/fase33/campana/campana-completa-trace.json`: 11 investigaciones, capítulo final en `ending.completed`, `preparedState: false`, cero errores. |
| Benchmark Intel Bajo/Medio | PASS ejecución nativa | `capturas/fase33/benchmark-intel/resultados.json`: 12/12 muestras; Medio 23,52–40,43 FPS, Bajo 48,57–59,53 FPS. No garantiza FPS constantes. |

La prueba de cambio de perfil durante combate activo continúa **PENDING**; por ello F33 sigue sin certificación completa.
