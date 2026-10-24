# Fase 12 · cierre de las cuatro épocas pendientes

Estado del código al 24 de octubre de 2026 en `fase11/campana-historica`.

La campaña añade cuatro investigaciones de dos salas: imprenta de Tomás (1491), casa Veyr de Inés (1610), teatro de Amara (1786) y archivo fotográfico de Émile (1899). Cada ruta se abre en el vestíbulo tras concluir la anterior, desde la abadía de 1348. Cada protagonista tiene figura, arma nominal, documentos, escenario, enemigo, puzle, prueba material, escena de cierre y retorno. Los objetos finales exigen resolver el puzle y derrotar al enemigo de la segunda sala; el regreso registra y guarda el capítulo concluido. Los identificadores de capítulo y objetos son estables en el guardado v2.

Las cuatro pruebas aparecen en el diario y modifican el epílogo histórico si se alcanza. Los sucesos de cordura y los avisos de ataque distinguen cada época. La ruta principal de 1927 sigue siendo accesible sin completar la cadena lateral.

## Comprobación

- `npm test`: 135 pruebas en 30 archivos. Incluye migración v1, persistencia v2, requisitos de los puzles y acceso geométrico a portales e interacciones nuevas.
- `npm run build`: TypeScript y Vite correctos. Vite avisa de que el bloque principal supera 650 kB.
- `npm run format:check`: correcto.
- `scripts/browser-historical.mjs`: una ejecución local quedó sin resultado y se interrumpió tras aproximadamente 90 segundos. Por ello no se acredita un recorrido en navegador ni una revisión visual de las épocas nuevas.

Quedan por verificar manualmente el recorrido continuo, la legibilidad visual, controles reales y rendimiento en hardware objetivo. Las pruebas de navegación calculan colisiones y alcanzabilidad del radio del jugador; no sustituyen a un recorrido interactivo.
