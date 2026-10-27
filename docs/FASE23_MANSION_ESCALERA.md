# Mansión Veyr · vestíbulo, escalera y galería

**Rama:** `fase11/campana-historica`. **Base visual:** `b1148aa`. **Estado:** reforma geométrica implementada y comparada en navegador; recorrido físico con controles en Linux Mint pendiente. No publicada.

## Generación y cotas

La carcasa de la sala 0 procede de `src/world/scene.ts`; la escalera, la galería, barandillas y carta, de `src/world/mansion.ts`; la bóveda y el orden de las arcadas, de `src/world/mansion-architecture.ts`. `src/world/mansion-topology.ts` define ahora las cotas compartidas. `src/world/mansion-navigation.ts` delimita la planta superior y el paso por la escalera; `src/engine/camera.ts` selecciona los encuadres de juego.

| Elemento | Coordenadas o dimensión real del motor |
| --- | --- |
| Vestíbulo base | 16 × 16 m; suelo y = 0 |
| Escalera | x = 3,72…6,28; z = −1,55…−5,11; ancho 2,56 m; subida 2,64 m en 3,56 m |
| Descansillo | x = 3,72…6,28; z = −5,11…−6,48; cota +2,64 m |
| Galería norte | x = −6,55…6,35; z = −6,65…−4,50; ancho de circulación 2,15 m antes de muros y barandilla |
| Sala de retratos / observatorio | x = −6,55…−3,45 / −3,35…0,65; z = −5,50…−1,35 |
| Techo anterior | arranque +4,71 m; altura en eje de escalera x=5 ≈ +5,29 m |
| Techo reformado | arranque +5,72 m; altura en x=5 ≈ +6,33 m; altura libre desde galería ≈ 3,69 m |
| Carta astral | panel x=4,35, z=−6,54, y=4,03; atril interactivo `gallery-chart` x=4,35, z=−6,10 |

[Plano de planta](planos/mansion-veyr-planta.svg) · [Sección vertical](planos/mansion-veyr-seccion.svg). Los planos muestran cotas del código y rutas de circulación; no representan todos los elementos decorativos.

## Diagnóstico y reforma

El techo original dejaba unos 2,65 m desde la galería hasta la bóveda sobre la escalera. La cámara alta comprimía aún más esa distancia. La carcasa exterior terminaba en +5,00 m y la bóveda arrancaba en +4,71 m, por lo que sus líneas de remate no formaban un conjunto coherente. Se elevaron carcasa, friso, apoyos y bóveda antes de tocar materiales o luces. No se añadieron luces ni sombras.

La carta anterior ocupaba un panel de 2,5 m junto al costado de la escalera, con balaustres y postes en el mismo campo visual. Su atril interactivo estaba separado de esa representación. El panel actual es un tramo de la barandilla norte, por encima del atril existente, y se reservaron posiciones de balaustre a partir de x=5,28. Las capturas indican que la superposición era principalmente **visual**; el panel anterior no tenía un colisionador propio. Se conservan el ID `gallery-chart`, su texto, su posición de interacción y las reglas de progresión.

Las dos barandillas de la escalera tenían un poste por peldaño y un pasamanos con pendiente menor que la subida del suelo. Se redujo la repetición de postes, se reemplazaron los remates redondos y el pasamanos sigue ahora la pendiente 2,64/3,56. La ruta desde el último escalón hacia el oeste permanece libre por z≈−5,2. La galería conserva sus dos accesos, el atril, el escritorio superior y los portales existentes.

## Inspección visual

Se capturaron seis pares reales en navegador desde posiciones y cámaras idénticas. El proyecto de referencia se extrajo de `b1148aa` en una carpeta temporal, sin alterar este árbol. Ambas versiones usan exclusivamente el modo de fotografía de QA, que oculta personaje y enemigo para dejar ver la arquitectura; no sirve como evidencia de combate o campaña. También se conservan las seis vistas anteriores con la cámara normal en `capturas/fase23/mansion-escalera/antes/`.

| Vista | Antes | Después |
| --- | --- | --- |
| Pie de escalera | [WebP](capturas/fase23/mansion-escalera/antes-controlada/pie.webp) | [WebP](capturas/fase23/mansion-escalera/despues-controlada/pie.webp) |
| Mitad de escalera | [WebP](capturas/fase23/mansion-escalera/antes-controlada/mitad.webp) | [WebP](capturas/fase23/mansion-escalera/despues-controlada/mitad.webp) |
| Último escalón | [WebP](capturas/fase23/mansion-escalera/antes-controlada/ultimo-escalon.webp) | [WebP](capturas/fase23/mansion-escalera/despues-controlada/ultimo-escalon.webp) |
| Centro del descansillo | [WebP](capturas/fase23/mansion-escalera/antes-controlada/descansillo.webp) | [WebP](capturas/fase23/mansion-escalera/despues-controlada/descansillo.webp) |
| Galería hacia el vestíbulo | [WebP](capturas/fase23/mansion-escalera/antes-controlada/galeria-hacia-vestibulo.webp) | [WebP](capturas/fase23/mansion-escalera/despues-controlada/galeria-hacia-vestibulo.webp) |
| Pasillo hacia habitaciones | [WebP](capturas/fase23/mansion-escalera/antes-controlada/pasillo-hacia-habitaciones.webp) | [WebP](capturas/fase23/mansion-escalera/despues-controlada/pasillo-hacia-habitaciones.webp) |

La comparación muestra más aire sobre la escalera, menos repetición en las barandillas y una carta legible sin montantes delante. La galería conserva una proporción estrecha y algunas vistas de juego pueden incluir al enemigo de la planta superior delante del personaje. Esas situaciones requieren revisión jugando; las fotografías aisladas no las resuelven ni certifican.

## Pruebas y pendiente

`tests/mansion-upper.test.ts` recorre con el motor físico la subida, los giros, las dos salas y la bajada; también comprueba la nueva altura libre y la separación entre panel y balaustres. `scripts/browser-mansion-stair.mjs` prepara la reproducción con teclado real, lectura de la carta y recorrido de ida y vuelta; parte de un punto de diagnóstico en el pie de la escalera y no modifica progreso de campaña. Ejecutar con Vite en 5174:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:mansion:stair:browser
```

`npm test`: 253/253 pruebas aprobadas; `npm run build`, `npm run format:check` y `npm run audit:rooms`: aprobados. La primera pasada de Vitest agotó dos límites de 5 s mientras estaban abiertos dos Vite y dos escenas WebGL; al cerrar esa carga, la pasada completa terminó sin fallos. El [intento del nuevo recorrido Playwright](capturas/fase23/mansion-escalera/sandbox-intento/recorrido.json) desde el sandbox terminó antes de abrir página por `crashpad setsockopt EPERM` y `SIGTRAP`, sin ejecutar movimiento.

Pendiente: resultado de ese recorrido en Chromium real, capturas con cámara normal después de la reforma, inspección de enemigos y comprobación de FPS en Intel HD Graphics 620. Hasta entonces la zona permanece **sin certificación jugable final**.
