# Fase 23 · Menú cinematográfico

**Rama:** `fase11/campana-historica`. **Referencia inicial:** `b146bbb`. **Estado:** implementación y revisión visual inicial realizadas; prueba de interacción completa y publicación pendientes.

## Diseño implementado

- Portada original «La mansión que te observa»: vestíbulo Veyr de 1927, escalinata doble, ventanas de luna, lámparas, retratos y figura distante. Imagen generada con la herramienta integrada de imagen de Codex a partir de esta dirección artística; sin texto ni recursos de otras franquicias. Archivo final: `src/assets/menu-hall.webp`, 1672 × 941 píxeles y 124 KB. Prompt final: «Cinematic original video game main menu background plate, landscape wide 16:9. French gothic mansion entrance hall in 1927, monumental twin staircase and balcony, moonlight through pointed windows, bronze lamps, aged plaster, family portraits, faint human shadow high above, restrained cosmic unease. Deep navy charcoal and antique bronze palette. Left third dark, quiet for text overlay. Detailed atmospheric survival horror environment. No UI, no typography, no logo, no watermark.»
- `src/ui/menu-cinematic.css` compone imagen, viñeta, niebla, polvo, luz irregular y presencia lejana. Son capas CSS lentas, sin geometría ni luces WebGL adicionales. Se desactivan con `prefers-reduced-motion` y con la opción existente de movimiento reducido.
- El menú ofrece Nueva partida, Continuar y Opciones como acciones principales. Cargar partida, Volver al juego cuando corresponde y Créditos siguen disponibles y funcionales. Se conserva la disponibilidad de carga según el guardado. Título, subtítulo y lema solicitados están en HTML legible, no dentro de la imagen.
- Nueva partida usa un fundido de 440 ms solo cuando el movimiento está permitido; después llama al flujo original `begin(fresh())`. Continuar y Cargar mantienen la carga directa mediante `readSave()` y `begin()`.
- El audio del título reutiliza viento y zumbido sintetizados, con reloj y crujido espaciados. El contexto solo se inicia tras `pointerdown` o `keydown` del usuario; volumen cero y reducción de audio existentes se respetan. Los tonos terminados se desconectan mediante el sistema actual.

## QA ejecutado en este entorno

| Comprobación | Resultado |
| --- | --- |
| `npm test` | PASS, 251/251 en 52 archivos |
| `npm run build` | PASS; imagen WebP incluida en `dist/assets` |
| `npm run format:check` | PASS |
| `npm run audit:rooms` | PASS; 29 salas, 418 rutas y 0 inaccesibles |
| `SANITY_TEST_URL=... npm run test:ui` y `npm run test:phase23:browser` | Bloqueados antes de abrir la página: Chrome `crashpad setsockopt EPERM`, `SIGTRAP` en el sandbox. Firefox local terminó `SIGSEGV` antes de abrir página. No es evidencia de un fallo del menú. |

Un navegador de inspección independiente sí abrió Vite y permitió guardar una [captura real de la portada nueva a 881 × 793](capturas/fase23/menu-observado-881x793.png). La [captura anterior a 1440 × 900](capturas/remaster/menu-1440x900.png) sirve como comparación cualitativa, con la limitación de resoluciones diferentes. La inspección del árbol de accesibilidad descubrió que los números decorativos CSS se añadían al nombre de los botones; se corrigió con etiquetas ARIA explícitas y se confirmó que los tres nombres son exactamente «Nueva partida», «Continuar» y «Opciones». A 881 × 793 no hubo desbordamiento horizontal y la imagen de fondo se cargó. La herramienta de inspección bloqueó clics, teclas y cambio de tamaño por su política de permisos, por lo que **no** acredita interacciones, tableta ni móvil.

`scripts/browser-remaster.mjs` comprueba ahora imagen y textos, foco inicial y Tab, opciones, reducción efectiva de la animación tanto por la opción del juego como por `prefers-reduced-motion`, fundido de Nueva partida, Continuar con guardado real y disposiciones de escritorio, tableta y móvil. Respeta `SANITY_HARDWARE=1` mediante las opciones compartidas de lanzamiento del navegador; no fuerza SwiftShader en esa modalidad. Las capturas de tres resoluciones, ausencia de errores JavaScript durante navegación, comportamiento táctil y FPS en Intel HD Graphics 620 **pendientes de Linux Mint**.

Con Vite en el puerto 5174, ejecutar en el terminal real:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:phase23:browser
```

La campaña principal certificada desde Nueva partida en `docs/capturas/fase22/campana-completa-trace.json` corresponde a la versión de referencia; no se ha repetido tras esta modificación del menú. La reforma visual de las 29 salas sigue pendiente. No se declara GOLD MASTER ni calidad 9,5/10.
