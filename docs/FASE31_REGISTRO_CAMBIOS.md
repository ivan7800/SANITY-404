# Fase 31 · registro de cambios

| ID | Cambio real | Archivos | Riesgo y límite |
|---|---|---|---|
| EXP-01 | El paso se emite solo si la posición física cambia tras `mansionMove` o `move`; una tecla mantenida contra un sólido queda en silencio, mientras un deslizamiento lateral conserva el sonido. | `src/main.ts`, `src/systems/audio.ts`, `tests/audio-footstep.test.ts` | No cambia velocidad, colisiones ni animación. Escucha manual pendiente. |
| EXP-02 | Se asignó a cada una de las 29 salas un timbre de superficie usando el sintetizador existente. Sigue habiendo **una voz por paso**; la escalera mantiene los 63 Hz originales exigidos por su regresión. | `src/systems/audio.ts`, `tests/audio-footstep.test.ts` | La correspondencia estética debe revisarse con auriculares y geometría visible. |
| EXP-03 | La galería alta deja de activar el sonido de peldaños: `onMansionStair` identifica únicamente la rampa física entre las dos cotas. | `src/world/mansion.ts`, `src/main.ts`, `tests/mansion-vertical.test.ts` | No altera altura, navegación ni colisión. Comprobar en juego el límite entre último escalón y rellano. |
| EXP-04 | El aviso contextual indica la acción por clase de interactivo: leer, recoger, guardar, decidir, observar, continuar o examinar. Si el nombre ya dice la acción (`Leer documento`, `Escritorio · guardar`), no duplica el verbo y conserva el nombre íntegro. Las puertas se anuncian como «examinar» porque pueden estar bloqueadas. | `src/ui/interaction-prompt.ts`, `src/main.ts`, `tests/interaction-prompt.test.ts`, `scripts/browser-remaster.mjs` | El objeto seleccionado y su interacción no cambian. La nueva comprobación de navegador y la lectura móvil siguen pendientes. |

Durante la primera suite, una prueba antigua detectó que el timbre de escalera había pasado de 63 a 72 Hz. Se restauró 63 Hz antes de la verificación final; no se rebajó la expectativa de la prueba. No se tocaron campaña, guardados, combate, inventario ni equilibrio.
