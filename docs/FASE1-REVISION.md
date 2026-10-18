# Fase 1 — Revisión de dirección y sección jugable

Requisitos de referencia: [REQUISITOS.md](REQUISITOS.md). Esta revisión reemplaza la anterior base de figuras esquemáticas por una sección poligonal articulada. No atribuye una nota de calidad comercial al resultado.

## Cambios implementados

- Humanoide 3D propio con torso, caderas, cabeza, rostro, cabello, brazos, manos, piernas, botas y bastón; pivotes de articulación y animaciones procedurales de locomoción, respiración, ataque, guardia y reacción al daño. El enemigo usa un humanoide tridimensional de proporciones alteradas. No se utilizan sprites de personaje.
- Mansión con zócalos, paneles, molduras, pilastras, ventanas, arco, retratos modelados, chimenea, escalera ornamental, artesonado, lámpara y pavimento. La escalera es un volumen sólido de arquitectura, no un segundo piso jugable. La geometría estática se agrupa por material para limitar llamadas de dibujo.
- Tres encuadres cinematográficos por zonas en el vestíbulo. Los ejes de movimiento permanecen estables para evitar inversiones al cambiar de plano; la opción de movimiento reducido elimina la interpolación de cámara.
- Enemigo que persigue y anuncia su ataque durante 0,42 s; bastón con recuperación de 0,65 s. Mantener F o LB bloquea el ataque propio y reduce el daño recibido de 12 a 3. La defensa no hace al personaje invulnerable.
- Caja astronómica en la mansión: la carta contiene la pista Ceniza. Resolverla concede el medallón necesario, junto con la llave, para abrir la biblioteca. Los tres sellos de la campaña conservan su progresión independiente.
- Escritorios, documento, llave, botella, puertas y mecanismo hechos con geometría volumétrica original.
- Salud, cordura, diario, inventario y menú narrativo integrados; teclado, ratón para atacar y Gamepad API.
- Lanzadores Linux/Windows sin instalaciones automáticas y sin publicación. Workflow Pages disponible solo por acción manual; rutas relativas conservadas.

## Evidencia de jugabilidad

`node scripts/browser-phase1.mjs` se ejecutó en Chrome real con Playwright y renderizado por software, contra la URL generada por el lanzador. Usa pulsaciones y movimiento reales, mediante un observador de solo lectura habilitado únicamente en desarrollo, sin modificar el estado del juego. Aprobó:

1. Canvas WebGL dibujando miles de triángulos y humanoide articulado visible.
2. Movimiento con animación de piernas, exploración y cambio de encuadre.
3. Aproximación de IA, anuncio del golpe y defensa efectiva: salud 100 → 97.
4. Dos golpes de bastón con recuperación y enemigo derrotado.
5. Interacción de lectura y documento conservado en el diario.
6. Resolución de la caja astronómica y medallón en inventario.
7. Llegada al encuadre del umbral y cero errores JavaScript.

Capturas inspeccionadas: [entrada](capturas/fase1-entrada.png) y [umbral](capturas/fase1-umbral.png). La primera tentativa de combate necesitó esperar tiempo de simulación, no un retraso fijo de reloj: en SwiftShader el juego puede avanzar más lentamente que el tiempo de la prueba. La repetición corregida completó todos los pasos.

`node scripts/browser-gamepad.mjs` aprobó movimiento mediante Gamepad API simulada en Chrome, colisión efectiva con la pared, LB para defender, Y para inventario, B para volver, Select para mapa y Start para volver. No sustituye una prueba con hardware físico.

**26 pruebas unitarias aprobadas.** Las pruebas unitarias actuales cubren colisiones, estado, inventario, mando, geometría transitable, anatomía/animación, cámaras, recuperación, anuncio del ataque y defensa. La prueba de los lanzadores y sus límites figuran en [LANZADORES.md](LANZADORES.md).

## Alcance y pendientes

El tramo de mansión está demostrado como sección jugable, no como escena estática. La calidad visual y el diseño todavía requieren iteración para alcanzar la referencia de una producción comercial de GameCube. Los demás espacios de la campaña anterior conservan una presentación más sencilla. Las épocas 1610 y siglo IV están conectadas en el texto y en el diseño; sus capítulos jugables no se han implementado todavía.

No se han validado mando físico, Windows 10/11, Edge, el doble clic en una sesión real de Linux Mint/Cinnamon ni rendimiento en GPU física. El recorrido completo de la versión anterior consta en VERIFICACION.md como evidencia histórica; la aceptación de esta revisión se apoya en la sección de Fase 1 comprobada aquí. No se ha publicado en GitHub.

## Regresión integrada

Después del cambio de dirección se ejecutó también `scripts/browser-smoke.mjs`: guardado/carga, diario, llave, caja astronómica y medallón, acceso a biblioteca, tres sellos, cripta, capilla, ruinas y desenlace. Recorrido completo aprobado, con cero errores JavaScript. La prueba de guardado compara las coordenadas cargadas con las realmente guardadas, sin presuponer una coordenada exacta de parada a baja tasa de fotogramas.
