# SANITY-404

**El archivo de las ausencias** · survival horror 3D original para navegador.

Europa, noviembre de 1927. La restauradora Élise Moreau recibe una carta de su hermano desaparecido. En la mansión Veyr, los recuerdos mantienen abierta una herida entre mundos. Recupera tres sellos, interpreta los documentos y decide qué merece sobrevivir en tu memoria.

## Iniciar con doble clic

Los requisitos vigentes están en [docs/REQUISITOS.md](docs/REQUISITOS.md). La remasterización visual está documentada en [Fase 1.5](docs/FASE15.md), con [comparador antes/después](docs/comparativa-fase15.html).

**Linux Mint:** abre `INICIAR-SANITY-404.desktop` (si el escritorio lo pide, marca el archivo como lanzador de confianza), o ejecuta `./INICIAR-SANITY-404.sh`. Detecta Node compatible desde PATH o NVM, comprueba dependencias existentes, busca un puerto local disponible y abre Chrome/Chromium con el videojuego. No instala paquetes. El `.desktop` usa la ubicación del propio archivo para encontrar el lanzador; conserva ambos archivos en la misma carpeta.

```sh
./INICIAR-SANITY-404.sh --check       # comprobar Node y dependencias
./INICIAR-SANITY-404.sh --status      # mostrar la URL activa
./INICIAR-SANITY-404.sh --stop        # detener el servidor propio
./INICIAR-SANITY-404.sh --no-browser  # iniciar sin abrir navegador (pruebas)
```

**Windows 10/11:** doble clic en `INICIAR-SANITY-404.cmd`. Usa PowerShell sin perfil y abre el navegador predeterminado. Los mismos argumentos `--check`, `--status`, `--stop` y `--no-browser` están disponibles. Scripts preparados; ejecución real en Windows pendiente.

Los errores de Node/servidor/navegador se muestran y registran en `.sanity-launcher/server.log`. Cerrar la ventana del navegador no apaga el servidor: utiliza `--stop`. El lanzador reutiliza su servidor y autentica las peticiones de cierre; no mata otros procesos ni servidores iniciados manualmente. Mantiene el acceso limitado a `127.0.0.1`.

Si faltan dependencias, los lanzadores se detienen con instrucciones. La instalación es una acción manual explícita:

```sh
npm ci
```

Alternativa de desarrollo: `npm run dev`. Verificación:

```sh
npm test
npm run build
npm run format:check
npm run test:launcher
npm run test:phase1  # con el lanzador iniciado
```

`CHROME_PATH` permite seleccionar otro ejecutable de Chromium. Las pruebas de navegador generan capturas en `/tmp` y usan controles reales y un observador de solo lectura. El recorrido completo histórico puede dirigirse a la URL del lanzador con `SANITY_TEST_URL=http://127.0.0.1:PUERTO/ npm run test:browser`.

Con el lanzador activo, la regresión nueva se reproduce con `node scripts/browser-phase2.mjs`, `node scripts/browser-phase2-combat.mjs`, `node scripts/browser-phase2-sanity.mjs` y `node scripts/browser-phase2-branch.mjs`. `node scripts/performance-phase2.mjs --runs=3` mide combate en cada sala; exige Chrome e Intel HD 620 para evitar comparar GPU distintas. Los resultados y las capturas están en [docs/FASE2.md](docs/FASE2.md).

## Jugar

- WASD o flechas: movimiento con ejes estables durante los cambios de encuadre. Shift izquierdo: correr.
- Cámara cinematográfica automática por zonas. F o LB: mantener defensa.
- E: interactuar. Espacio o botón izquierdo: ataque ligero. J o botón derecho: ataque fuerte. V: esquivar.
- H: beber tónico. Tab: inventario y documentos. M: mapa. Escape: pausa/volver.
- Mando estándar: stick izquierdo movimiento, LB defensa, RB ataque fuerte, R3 esquiva; A interactuar/confirmar, B ataque ligero/volver, X tónico, Y inventario, Select mapa, Start pausa. Stick izquierdo arriba/abajo recorre menús.

Guarda en los escritorios de memoria. No hay guardado automático: morir permite volver a la última partida conservada. El navegador guarda localmente; otro perfil, otro dominio o borrar almacenamiento elimina el acceso a esa memoria.

## Contenido de esta versión

