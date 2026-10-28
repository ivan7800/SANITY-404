# Fase 30 · auditoría integral de integración

**Estado:** en curso, NO-GO. Rama `fase11/campana-historica`, HEAD inicial `3396c2b`. El árbol contenía cambios locales de Fases 26–29 y abundantes capturas sin seguimiento. No se ha limpiado, revertido, cambiado de rama ni publicado nada.

## Línea base comprobada en esta continuación

Antes de las correcciones F30: `npm test -- --maxWorkers=1` **271/271 PASS**, `npm run build` PASS, `npm run format:check` PASS y `npm run audit:rooms` **29 salas, 418 rutas geométricas, cero inaccesibles**. La auditoría construye escenas y estados hipotéticos; no recorre la campaña con controles. Vite intentó usar el puerto 5174, lo encontró ocupado y pasó automáticamente al 5175; el proceso propio se detuvo. Un nuevo intento con `--strictPort` falló explícitamente: `Port 5174 is already in use`, sin cambiar de puerto. `curl` a 5174 devolvió conexión rechazada, `lsof` no mostró un proceso y `ss` no pudo consultar netlink (`Operation not permitted`); no se atribuye el conflicto a un proceso concreto.

Después de las correcciones: **277/277 pruebas unitarias PASS** (58 archivos), compilación PASS, formato PASS, auditoría **29 salas/418 rutas** PASS y `git diff --check` PASS. Las regresiones F30-002 y F30-003 se ejecutaron primero en rojo para demostrar los fallos, y después en verde.

## Arquitectura inspeccionada

| Sistema | Implementación actual | Resultado de esta revisión |
|---|---|
| Escenas y capítulos | `World` en `src/world/scene.ts`; 29 nombres de sala; `campaign.ts` define doce capítulos y dependencias. | Recuento confirmado en código. La auditoría geométrica pasó; inspección visual de las 29 salas pendiente. |
| Estado y persistencia | `State` v2, `parseSave`, `validPhase2`, `validCampaign`, `writeSave`. | Dos defectos de integridad reproducidos y corregidos en F30-002/003; partidas válidas conservan formato. |
| Bucle | `frame()` usa `simulationDeltaSeconds`, subdivisión de 25 ms, actualiza jugador/IA y renderiza. | No se alteró; rendimiento Intel de esta revisión sin medir. |
| Movimiento y navegación | Colisión física compartida, `mansionMove`, A* de pruebas y desvío de IA en `actor-path.ts`. | 418 rutas de auditoría estática PASS; ejecución física de Viuda y campaña actual pendientes. |
| Combate y cordura | `Combat.update`, amenazas de mansión, `Sanity` y `TerrorDirector`. | Las regresiones unitarias previas pasan. La Viuda tiene evidencia histórica de aparición, movimiento y golpe, pero su prueba real final no pasó todavía. |
| Audio | Síntesis Web Audio, ambiente por sala, silencio dramático, límite de voces. | F30-001 corregido: una transición ya no hereda la atenuación programada de la sala anterior. Prueba de envolvente PASS; escucha real pendiente. |
| Interfaz y recursos | Menú, inventario, diario, controles, perfiles Bajo/Medio/Alto; Vite con base `/SANITY-404/` en producción. | Compilación de producción PASS. `rg` no encontró `sanityQa`, `sanityInspect`, `sanityBenchmarkState` ni `setSanity` en los JS de `dist/assets`; la base de recursos de `dist/index.html` es `/SANITY-404/`. |

No se ha justificado una refactorización masiva. Esta tanda solo toca validación de guardado, transición sonora y herramientas de medición aisladas. `src/main.ts` contiene también cambios previos de Fases 26–29: no se deben atribuir íntegramente a F30.

## Evidencia de campaña y límites

La [traza histórica](capturas/fase22/campana-completa-trace.json) del 27-10-2026 registra Nueva partida, 12 capítulos, final histórico, **2808/2808 checks** y cero errores JavaScript en unos **806 s**. Es evidencia de aquella revisión. Los cambios locales posteriores de Fases 26–30 requieren **otra ejecución completa**; por ello ningún capítulo se marca PASS actual en la matriz. El final anticipado también requiere una prueba independiente actual. La prueba aislada de Viuda y el benchmark no certifican campaña.

## Navegador y entorno

El intento F30 de benchmark, reducido a menú y 2 s, se bloqueó **antes de crear página** en Medio y Bajo: `browserType.launch`, `crashpad ... setsockopt: Operation not permitted (1)`, salida `SIGTRAP`. Se preserva el [JSON original completo](capturas/fase30/benchmark-sandbox-crashpad.json). No es una medición de FPS ni evidencia de defecto del juego. No se modificaron restricciones del sandbox. El informe nuevo del benchmark conserva el error íntegro en JSON y resume solo su primera línea en consola.

## Validación pendiente

Repetir en Linux Mint la prueba real de Viuda, el benchmark de doce muestras, la campaña continua desde Nueva partida, final anticipado, controles táctiles/cámara, audio de transición y capturas actuales. Separar siempre QA aislado de partida real. Las instrucciones exactas están en `FASE30_INFORME_FINAL.md`.
