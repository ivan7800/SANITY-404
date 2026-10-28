# Fase 27 · auditoría arquitectónica y primera reforma

**Estado: abierta.** Rama `fase11/campana-historica`, HEAD al inicio `3396c2b`. Se conservaron los cambios locales de Fase 26 y capturas ajenas. No se hizo commit ni push. La biblioteca es el primer sector reformado; las demás salas permanecen bajo auditoría.

## Referencia y selección

Se inspeccionaron `World`, los módulos arquitectónicos por época, [los planos de 29 salas](planos/datos.json), la [reforma anterior](REFORMA_ARQUITECTONICA_29_SALAS.md) y la [captura anterior de biblioteca](capturas/reborn/survey-2026-10-27T11-55-04-748Z/sala-01.png). La imagen muestra cuatro bloques de estantería cuya masa negra y libros frontales repetidos dominan la composición. Biblioteca fue priorizada porque es un espacio principal de 1927 y su defecto visual es directamente visible. La señal de 0,00 m entre `medieval-scriptorium` y un obstáculo en sala 9, y 1,04–1,09 m de despeje junto a dos portales de sala 0, quedan en el registro para comprobación física: la distancia de plano **no demuestra por sí sola** un bloqueo.

La auditoría de Fase 26 sigue abierta: la Viuda tiene una regresión física determinista, pero falta repetir la prueba real tras el cambio de muestreo; 12,71 FPS en una traza breve de perfil Medio no son benchmark definitivo. Esta reforma no toca IA, campaña, guardado ni Fase 26.

## Plano y reforma de biblioteca, sala 01

[Plano de planta propio](planos/fase27-biblioteca.svg): recinto 16 × 16 m; entrada `x=0, z=7`, salida `x=0, z=-7`, archivo `x=6,7, z=0`, capilla `x=-6,7, z=-5,3`, manuscritos `x=2,4, z=-1`, sello `x=0, z=-4,5` y guardado `x=-2, z=5`. Cuatro armarios permanecen centrados en `x=±5, z=-2,2` y `x=±5, z=2,8`, cada uno con huella 1,0 × 3,4 m y altura 3,4 m. El eje central y las zonas de interacción siguen libres según la geometría; falta recorrerlos después de la reforma en Chromium. La cámara representativa y posiciones de captura corresponden al script `browser-reborn-survey.mjs` con `SANITY_SURVEY_ROOMS=1`.

`src/world/library-cabinetry.ts` sustituye las cajas macizas por estructura de roble con baldas, zócalo, molduras de bronce y lomos de cuero instanciados. Las piezas no exceden la huella física original. `World` añade los cuatro colisionadores explícitos con IDs; los objetos, puertas y puzles siguen en la misma posición. El cuerpo rígido se combina por material; los lomos usan cuatro grupos de instancias. No se han añadido luces, transparencias ni dependencias.

## Pruebas y límites

La regresión `phase27-library-cabinetry.test.ts` comprueba las cuatro huellas, más de 300 lomos dentro de ellas, espacio central libre y presencia de `archive-door`, `library-shortcut` y `manuscripts`. `architecture-circulation.test.ts` conserva el despeje de los accesos. La auditoría de salas y la suite completa deben confirmar conectividad y progresión estática, sin reemplazar recorrido jugado.

| Verificación de esta tanda | Resultado |
| --- | --- |
| `npm test -- --maxWorkers=1` | **266/266 PASS**, 56 archivos; incluye la nueva regresión. |
| `npm run build` | **PASS**, TypeScript y Vite. |
| `npm run format:check`, `git diff --check` | **PASS** después de dar formato al script de capturas. |
| `npm run audit:rooms` | **PASS**, 29 salas, 418 rutas, cero inaccesibles; se restauró el JSON local previo tras ejecutarla. |
| Captura de biblioteca en sandbox | **No ejecutada**: Chrome salió con `crashpad setsockopt EPERM` y `SIGTRAP` antes de crear página. No hay imagen posterior válida. |

**Capturas comparativas:** existe [antes](capturas/reborn/survey-2026-10-27T11-55-04-748Z/sala-01.png); el después desde la misma entrada y cámara normal está pendiente. El sandbox no inicia Chrome por `crashpad EPERM`. Ejecutar en Linux Mint con Vite en 5174:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_SURVEY_ROOMS=1 npm run test:reborn:survey
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:browser
```

El primer comando crea una carpeta fechada en `docs/capturas/reborn/` con `sala-01.png` y métricas. Revisar el encuadre, libros, umbrales, colisiones, selección de objetos y cámara antes de considerar el sector validado. El segundo comprueba navegación y mecánicas del navegador; no certifica por sí solo el aspecto visual.

**Rendimiento:** no hay comparación antes/después equivalente de biblioteca en Intel HD 620. La captura anterior es de otra fecha y no sirve como benchmark. El coste estático se limita por combinación e instancias, pero FPS, p95, draw calls y GPU posteriores deben medirse en Linux Mint bajo las mismas condiciones. No se afirma mejora de rendimiento.

**Próximo sector prioritario:** sala 9, claustro, por señal de despeje de `medieval-scriptorium` de 0,00 m; verificar si el obstáculo es parte del propio acceso o un mueble adyacente antes de reformar. La mansión y el combate con la Viuda mantienen prioridad de validación real.
