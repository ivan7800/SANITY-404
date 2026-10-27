# Remasterización de interfaz — QA visual y funcional

**Rama:** `fase11/campana-historica` · **Fecha:** 25 de octubre de 2026 · **Estado:** QA automatizado de interfaz aprobado en Linux Mint; calidad numérica sin evaluar.

## Dirección y alcance implementado

Identidad propia de archivo gótico: carbón, bronce envejecido, marfil y rojo oscuro; jerarquía de texto cinematográfica con fuentes del sistema; líneas de expediente y grabado circular generado con CSS, sin imágenes ni marcas de terceros. Las superficies y distorsiones son CSS de bajo coste y respetan `prefers-reduced-motion`. El HUD conserva salud, cordura, resistencia, objetivo, avisos y foco de interacción; cambia visualmente con salud crítica y cordura baja. El fondo 3D queda visible mientras se juega y detrás de los paneles.

| Flujo | Implementación |
| --- | --- |
| Título y menú | Composición editorial, navegación por teclado, botones originales de Nueva partida, Continuar y Opciones; Cargar partida y Créditos añadidos. |
| Nueva partida, continuar, cargar | Nueva partida y Continuar conservan sus handlers. Cargar presenta la última memoria válida antes de abrirla. Una ranura inválida o ausente queda desactivada. |
| HUD, combate y peligro | Barras y valores legibles, objetivo y señales visuales de salud crítica; el velo y el feedback de golpe siguen sus sistemas existentes. |
| Inventario y diario | Resumen de arma y recursos, tarjetas de objetos, objetivo de capítulo, testimonios, pruebas, documentos y botón de tónico con su lógica original. |
| Puzles e interacciones | Panel de opciones con disposición clara, feedback del puzle en región de estado, foco de teclado y prompt separado del HUD. |
| Pausa, opciones y controles | Panel con controles existentes, ajustes gráficos y accesibilidad; foco retenido en el diálogo y retorno al lienzo al cerrar. |
| Épocas, muerte, finales y créditos | Panel de introducción de capítulo, variantes de muerte y desenlace; créditos originales y navegación de vuelta. |
| Móvil y tableta | Reflujo de paneles, inventario y HUD; controles táctiles reales de movimiento, interacción, combate, defensa, esquiva, tónico, diario y pausa. En pantallas horizontales bajas se reduce el contenido secundario del título. |

La pantalla de título anterior está en [menu.png](capturas/fase11/menu.png) y el HUD anterior en [fase18-hud-480x320.png](capturas/fase18/fase18-hud-480x320.png). El [QA de interfaz certificado en Linux Mint](capturas/remaster/ui-qa-certificado-linux-mint.json) terminó con `completed:true`, 18/18 checks, código 0 y cero errores JavaScript. Conserva once capturas de escritorio, tableta y móvil, incluidos [menú de escritorio](capturas/remaster/menu-1440x900.png), [inventario](capturas/remaster/inventario-1440x900.png) y [diario táctil](capturas/remaster/inventario-390x844.png). Las capturas iniciales de sandbox y sus fallos se conservan como histórico, sin sustituir la ejecución posterior válida.

## Verificación y comandos

- `npm test`: 40 archivos, **190/190** pruebas aprobadas, incluidas las regresiones de navegación histórica y los controles táctiles.
- `npm run build`: TypeScript y Vite correctos.
- `npm run format:check`: correcto tras el último formateo.
- `npm run test:browser`: **salida 0** en la batería estándar tras la corrección del nombre accesible: diez hitos de la ruta corta, casos de sistemas y pérdida/recuperación WebGL, cero errores JavaScript en la ruta corta. No cubre todas las pantallas nuevas.
- `npm run test:ui`: **salida 0 en Linux Mint**, 18/18 checks y cero errores JavaScript. Comprueba menú, créditos, opciones, Nueva partida, inventario, guardado/carga y apertura/cierre real del diario táctil. Los intentos anteriores fallidos se conservan por separado.

Desde un terminal normal de Linux Mint, con Vite en 5174:

```bash
npm run test:ui -- --url=http://127.0.0.1:5174/
```

El script comienza en el menú real, navega créditos y opciones, inicia Nueva partida, abre el diario, guarda mediante interacción, carga el guardado por la nueva pantalla y prueba el movimiento y diario táctiles. Conserva las capturas en `docs/capturas/remaster/`. La evaluación visual humana, el mando físico y la medición Intel HD 620 siguen pendientes. No se asigna una nota 9,5/10 sin esos resultados.

## Corrección del diario táctil en Linux Mint

La [traza real del fallo](capturas/remaster/ui-qa-bloqueo-diario-linux-mint.json) aprobó 14 checks antes de fallar en «Diario accesible por control táctil». La [captura tomada inmediatamente después](capturas/remaster/fallo-2026-10-25T17-26-21-693Z.png) muestra el diario abierto. El control sí activó `Tab`: el test leía el selector antes de que el siguiente fotograma procesara el evento. Ahora espera de forma observable a `paused=true`, overlay visible y panel de inventario, y comprueba que los controles táctiles se ocultan; después pulsa «Volver» y verifica la reanudación y la vuelta de los controles. No se cambió la lógica del juego ni se simuló entrada de teclado para este check. La ejecución completa del QA visual corregido sigue pendiente: Chromium del sandbox falló al lanzarse antes de la página.
