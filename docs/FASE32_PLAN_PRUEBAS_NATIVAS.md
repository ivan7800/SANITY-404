# Fase 32 · pruebas nativas pendientes

Ejecutar en Linux Mint con la GPU Intel. El script de guardados crea un **contexto Playwright aislado**, nunca usa el perfil de Chromium del jugador. La manipulación deliberada de localStorage sirve solo para probar corrupción; **la certificación de campaña no usa estados preparados**.

Terminal 1:

```bash
cd /ruta/al/repositorio/SANITY-404
npm run dev -- --port 5174 --strictPort
```

Terminal 2:

```bash
cd /ruta/al/repositorio/SANITY-404
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ node scripts/browser-phase32-saves.mjs --output-dir=docs/capturas/fase32/guardados-nativo
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ node scripts/browser-smoke.mjs
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ node scripts/browser-phase10.mjs
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:rescue:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE26_WIDOW_OUTPUT=docs/capturas/fase32/viuda-nativo npm run test:phase26:widow:browser
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final --output-dir=docs/capturas/fase32/campana
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_PHASE30_OUTPUT=docs/capturas/fase32/benchmark-intel node scripts/benchmark-phase30.mjs
```

Conservar código de salida, `recorrido.json`, capturas, errores JS y renderizador. La campaña completa debe empezar en Nueva partida y terminar con los doce capítulos; la prueba aislada de guardados no certifica esa campaña.

Revisión manual adversarial adicional, en un perfil de juego de prueba: interactuar repetidamente con nota, sello, puerta cerrada y altar; morir junto a una puerta; pausar durante persecución; recargar tras recoger un artefacto; volver a cada sala tras resolver su puzle; repetir sesiones largas. Registrar pasos, sala, estado y captura de cualquier fallo. Estas acciones **no están marcadas PASS** por haber sido enumeradas aquí.
