# Fase 19 — Guía de prueba manual en Linux Mint (30–45 minutos)

Esta prueba requiere una persona que juegue y escuche con auriculares o altavoces. **No se ha ejecutado como validación humana**. La duración es una estimación; si un encuentro no aparece en 45 minutos, anótalo como incompleto y conserva el guardado. No uses guardados manipulados, DevTools ni ajustes de depuración para dar por superada la prueba.

## Preparación e inicio (3–5 min)

1. En una terminal de Linux Mint, ejecuta los siguientes comandos desde el clon:

   ```bash
   cd ~/Proyectos/SANITY-404-FASE11
   git switch fase11/campana-historica
   ./INICIAR-SANITY-404.sh --check
   ./INICIAR-SANITY-404.sh
   ```

   Si `--check` indica que faltan dependencias, ejecuta `npm ci` y repite los dos comandos del lanzador. Para abrir la URL manualmente, consulta `./INICIAR-SANITY-404.sh --status` y ábrela en Chrome o Chromium. Al terminar, ejecuta `./INICIAR-SANITY-404.sh --stop`.

2. Usa un perfil de navegador cuyo guardado puedas conservar. En **Opciones**, selecciona calidad **Baja** para Intel HD 620, cámara **Clásica**, volumen cómodo (por ejemplo, 0,35–0,50) y deja desactivada la opción «Reducir sonidos intensos y susurros» para evaluar el lamento. Apunta versión del navegador, resolución, salida de audio y volumen. Ajusta volumen por seguridad si resulta molesto.
3. Elige **Nueva partida** si quieres iniciar desde cero. Esta acción no borra el guardado anterior, pero una nueva grabación lo sustituye; usa un perfil separado si debes preservar una partida personal. Abre las herramientas de desarrollador solo para anotar errores de consola, sin modificar el estado del juego.

**Controles:** WASD o flechas para moverse, Shift para correr, E para interactuar, Espacio o clic izquierdo para ataque ligero, J o clic derecho para fuerte, F para defender, V para esquivar, H para tónico, M para mapa, Tab para inventario y Esc para pausa. El progreso se guarda al interactuar con un escritorio de memoria; no hay guardado automático.

## Recorrido y observaciones

| Tiempo orientativo | Acción | Qué comprobar y registrar |
| --- | --- | --- |
| 0–8 min | Recorre el vestíbulo de la **planta baja**. Mira puertas, escalera y objetivos con cámara clásica; abre el mapa y prueba al menos una ruta lateral y su regreso. Acércate al escritorio de memoria y guarda con E. | Identifica cada puerta antes de llegar a ella; anota marcos que tapen la vista, cambios bruscos de cámara, pistas ocultas y cualquier error. Confirma el texto «Partida guardada». |
| 8–14 min | Sube por la escalera del muro este hacia la **planta superior**. Detente en dos peldaños y en el rellano. Escucha el lamento antes de acercarte a la Viuda. | ¿Se oye una vez, parece venir del rellano y cambia de intensidad con la distancia? ¿Hay silencio útil antes o después? Registra volumen percibido, localización, repeticiones, cortes y si tapa señales de ataque. Evita llamar «validado» al sonido sin escribir una valoración humana. |
| 14–22 min | En la galería, observa al **Huésped Inmóvil** desde el frente, gira la cámara o sal de su línea de visión y vuelve a mirarlo. Entra en la sala de retratos al oeste para encontrar el **Folio del rellano**. En la zona occidental, busca al **Reptante**. | El Huésped debe avanzar o variar la pose al perderlo de vista; no debe atacar sin aviso. Comprueba silueta, orientación, visibilidad del aviso y espacio para defenderse. Para el Reptante, prueba esquiva y defensa; registra cualquier atasco en paredes o puertas. |
| 22–30 min | Vuelve al rellano y enfrenta o evita a la **Viuda del Rellano**. Recorre el observatorio central. Si la cordura cae por debajo de 55 antes de recoger la carta, busca al **Reflejo Equivocado**; también puede aparecer abajo con cordura menor de 32. | Contrasta dirección aparente del lamento con la aparición. El Reflejo debe separarse visualmente de Élise y permitir leer el ataque; anota si se superponen o si una alucinación corta la ruta. Si la cordura no baja de forma natural, marca este encuentro «no alcanzado» y continúa. |
| 30–38 min | Recoge la **Carta de la raíz** en el observatorio. Con Folio y Carta en inventario, busca allí a **La Raíz de los Nombres**, el quinto enemigo, y combate usando F, V, Espacio y J. Usa un tónico si hace falta. | Comprueba sus fases, avisos, ventana de defensa, cámara y visibilidad de Élise, enemigo y pistas. Registra si una muerte permite reintentar desde el guardado sin bloqueo. No consideres el jefe verificado si no se llega al combate. |
| 38–45 min | Guarda en el **Escritorio del rellano**; vuelve al título o recarga la pestaña y pulsa **Continuar**. Baja de nuevo a la planta baja y vuelve a subir. | Comprueba planta, ubicación, objetos, enemigos derrotados y salud/cordura tras cargar. Verifica que el lamento no se repite indebidamente si la Viuda ya fue derrotada y que las rutas siguen transitables. |

El orden de aparición depende de posición, objetos y cordura. Si mueres, carga el último escritorio, anota el tiempo perdido y continúa. No dañes deliberadamente a Élise solo para forzar una condición de cordura: anota lo que no se pudo observar en esta sesión.

## Registro de resultados

Para cada encuentro, anota **hora, planta y lugar, salud y cordura aproximadas, estado de guardado, resultado y captura opcional**. Usa estas preguntas breves:

- **Cámara y navegación:** ¿entendiste por dónde seguir?, ¿alguna puerta o pista quedó oculta?, ¿la cámara permitió ver y defender cada ataque?
- **Audio:** ¿dónde percibiste la Viuda?, ¿fue audible a volumen normal?, ¿hubo silencios tensos o repeticiones molestas? Describe lo oído, no solo «correcto/incorrecto».
- **Miedo:** ¿qué anticipaste antes de cada aparición?, ¿qué momento te inquietó más y por qué?, ¿algún susto fue confuso o injusto?
- **Fiabilidad:** registra errores de consola, congelamientos, caídas de FPS sostenidas, colisiones, bloqueos de progreso y pasos para repetirlos. Si hay error, conserva captura, hora y copia del mensaje, sin incluir datos privados del perfil.

Marca cada punto como **aprobado, fallo o no observado**. La validación humana solo puede cerrarse después de esta sesión y de revisar sus notas. El arranque automatizado de `browser-phase10.mjs` permanece incompleto en el entorno técnico por `crashpad: setsockopt EPERM`; esta guía no sustituye esa regresión Playwright ni la medición larga de rendimiento.
