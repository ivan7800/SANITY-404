# Fase 33 · informe provisional

**FASE 33 NO CERTIFICADA.** Las pruebas nativas posteriores sí se ejecutaron en Linux Mint con Intel HD Graphics 620: accesibilidad 7/7 PASS, benchmark 12/12 muestras PASS, regresión general de navegador PASS y recuperación WebGL PASS (resultados comunicados por el usuario). La traza de campaña conserva el final histórico, `preparedState: false`, `completed: true` y cero errores JavaScript. Sigue pendiente la prueba especializada de cambio de perfil durante un combate activo.

Riesgos pendientes: inspección humana de legibilidad y solapamientos móviles; calidad visual subjetiva de Medio a 0,9; cambio de perfil durante combate activo y sesiones largas. Los dos cierres del benchmark F30 no se repitieron en el benchmark F33, pero su causa original no quedó aislada.

## Cambios

- `src/render/quality.ts`: Medio a escala 0,9, manteniendo las sombras y efectos existentes.
- `src/systems/config.ts`, `src/main.ts`, `src/ui/remaster.css`: preferencia de texto ampliado, aplicada y persistida.
- Regresiones unitarias de perfiles, ajustes antiguos/nuevos y liberación de recursos; navegador F33 para menú, diario, cambio de perfil y recarga.

## Resultados y límites

Pruebas locales anteriores: **290/290 unitarias PASS** en 66 archivos; compilación, formato y auditoría geométrica de **29 salas y 418 rutas** PASS. El intento de Chromium en Codex quedó BLOCKED por `crashpad setsockopt EPERM`/`SIGTRAP`. Posteriormente, [accesibilidad nativa](capturas/fase33/accesibilidad-intel/accesibilidad.json) registró 7/7 PASS y [benchmark Intel](capturas/fase33/benchmark-intel/resultados.json) registró 12/12 muestras PASS a 1440 × 900. La [traza de campaña](capturas/fase33/campana/campana-completa-trace.json) terminó con final histórico y cero errores JavaScript. Los FPS medidos no prueban por sí solos qué parte de la variación causó F33.

## Linux Mint · comandos de validación

Terminal 1:

```bash
cd /ruta/al/repositorio/SANITY-404
npm run dev -- --port 5174 --strictPort
```

Terminal 2:

```bash
cd /ruta/al/repositorio/SANITY-404
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE33_OUTPUT=docs/capturas/fase33/accesibilidad-intel node scripts/browser-phase33-accessibility.mjs
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE30_OUTPUT=docs/capturas/fase33/benchmark-intel node scripts/benchmark-phase30.mjs
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ node scripts/browser-phase10.mjs
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:rescue:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:mansion:stair:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:phase26:widow:browser
SANITY_HARDWARE=1 node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final --output-dir=docs/capturas/fase33/campana
```

Conservar códigos de salida, JSON y capturas. Si el rendimiento de Medio o la legibilidad empeoran, revisar la medida y el encuadre antes de declarar PASS. No se hizo commit, push, merge ni despliegue.
