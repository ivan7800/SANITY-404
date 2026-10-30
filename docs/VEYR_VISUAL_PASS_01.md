# SANITY-404 — Pase artístico 01: carta astral de la bóveda

Rama: `feature/mansion-veyr-art-pass` (derivada de `fix/visual-quality-regression`). `main` no se altera.

## Trabajo aplicado directamente en la escena existente
- `src/world/mansion-architecture.ts`: 35 estrellas y 28 segmentos geométricos como bajo-relieve original de la bóveda del vestíbulo Veyr.
- Los dos conjuntos usan `InstancedMesh`, con dos llamadas de dibujo previstas para el adorno, sin nuevas luces ni sombras.
- Sin interacción, sin colisiones, sin efectos en lógica, guardados, combate o ruta de la escalera.
- Se hereda el arreglo reversible de los mapas normales al cambiar entre Bajo y Alto de la rama anterior.
- `tests/veyr-vault-art.test.ts`: comprueba conteos, instancing, alturas, límites y ausencia de sombras.

## Certificación pendiente
El contenido se ha revisado estáticamente y enviado a GitHub; no se ha ejecutado la escena ni medido su rendimiento en GPU real. Antes de fusionar:
```bash
npm ci
npx vitest run tests/normal-map-quality.test.ts tests/veyr-vault-art.test.ts
npm run build
npm run format:check
npm run audit:rooms
npm run dev
```
Comparar el vestíbulo desde las mismas posiciones de `docs/FASE25_REMASTER_MANSION_VEYR.md`: plano de entrada, pie de escalera, galería, observatorio, Media y Baja. Verificar que el ornamento no parpadea ni atraviesa la bóveda y que los materiales recuperan el relieve después de Bajo→Alto. Si hay oclusión o z-fighting, corregir la distancia a la bóveda antes de publicar.

## Limitación explícita
Este pase añade identidad arquitectónica, pero **no es todavía una remasterización AAA** ni prueba que WebGPU sea superior. Los siguientes incrementos deben priorizar cámaras legibles, geometría diferenciada, animaciones y tests de hardware comparativos.