Ocho áreas conectadas: mansión, biblioteca, cripta, capilla, ruinas, archivo familiar, invernadero y sótanos. La rama de la Mansión de los Ecos añade cuatro mecanismos con pistas en documentos, un atajo permanente, hallazgos opcionales, acechador, criatura ritual, guardián de dos fases, doce eventos de cordura y un desenlace que recuerda lo descubierto sobre Adrien. Se conservan la ruta y el desenlace originales. Es una campaña breve con geometría procedural de baja complejidad; no equivale a una producción comercial extensa ni acredita una nota de 9,5/10. [Fase 2: cambios, capturas, pruebas y límites](docs/FASE2.md).

En Opciones → Calidad gráfica, Baja desactiva sombras, limita la imagen interna a 1024 × 576, reduce a dos las luces locales activas de la mansión y omite mapas normales; Media usa sombras de 1024 y hasta 900p; Alta usa sombras de 2048 y hasta 1080p. La interfaz se dibuja a la resolución nativa. El personaje y la arquitectura usan mallas, materiales PBR y texturas procedurales originales. Para Intel HD 620 / 8 GB se recomienda Baja: en Fase 17 se midieron 56,2–57,0 FPS medios en tres muestras breves de combate a 720p, sin garantía para toda la campaña. [Método y límites](docs/FASE17.md).

Accesibilidad: preferencia de movimiento reducido del sistema, controles separados para destellos, distorsión y sonidos intensos, control de volumen y resolución, menús operables con teclado, foco visible, indicadores numéricos y mensajes textuales. Los efectos no incluyen destellos rápidos. No depende del sonido para resolver puzles.

## Arquitectura

- `src/engine/input.ts`: teclado, ratón y Gamepad API.
- `src/world/scene.ts`, `phase2-rooms.ts`, `mansion.ts`, `character.ts`, `enemies.ts`: escenas, arquitectura agrupada, colisiones y humanoides articulados originales.
- `src/engine/camera.ts`: encuadres cinematográficos por zonas y corrección de oclusión.
- `src/render/`: materiales originales, iluminación, atmósfera, perfiles de calidad, agrupado de mallas y métricas.
- `src/world/narrative.ts`: textos originales.
- `src/systems/`: estado validado, progreso de la Mansión de los Ecos, combate, cordura, inventario, sonido, configuración y persistencia.
- `src/ui/`: presentación y control de foco.
- `src/main.ts`: composición, ciclo, navegación y enlace de las interacciones con la interfaz.

Three.js, TypeScript, Vite, Web Audio y localStorage. Sin frameworks de interfaz, modelos descargados, música comercial ni herramientas propietarias requeridas para ejecutar el juego. Las dependencias conservan sus respectivas licencias.

## GitHub Pages

El [repositorio público](https://github.com/ivan7800/SANITY-404) contiene el código y prepara [SANITY-404 para navegador](https://ivan7800.github.io/SANITY-404/). El workflow `.github/workflows/pages.yml` ejecuta formato, pruebas y build en cada push a `main`, y despliega `dist` en GitHub Pages. Vite genera las rutas de producción con la base `/SANITY-404/`; el servidor local conserva `/` para los lanzadores. Para que la URL pública sirva el juego compilado, selecciona **Settings → Pages → Build and deployment → Source: GitHub Actions**. Si permanece «Deploy from a branch», GitHub puede volver a publicar el HTML fuente después del workflow y mostrar una página vacía.

Consulta [la revisión y prueba de Fase 1](docs/FASE1-REVISION.md), [los lanzadores](docs/LANZADORES.md), [el registro histórico de verificación](docs/VERIFICACION.md) y [el registro de REA](docs/REA.md).

La campaña histórica de la rama `fase11/campana-historica` incluye las investigaciones de 1491, 1610, 1786 y 1899. Su alcance y las comprobaciones pendientes están en [Fase 12](docs/FASE12.md).

## Fase 1.6 · Presentación cinematográfica

Cámara clásica o moderna en Opciones, planos a media altura, combate bloqueado por obstáculos, reacciones y caídas articuladas. Se conserva la campaña. [Cambios, pruebas y rendimiento real](docs/FASE16.md) · [Capturas comparativas](docs/comparativa-fase16.html). En HD 620, Bajo a 720p: 55,5–55,9 FPS en la muestra de exploración y 42,3–46,9 en combate; todavía no se garantizan 45 FPS sostenidos.

## Fase 17 · Optimización y estabilidad

El perfil de Chrome en Intel HD 620 identificó el sombreado por fragmento como principal coste del combate. Baja reduce luces activas y lecturas de mapas normales; los cambios de cámara ya no reconstruyen la escena. La comparación alternada de seis ejecuciones, las capturas, las 41 pruebas y las limitaciones están en [docs/FASE17.md](docs/FASE17.md). Se conserva la campaña; Fase 17 se cerró antes de la publicación.
