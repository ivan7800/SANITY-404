# SANITY-404 · Reparación real de calidad gráfica

Rama: `fix/visual-quality-regression` (creada desde `main`). No publicarla como versión estable sin QA.

## Defecto observado en código
`src/render/materials.ts` anulaba `normalMap` de los materiales al entrar en el perfil Bajo, sin guardar la referencia original. Algunos materiales pueden permanecer compartidos/reutilizados, de manera que al volver a Media/Alta no se garantizaba la restauración del relieve normal-mapped.

## Corrección
- `setNormalMapQuality(root, enabled)` guarda el mapa original en un `WeakMap` y lo restaura al aumentar la calidad.
- La función previa `simplifyLowMaterials` se conserva por compatibilidad.
- `src/main.ts` aplica ambos estados a escena y a enemigos creados dinámicamente.
- `tests/normal-map-quality.test.ts` cubre ida/vuelta Bajo→Alto, materiales compartidos y materiales sin normal map.

## Alcance y límites
El cambio corrige una pérdida potencial de detalle al alternar perfiles; no acredita un salto gráfico global ni aumento de FPS. No altera guardados, historia, controles ni puertas. Se necesita ejecutar pruebas de Vitest, TypeScript, build de Vite y comparar capturas de mismas escenas en cada perfil.

```sh
npm ci
npx vitest run tests/normal-map-quality.test.ts
npm test
npm run build
npm run format:check
```

Después, probar perfil Alto→Bajo→Alto en la biblioteca y mansión, sin reiniciar partida. Comprobar que vuelve el relieve y que el tiempo p95 no empeora de forma inesperada.

## Próxima fase visual
Registrar capturas y benchmarks base; mejoras de luz y material por estancia, evitando modificar la lógica de la campaña o introducir WebGPU sin pruebas de compatibilidad.
