# Fase 17 — Optimización y estabilidad

Implementación local del 18 de octubre de 2026. No se ha publicado. Se conservan la campaña, los guardados v1, las cinco estancias, los dos modos de cámara, la IA, el combate, los puzles y la accesibilidad.

## Diagnóstico medido

El caso reproducible es combate con enemigo activo y defensa mantenida (`F`) en la mansión, 1280 × 720 de ventana y calidad Baja (canvas interno 1024 × 576). Chrome usa WebGL 2 mediante `ANGLE (Intel, Mesa Intel(R) HD Graphics 620 (KBL GT2), OpenGL 4.6)` en este equipo. Cada repetición inicia el mismo guardado, calienta más de 100 fotogramas, espera una preparación de ataque enemiga y mide 600 intervalos `requestAnimationFrame`; referencia y candidato se alternan en el mismo navegador y con los mismos ajustes. No se ejecutaron otras pruebas de navegador durante la medición.

El perfil CPU de Chrome (10 501 muestras) tuvo 6 830 muestras inactivas y 1 530 en el programa; las tareas de juego, animación y colisiones fueron pequeñas frente al tiempo de espera. El envío CPU de un render en la referencia rondó 2,3–2,6 ms, mientras una consulta asíncrona `EXT_disjoint_timer_query_webgl2` midió 11,8–12,1 ms de GPU mediana y 16,5–17,9 ms de P95. En Bajo las sombras dinámicas ya estaban apagadas y el polvo eran 32 puntos. La escena seguía usando cuatro luces locales y mapas normales PBR en numerosos materiales. La evidencia apunta al coste de sombreado por fragmento, especialmente cuando el tiempo GPU supera el intervalo de refresco. Los tiempos CPU y GPU son de etapas solapadas: no se suman para obtener el frametime.

## Cambios

- En calidad Baja, dos de los cuatro apliques de la mansión dejan de aportar `PointLight`; las cuatro lámparas visibles permanecen. La luz hemisférica, la principal y el relleno se ajustaron para mantener legibles actores y muebles. Media y Alta conservan las cuatro luces.
- En Baja se omite la lectura de mapas normales de `MeshStandardMaterial` tras montar la escena. Permanecen las mallas 3D, los mapas de color y rugosidad, el metal, el polvo, la niebla y el resto del tratamiento PBR. La optimización reduce el coste de fragmentos y las texturas cargadas en GPU de 20 a 14 en esta escena; no elimina los archivos de textura ni demuestra una reducción cuantificada de RAM total.
- Al aplicar Opciones, cambiar solo cámara, volumen o efectos reducidos ya no destruye y reconstruye la escena. Un cambio real de calidad conserva el estado de combate y la pose lógica del enemigo durante la reconstrucción. Esto quita pausas perceptibles de los cambios de cámara.
- Se añadió una consulta GPU asíncrona y un observador de métricas solo para desarrollo. El código de temporización no entra en la compilación de producción. Se añadieron dos pruebas unitarias para el presupuesto de luces y materiales de Baja.

No se redujeron partículas, animaciones, colisiones ni sombras adicionales porque el perfil no las identificó como cuello de botella. Los 77 draw calls, 62 456 triángulos y 32 puntos de polvo del caso de combate permanecen en ambas variantes.

## Resultado comparable

Tres pares alternados, 599 intervalos útiles por repetición. FPS medio calculado como `1000 / media(intervalo)`; P95 y P99 son percentiles de intervalo, no de FPS. «Mín. 60» es el peor promedio móvil de 60 intervalos dentro de cada repetición. Los datos completos, incluida la información de GPU, están en [paired-final-visibility.json](capturas/fase17/paired-final-visibility.json).

| Variante | FPS medio por repetición | Mediana de FPS medios | Mín. 60 por repetición | P95 / P99 intervalo | Intervalos >25 ms | GPU mediana por repetición |
| --- | --- | ---: | --- | --- | --- | --- |
| Referencia Fase 1.6 | 47,99 · 46,98 · 48,24 | 47,99 | 40,91 · 42,86 · 44,44 | 33,4 / 33,4 ms | 150 · 164 · 145 | 11,94 · 12,08 · 11,77 ms |
| Fase 17 | 56,96 · 56,25 · 56,16 | 56,25 | 52,17 · 48,00 · 50,00 | 33,3 / 33,4 ms | 32 · 40 · 41 | 8,17 · 8,22 · 7,87 ms |

La mediana de FPS medios sube un 17,2 %, la mediana de tiempo GPU baja aproximadamente un 32 % y los intervalos de más de 25 ms bajan de una mediana de 150 a 40 por muestra. Ningún intervalo superó 50 ms en estos seis registros. Todas las ventanas móviles de 60 fotogramas de la variante final se mantuvieron por encima de 45 FPS **en este caso medido**. El P95 de intervalo aún es de dos ciclos de pantalla (~33 ms): siguen existiendo fotogramas perdidos y esto no garantiza 45 FPS en toda la campaña, sesiones prolongadas u otros equipos. La cifra histórica de 42,3 FPS de Fase 1.6 correspondía a otra ejecución; esta comparación usa una referencia nueva e intercalada para controlar mejor la variación térmica y del sistema.

