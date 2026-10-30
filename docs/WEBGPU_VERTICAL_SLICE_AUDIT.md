# SANITY-404 · Auditoría inicial y laboratorio WebGPU
Rama: feature/webgpu-vertical-slice. No modificar main ni los guardados.

## Evidencias en código
- src/main.ts (aprox. 108 KB) concentra UI, ciclo y composición; instancia WebGLRenderer directamente.
- src/render/quality.ts recibe WebGLRenderer, impidiendo cambiar backend sin adaptación.
- src/render/materials.ts genera y almacena DataTexture PBR; textureBudget() es una estimación, no telemetría GPU.
- src/render/atmosphere.ts actualiza partículas a 15 Hz, con materiales transparentes que requieren pruebas visuales en WebGPU.
- src/systems/save.ts utiliza localStorage y valida datos antes de escribir.

## Primera implementación
- webgpu-lab.html es una entrada separada de la campaña.
- src/experiments/webgpu-renderer.ts negocia WebGPU, espera init() y vuelve a WebGL2 si falla.
- src/experiments/webgpu-lab.ts crea una sala original de geometría procedural, iluminación y niebla.
- tests/webgpu-lab.test.mjs contiene pruebas estáticas de aislamiento y negociación.

## Ejecutar
npm ci
node --test tests/webgpu-lab.test.mjs
npm run build
npm run dev
Abrir http://localhost:5173/webgpu-lab.html (usar la URL/puerto que muestre Vite).

## Pendiente de certificar
No se ha compilado ni ejecutado el laboratorio en hardware real durante esta revisión. Validar typecheck, bundling Vite, render en Chrome/Edge con WebGPU y fallback WebGL2, memoria, shaders, métricas y accesibilidad. No fusionar hasta aprobar QA. No afirmar que WebGPU mejora FPS sin medición emparejada.
