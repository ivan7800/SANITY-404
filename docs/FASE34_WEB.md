# Fase 34 · web

`vite.config.ts` usa `/SANITY-404/` en producción y `./` para el bundle de Electron. `npm run build:web` y `npm run verify:distribution` pasaron: `dist/index.html` referencia recursos existentes bajo `/SANITY-404/`; los siete archivos del bundle se comprobaron con tamaño y SHA-256. No se desplegó GitHub Pages.

La regresión de navegador en desarrollo y la campaña histórica completa figuran como PASS comunicados por el usuario. Se mantienen separadas de la validación del build servido por `vite preview`.

## Comprobación del build de producción

```bash
npm run build:web
npm run build:desktop:assets
npm run verify:distribution
npm run preview -- --host 127.0.0.1 --port 5180 --strictPort
```

Abrir `http://127.0.0.1:5180/SANITY-404/`. Comprobar recursos cargados sin 404, Nueva partida, navegación por teclado, guardado real, recarga, «Continuar» y consola sin errores JavaScript. Ejecutar el smoke de producción con `SANITY_TEST_URL=http://127.0.0.1:5180/SANITY-404/ SANITY_HARDWARE=1 node scripts/phase34-web-production-smoke.mjs`. Repetir en la URL de GitHub Pages solo tras un despliegue autorizado.

Resultado del preview de producción: **PASS** en Chrome con Intel HD Graphics 620. El smoke comprobó recursos y menú, movimiento con teclado, guardado real mediante E, recarga, «Continuar» y ausencia de errores JavaScript, HTTP 4xx/5xx y peticiones fallidas. `npm run test:browser` depende de `window.sanityInspect`, disponible solo en desarrollo; al ejecutarlo contra el build falló antes de sus aserciones con `window.game.inspect is not a function`. Esto no identifica un defecto del juego de producción. La prueba específica de producción utiliza la interfaz visible y el guardado de `localStorage`.

**Pendiente: fallo de timeout de producción web.** El usuario ha indicado que debe mantenerse abierto. El smoke corto del preview local no reproduce ni descarta el fallo de timeout de una ejecución más larga o del sitio remoto. Antes de cerrar la incidencia, registrar URL, duración, punto de espera y traza de una repetición sobre el build desplegado, cuando el despliegue esté autorizado.