Las pruebas intermedias separaron el efecto de quitar dos luces ([datos](capturas/fase17/paired-lights.json)) y omitir normales ([datos](capturas/fase17/paired-normals.json)); ambos mejoraron el tiempo GPU. La [captura de referencia](capturas/fase17/paired-final-visibility-baseline.png) y la [captura final](capturas/fase17/paired-final-visibility-candidate.png) usan el mismo estado y encuadre. La pérdida de relieve fino de los mapas normales en Baja es visible solo en una inspección cercana; esta comparación no muestra una degradación importante de legibilidad. Media y Alta mantienen ese relieve. Requiere revisión artística humana en pantalla real.

Ocho cambios consecutivos de cámara mediante Opciones tardaron entre 120 y 203 ms por acción en la referencia y entre 1,5 y 3,5 ms en Fase 17. Las cuentas de recursos `renderer.info.memory` se mantuvieron constantes durante cada prueba (70 geometrías, 20 texturas en esa captura, realizada antes de quitar normales). Tras recolección explícita, el heap JS subió unos 0,5 MB y 0,3 MB respectivamente; estas muestras no permiten afirmar una mejora estable de RAM. Las tareas largas iniciales de compilación WebGL siguen existiendo. [Referencia de estabilidad](capturas/fase17/baseline-stability.json) y [resultado](capturas/fase17/optimized-stability.json).

## Verificación funcional

- `npm run build`: correcto, TypeScript sin errores; JS de producción 554,27 kB / 147,65 kB gzip. Vite conserva rutas relativas para GitHub Pages.
- `node scripts/production-smoke-phase17.mjs` contra `vite preview`: la compilación final abrió directamente el juego en Chrome Intel HD 620, dibujó canvas 1024 × 576 y HUD a 1280 px, sin errores de consola. El observador de pruebas y la sonda GPU están ausentes en producción. [Captura](capturas/fase17/production-smoke.png).
- `npm test`: **41/41**; las 39 pruebas previas se conservan y se añaden dos de optimización. `npm run format:check`: correcto.
- `npm run test:browser` en Chrome acelerado: campaña completa, guardado/carga, documentos, inventario, cinco estancias, puzles, sellos, bloqueo de puertas, daño, muerte, reintento y ambos desenlaces; sin errores JavaScript.
- `npm run test:phase1` en el mismo Chrome: humanoide 3D, locomoción, cámara, IA, defensa, combate e interacción correctos. Su prueba de Gamepad API usa **un mando virtual**, no hardware físico.
- [Prueba de cámaras](capturas/fase17/cameras.json): clásica y moderna renderizadas, movimiento mantenido durante el cambio de zona, cambio en combate sin reiniciar enemigo ni invertir dirección. [Clásica](capturas/fase17/camera-classic.png) y [moderna](capturas/fase17/camera-modern.png).
- Firefox 158 instalado: WebGL 2 real, movimiento con tecla `W` enviada por WebDriver BiDi, ambas cámaras y cero errores de consola en la prueba de humo. Su identificador de renderer es `Intel(R) HD Graphics 400, or similar`; no se atribuyen los FPS de Chrome a Firefox. [Datos de Firefox](capturas/fase17/firefox.json).
- `npm run test:launcher`: inicio y cierre, Node por PATH y NVM real con entorno gráfico, concurrencia, puerto alternativo, URL del juego y recuperación de bloqueo: correctos. `node scripts/test-launcher.mjs --real-browser`: Chrome abrió la URL directa del videojuego y creó el canvas WebGL. No se ha cambiado el código del lanzador.

El sistema no tenía un mando físico disponible: `/dev/input/js0` era el acelerómetro `ST LIS3LV02DL`, no un controlador. Edge y Windows no están instalados en este entorno. Quedan pendientes un mando real, Edge/Windows, pruebas largas de estabilidad y escucha humana de la mezcla de audio.

## Reproducción

El [archivo de referencia](capturas/fase17/baseline-source.tar.gz) guarda el código anterior a las optimizaciones de juego, con la misma sonda GPU de desarrollo que se usa en el candidato para comparar. Se excluye `node_modules`. Desde la raíz del proyecto:

```bash
mkdir -p /tmp/sanity-phase17-baseline
tar -xzf docs/capturas/fase17/baseline-source.tar.gz -C /tmp/sanity-phase17-baseline
ln -s "$PWD/node_modules" /tmp/sanity-phase17-baseline/node_modules
./INICIAR-SANITY-404.sh --no-browser
(cd /tmp/sanity-phase17-baseline && ./node_modules/.bin/vite --host 127.0.0.1 --port 5175 --strictPort)
```

En otra terminal, con ambos servidores activos:

```bash
SANITY_BENCH_URL=http://127.0.0.1:5173/ SANITY_BASE_URL=http://127.0.0.1:5175/ node scripts/performance-phase17.mjs --label=repeticion --runs=6 --alternate --capture
node scripts/camera-phase17.mjs
node scripts/firefox-phase17.mjs
```

La sonda GPU requiere WebGL 2 y la extensión de timer query; el script de rendimiento exige que Chrome identifique HD 620 para evitar confundir aceleración real con renderizado por software. Los FPS se midieron en el servidor de desarrollo con la misma sonda en ambas variantes, no en el bundle de producción. La duración corta y el carácter headless limitan la extrapolación a una sesión de juego normal. No se usó REA en esta fase.
