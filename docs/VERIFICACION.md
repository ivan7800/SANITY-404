# Registro de verificación — base 0.1.0

**Registro histórico.** La dirección vigente y las pruebas de la nueva sección de mansión se describen en [FASE1-REVISION.md](FASE1-REVISION.md). Las cifras y el recorrido de este documento corresponden a la base previa.

Fecha: 18 de octubre de 2026. Versión 0.1.0.

## Resultados obtenidos

- `npm run build`: TypeScript estricto y Vite completados. Distribución aproximada de 508 KiB; JavaScript principal de unos 504 kB sin comprimir / 131 kB gzip. No depende de CDNs durante la ejecución.
- `npm test`: **23 pruebas aprobadas** en cuatro archivos. Persistencia y entradas inválidas; límites de salud y cordura; colisiones con paredes y muebles; deslizamiento; enfriamiento de ataques; persecución y daño; enemigos derrotados; tónicos y agotamiento; rutas de los cinco escenarios; sellos; mando simulado con zona muerta y flancos de pulsación.
- Chrome real automatizado con Playwright y SwiftShader: **recorrido completo aprobado**, mediante teclado y botones de interfaz. Nueva partida, movimiento, guardar, cargar, inventario, foco de teclado, documentos, llave, puertas, biblioteca, tres puzles, cripta, capilla, ruinas y final. Ningún error JavaScript en ese recorrido.
- Captura de la escena inspeccionada visualmente. Se corrigió la cámara inicial situada detrás de una pared. Las pruebas de geometría detectaron y permitieron corregir rutas obstruidas por altar y pilares.
- Se corrigió la reaparición de tónicos consumidos y se dividió la simulación en subpasos para conservar colisiones y velocidad con frecuencias de renderizado bajas.

## Cobertura por fase

| Fase           | Contenido implementado                                                         | Evidencia actual                                                          |
| -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1 Base         | Personaje, cámara, habitación, luces, colisiones, objeto, enemigo, indicadores | Compilación, lógica, captura y movimiento/interacción real                |
| 2 Exploración  | Cinco habitaciones, puertas, inventario y mapa                                 | Recorrido completo y pruebas de rutas                                     |
| 3 Combate      | Persecución, daño, bastón, recuperación y animación procedural                 | Pruebas de combate y reglas de supervivencia                              |
| 4 Cordura      | Pérdida y recuperación, percepción, luz lenta y silueta                        | Pruebas de estado; revisión de implementación y opción reducida           |
| 5 Narrativa    | Cinco documentos, tres puzles y dos finales                                    | Diario y puzles en recorrido real                                         |
| 6 Sonido       | Drone armónico y efectos sintetizados                                          | Implementación Web Audio iniciada en Chrome; audición subjetiva pendiente |
| 7 Controles    | Teclado, ratón, mando, menús, volumen, resolución, reducción de efectos        | Teclado real y mando simulado; hardware de mando pendiente                |
| 8 Optimización | Resolución limitada, recursos liberados al cambiar escena, niebla y subpasos   | Build, recuento de distribución y recorrido; benchmark físico pendiente   |
| 9 Contenido    | Campaña corta con cinco escenarios y resolución                                | Recorrido hasta final; no es una campaña comercial extensa                |
| 10 Publicación | Build estático, base relativa y workflow Pages                                 | Preparado en disco; no publicado, sin remoto configurado                  |

La tabla refleja la cobertura de la versión integrada. No es una certificación histórica de diez entregas independientes ni una puntuación de calidad.

## Entorno y límites

Node.js 24.22.0, TypeScript, Vite y Chrome instalado en Linux. La prueba del navegador usa renderizado por software, resolución reducida y esperas basadas en fotogramas. Acredita funcionalidad, no 60 FPS ni rendimiento de GPU. Los primeros intentos de recorrido necesitaron ajustes de sincronización y hubo una interrupción del navegador del entorno; el recorrido final registrado terminó con éxito.

No hay pruebas físicas de mando, validación en Edge, perfil de memoria de larga duración, auditoría completa de lectores de pantalla ni evaluación con jugadores. No se acredita una nota de 9,5/10.

## Criterios para una edición comercial

- Completar matrices de Chrome/Firefox/Edge en Windows y Linux con GPU real.
- Medir FPS, percentiles de tiempo de fotograma, memoria tras 30 minutos y transiciones repetidas.
- Verificar accesibilidad con teclado, lector de pantalla y mandos físicos de al menos dos fabricantes.
- Evaluar claridad de objetivos, tensión, combate y puzles con participantes externos.
- Ampliar trabajo artístico, variedad de enemigos y niveles antes de considerar esta entrega equivalente al objetivo comercial.

## Comprobaciones adicionales completadas

`node scripts/browser-systems.mjs` aprobó en Chrome: puerta bloqueada sin llave, coste de cordura de una respuesta incorrecta, bloqueo de las ruinas sin tres sellos, daño mortal y reintento, segundo desenlace con cordura baja y configuración de efectos reducidos. Cero errores JavaScript en estos casos. Estas pruebas parten de partidas de ensayo explícitas y complementan el recorrido completo sin sustituirlo.

Firefox instalado: arranque sin interfaz con `--screenshot`, salida 0, captura `/tmp/sanity404-firefox.png` inspeccionada. El menú y sus textos se muestran. No se automatizó el recorrido jugable en Firefox. Edge no está disponible en este entorno.
