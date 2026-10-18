# Fase 2 · La Mansión de los Ecos

**Estado de esta entrega:** campaña ampliada jugable. Esta entrega conserva la ruta original de cinco áreas y añade una rama lateral con tres áreas nuevas, dos áreas ampliadas y un desenlace propio. Las épocas de Lucan e Inés se investigan mediante documentos; todavía no son capítulos jugables. La publicación posterior se gestiona desde `main` mediante GitHub Actions.

## Contenido implementado

La biblioteca y la capilla existentes reciben arquitectura y mecanismos nuevos. El archivo familiar, el invernadero y los sótanos tienen geometría poligonal, colisiones, iluminación, objetos, documentos y rutas por puertas. El recorrido lateral es **biblioteca → archivo → invernadero → capilla → sótanos**. Los cuatro mecanismos abren cada tramo; resolver la bóveda astronómica crea un atajo persistente entre biblioteca y capilla. El mapa distingue salas visitadas y muestra ambas rutas. Las puertas cambian de sala sin cargar todas las zonas a la vez.

| Área | Función jugable | Diseño 3D |
| --- | --- | --- |
| Biblioteca prohibida | Índice de manuscritos, puerta al archivo y atajo | Estantes, galería, escalera y cajones |
| Archivo familiar | Cronología Veyr, retratos y documentos | Armarios, cajones, relieve de retratos |
| Invernadero | Pista opcional de Adrien y acechador | Estructura de hierro, vidrio, jardineras y vegetación instanciada |
| Capilla | Bóveda astronómica, criatura ritual y atajo | Bancos, altar, nervios góticos y vidrieras |
| Sótanos | Mordazas, guardián y desenlace | Almacén, columnas, sello y anillo del umbral |

Cada mecanismo tiene una pista en el documento de su sala y tres elecciones ordenadas. El fallo da respuesta y permite reintentar sin bloquear la campaña. Se guardan los pasos, resoluciones, objetos recogidos, documentos, enemigos vencidos, atajos, visitas y descubrimientos. Las partidas anteriores sin datos de Fase 2 se migran conservando el progreso original.

Los modelos enemigos son mallas 3D originales. El **acechador** patrulla, investiga ruido, persigue, pierde el rastro y ataca rápido. La **criatura ritual** se mueve de forma irregular, anuncia golpes y es más vulnerable al ataque fuerte. El **guardián** tiene dos fases y deja ventanas de daño después de su embestida larga. El combate conserva golpe ligero y defensa; añade golpe fuerte, esquiva, resistencia, recuperación e impacto. Los ataques requieren alcance, orientación y línea libre de obstáculos.

Hay doce eventos de cordura distribuidos por las cinco áreas, condicionados por umbral, documentos o descubrimientos: libro flotante, índice animado, retratos cambiantes, puerta aparente, pasos adicionales, sombra sin dueño, doble en el vidrio, lluvia ascendente, coro, penitente, pasillo alargado y sello que respira. Se representan con mallas, partículas, cambios de material, niebla, luz y audio. No modifican colisiones ni progreso. Opciones separadas permiten reducir efectos, variaciones de luz, distorsión y sonido intenso.

La historia sigue a Élise Moreau y Adrien a través de cartas sobre la sociedad Veyr, Inés (1610), Lucan (siglo IV) y el Intervalo. Hallar el cuaderno opcional de Adrien cambia el texto y el recuerdo del desenlace. El audio procede de Web Audio: ruido filtrado para viento y lluvia, pasos según sala, crujidos, mecanismos, puertas, susurros y señales de combate. No se han incorporado recursos de juegos comerciales ni archivos externos de sonido. REA no se ejecutó para esta fase.

## Validación funcional

| Comprobación | Resultado |
| --- | --- |
| TypeScript y build Vite | Correcto |
| Vitest | 47/47: 41 anteriores y 6 nuevas pruebas |
| Formato | Correcto |
| Campaña original en Chrome | Completa, tres sellos y desenlace; cero errores de consola |
| Rama Fase 2 en Chrome | Cinco áreas, cuatro puzles, guardado/carga y desenlace; cero errores de consola |
| Regresión Fase 1 en Chrome | Movimiento, cámara, colisión, combate, interacción y puzle; correcta |
| Dos desenlaces según pista opcional | Comprobados en navegador |
| Guardián | Tres ventanas de daño, cambio de fase y muerte comprobados en navegador |
| Cordura | Eventos perceptibles capturados en archivo e invernadero |
| Firefox | WebGL 2, movimiento y cámara; invernadero nuevo comprobado |
| Lanzador Linux | Node desde PATH/NVM, arranque concurrente, URL, reutilización, cierre y recuperación comprobados |
| Build de producción | Mansión e invernadero renderizados en Chrome/Intel HD 620; sin errores ni observador de desarrollo |
| Gamepad API simulada | Movimiento, defensa, RB fuerte, R3 esquiva, inventario, mapa y pausa correctos |
| Gamepad físico | Pendiente: no hay un mando conectado; la prueba de Gamepad API usa un dispositivo simulado |
| Windows y Edge | Pendientes: no disponibles en este equipo |

