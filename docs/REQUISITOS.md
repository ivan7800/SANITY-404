# Dirección vigente — SANITY-404

Esta revisión sustituye cualquier interpretación anterior que considere suficientes habitaciones de prueba o personajes esquemáticos. Referencia de experiencia: survival horror poligonal clásico de GameCube, con especial atención al ritmo, combate, exploración, cordura y encuadres cinematográficos de Eternal Darkness. Todos los recursos, código, niveles y relatos son originales.

## Producto

Juego completamente 3D con arquitectura modelada, humanoides volumétricos articulados, animación de locomoción y combate, cámara cinematográfica por zonas, enemigos con IA, ataque y defensa, salud, cordura, inventario, puzles y horror cósmico. No se aceptan sprites sustitutivos, raycasting, pixel art, aventura textual ni escenas estáticas como entrega jugable.

La narrativa conecta épocas: Élise Moreau (1927), la archivista Inés Veyr (1610) y el cantero Lucan (siglo IV). Comparten las huellas del Intervalo, sin reutilizar personajes o acontecimientos comerciales. Esta primera sección se centra en la mansión de 1927; las otras épocas se presentan mediante documentos y quedan como capítulos por desarrollar, sin anunciarse como campañas ya implementadas.

## Puerta de aceptación de Fase 1

Mansión con arquitectura detallada, protagonista humanoide animado visible, encuadres cinematográficos, iluminación atmosférica, movimiento y colisiones, enemigo 3D con IA, combate con defensa y daño, salud y cordura, interacción y puzle resoluble, interfaz integrada, teclado y Gamepad API. Se debe renderizar en navegador real y demostrar exploración, combate e interacción antes de aceptar la fase. El objetivo artístico no se acredita automáticamente por superar pruebas.

## Lanzadores incluidos en Fase 1

Linux Mint: shell ejecutable y acceso .desktop con icono original, Node desde PATH o NVM sin depender de un terminal interactivo, comprobación de dependencias sin instalaciones, Vite enlazado exclusivamente a 127.0.0.1 con puerto disponible, espera de respuesta, Chrome con URL del videojuego, exclusión de servidores duplicados, registro de errores, estado y cierre.

Windows 10/11: .cmd y auxiliar PowerShell, Node desde PATH o ubicaciones habituales, Vite local, navegador predeterminado y errores comprensibles. Las pruebas no ejecutables en el entorno se declaran como pendientes.

No modificar otros proyectos, no instalar dependencias automáticamente desde lanzadores y no publicar todavía en GitHub. Mantener rutas relativas y build compatible con Pages.

## Dirección de Fase 1.6

Priorizar cámara a media altura y encuadres cercanos, modos clásico/moderno con movimiento estable, anticipación e impactos, ataques bloqueados por geometría, locomoción y caída articuladas, atmósfera visible y perfil Bajo para HD 620. Conservar campaña, controles, guardados y lanzadores. Mantener las 34 pruebas anteriores y ampliar cobertura. Validar en navegador y aportar cinco capturas y FPS medidos, con limitaciones explícitas. No publicar. Evidencia: [FASE16.md](FASE16.md).

## Dirección vigente · Fase 17

Investigar con perfiles CPU y GPU la caída a 42,3 FPS observada en combate sobre Intel HD 620. Optimizar los cuellos de botella reales de renderizado y estabilidad conservando presentación, campaña, mandos, cámaras y lanzadores. Comparar referencia y versión nueva bajo condiciones equivalentes, con varias repeticiones, FPS, percentiles de frametime y picos; objetivo de 45 FPS sostenidos a 720p/Bajo, sin convertir mediciones breves en garantía general. Conservar las 39 pruebas previas y ampliar regresiones pertinentes. Probar navegadores disponibles y mando físico solo si existe. Documentar límites y pruebas pendientes en [FASE17.md](FASE17.md). No publicar.

## Dirección vigente · Fase 2: La Mansión de los Ecos

Ampliar la campaña existente con biblioteca prohibida, archivo familiar, invernadero, capilla abandonada y sótanos conectados por exploración, mecanismos y progreso persistente. Incorporar acechador, criatura ritual y guardián del umbral; ataque ligero y fuerte, defensa y esquiva; cuatro puzles con pistas legibles; al menos diez eventos perceptibles de cordura; documentos originales y un desenlace propio con consecuencias de descubrimientos opcionales. Conservar las salas, controles, cámara, campaña y partidas anteriores.

Validar el recorrido completo, combate, guardado, carga, efectos, Chrome y Firefox disponibles, lanzador Linux, build de producción y rendimiento real en Intel HD 620/Bajo/720p. Generar capturas reales y registrar resultados y límites en [FASE2.md](FASE2.md). No presentar mando simulado como hardware, no publicar en GitHub y no declarar garantizada una tasa de FPS por muestras breves.
