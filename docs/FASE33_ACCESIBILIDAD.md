# Fase 33 · accesibilidad

## Estado previo

El juego ya tenía reducción de movimiento, destellos, distorsión y audio, volumen, foco visible, controles táctiles y preferencias persistentes. F31 obtuvo 26/26 comprobaciones UI en Linux Mint según el usuario; ese resultado precede a F33. Los textos de diario y HUD usan en varios casos 9–13 px y no existía una opción de tamaño.

## Cambio funcional

`Texto ampliado en diario, avisos y HUD` guarda `largeText` con el resto de preferencias. La clase `html.large-text` aplica 16 px a texto de paneles, botones, avisos, objetivo y diario, y eleva etiquetas del HUD a 13 px. La opción entra en vigor al aplicarla y se restaura al recargar. Los guardados de juego no cambian; preferencias antiguas sin `largeText` siguen usando el tamaño anterior.

Las pruebas unitarias verifican lectura de ajustes nuevos, antiguos e inválidos. `scripts/browser-phase33-accessibility.mjs` prueba mediante controles reales, en 390 × 844: cambio de texto y perfil, persistencia tras recarga, tamaño computado del HUD y diario, contención del panel, nueva partida y conservación del estado al cambiar de Bajo a Medio. La [ejecución nativa Intel](capturas/fase33/accesibilidad-intel/accesibilidad.json) terminó con **7/7 PASS**, cero errores JavaScript y capturas. La inspección visual humana de legibilidad y superposiciones continúa pendiente. El intento del sandbox permaneció BLOCKED por crashpad EPERM.