Los guiones reproducibles están en `scripts/browser-phase2.mjs`, `browser-phase2-combat.mjs`, `browser-phase2-sanity.mjs`, `browser-phase2-branch.mjs`, `performance-phase2.mjs` y `production-smoke-phase2.mjs`. Las capturas y registros de las pasadas reales están en [`capturas/fase2/`](capturas/fase2/). Hay imágenes de [biblioteca](capturas/fase2/biblioteca.png), [archivo](capturas/fase2/archivo.png), [invernadero](capturas/fase2/invernadero.png), [capilla](capturas/fase2/capilla.png), [sótanos](capturas/fase2/sotanos.png), [combate](capturas/fase2/combate-guardian.png), [cordura](capturas/fase2/cordura-5.png), [guardián derrotado](capturas/fase2/guardian-derrotado.png), [Firefox](capturas/fase2/firefox-invernadero.png) y [producción](capturas/fase2/produccion-invernadero.png).

## Rendimiento · Intel HD Graphics 620

Condiciones: Linux, Chrome con ANGLE OpenGL sobre **Intel HD Graphics 620 (KBL GT2)**, ventana 1280 × 720, calidad Baja, imagen interna 1024 × 576, enemigo activo, defensa sostenida, 600 intervalos `requestAnimationFrame` por sala y pasada. Se recogen FPS derivados de intervalos, P95/P99 de frametime, mínimo de ventana de 60 frames, tiempo GPU mediante temporizador WebGL asíncrono, tiempo de llamada a `renderer.render`, draw calls, triángulos y heap JS. Cada muestra dura unos diez segundos; no acredita FPS sostenidos durante una sesión larga.

Las primeras mediciones detectaron dos cuellos de botella reales. En el invernadero, tres luces locales sobre la vegetación produjeron 45,4–52,6 FPS en tres pasadas; limitar el perfil Bajo a una luz local mantuvo la visibilidad y produjo 58,6–59,6 FPS en tres pasadas aisladas, con tiempo GPU mediano reducido de 5,7–6,4 a 4,3–4,6 ms. En la capilla, la transmisión física de la vidriera duplicó aproximadamente las llamadas de dibujo (166 frente a 88); se sustituyó por vidrio translúcido y un material estándar. Las mediciones de la capilla variaron con la carga de la máquina, de 42,5 a 59,1 FPS. En la serie alternada final de capilla y biblioteca, ambas rondaron 43–46 FPS, lo que impide atribuir toda la variación al nivel. El objetivo de **45 FPS sostenidos no está demostrado**.

Los datos crudos están en [`rendimiento-invernadero-3luces.json`](capturas/fase2/rendimiento-invernadero-3luces.json), [`rendimiento-invernadero-1luz.json`](capturas/fase2/rendimiento-invernadero-1luz.json), [`rendimiento-capilla-vidriera.json`](capturas/fase2/rendimiento-capilla-vidriera.json) y [`rendimiento-capilla-pareada.json`](capturas/fase2/rendimiento-capilla-pareada.json). El archivo [`rendimiento.json`](capturas/fase2/rendimiento.json) contiene la última serie completa.

Última serie completa, tres pasadas consecutivas por sala bajo la carga observada al final de la sesión (mediana entre pasadas; el mínimo móvil es el peor de las tres):

| Sala | FPS por pasada | FPS mediano | P95 / P99 frametime | Mínimo móvil de 60 frames | GPU mediana | Draw calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Mansión | 38,7 / 39,2 / 39,8 | 39,2 | 33,4 / 50,0 ms | 35,6 FPS | 13,8 ms | 77 |
| Biblioteca | 46,7 / 44,3 / 45,3 | 45,3 | 33,4 / 49,9 ms | 40,0 FPS | 10,3 ms | 82 |
| Archivo | 45,0 / 44,8 / 44,8 | 44,8 | 33,4 / 50,0 ms | 39,6 FPS | 10,1 ms | 85 |
| Invernadero | 43,4 / 41,5 / 44,5 | 43,4 | 33,4 / 33,4 ms | 30,5 FPS | 10,6 ms | 76 |
| Capilla | 49,5 / 43,6 / 45,4 | 45,4 | 33,4 / 33,4 ms | 39,6 FPS | 10,0 ms | 88 |
| Sótanos | 45,3 / 44,3 / 44,5 | 44,5 | 33,4 / 49,9 ms | 39,6 FPS | 10,7 ms | 84 |

Los P95 y P99 se calcularon dentro de cada pasada y la tabla usa su mediana. No hubo errores de consola en las 18 ejecuciones. El descenso simultáneo de la mansión antigua y de la biblioteca respecto a las primeras pasadas impide presentar estas cifras como comparación causal antes/después. En particular, la sala antigua también cayó hasta 38,7 FPS; hacen falta sesiones emparejadas y control de carga del sistema para aislar cualquier regresión de Fase 2.

El heap JavaScript mediano por sala quedó entre 16,6 y 28,7 MiB; el contador de geometrías WebGL osciló entre 79 y 88 según la sala. Esos valores son instantáneas después de cargar una sola zona, no una prueba de fuga de memoria a lo largo de horas.

## Límites y siguiente trabajo

El alcance visual sigue siendo el de una producción independiente con geometría procedural y animación articulada: los rostros, vegetación y mobiliario son legibles y originales, pero aún no alcanzan la densidad o pulido de una producción comercial de GameCube. Los eventos de cordura se muestrean por condiciones y probabilidad; la prueba de navegador captura dos variantes, mientras que las doce se comprueban por reglas y arquitectura. Falta una sesión larga de juego y perfilado en otro equipo HD 620 para evaluar estabilidad sostenida. La validación física de mando, Windows y Edge requiere esos dispositivos y sistemas.
