# Fase 28 · auditoría de jugabilidad y sistemas

**Estado: abierta.** Rama `fase11/campana-historica`, HEAD inicial `3396c2b`. Se preservaron cambios locales de Fases 26 y 27, incluidos scripts, capturas y documentos sin publicar. No hubo commit ni push.

## Sistemas inspeccionados y evidencia

| Sistema                       | Inspección                                                                                                                                                                                      | Estado y límite                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Movimiento y controles        | `Input`, `main.update`, `simulationDeltaSeconds`, `mansionMove` y colisiones. WASD y diagonal se normalizan; el movimiento usa tiempo real subdividido y barrido físico. Pausa limpia entradas. | Regresiones existentes; no se cambió movimiento. La respuesta subjetiva, mando y táctil tras Fase 27 requieren navegador real.                          |
| Combate                       | `Combat.update`, `strikeClear`, armas, anticipación, defensa, esquiva y recuperación.                                                                                                           | Se añadió regresión de golpes de jugador y enemigo bloqueados por una pared alta. No se cambiaron daño ni ventanas. Combate manual con Viuda pendiente. |
| IA                            | Ruta y deslizamiento de Viuda, detección por línea de visión, ataque tras anticipación.                                                                                                         | La regresión determinista del atril pasa, pero la última prueba real falló por muestreo tardío. Fase 26 sigue abierta.                                  |
| Inventario, curación y muerte | `drinkTonic`, panel de inventario y rama de muerte.                                                                                                                                             | F28-001 reproducido y corregido: el tónico ya no reanima a 0 PS ni se pierde. F28-002 impide cerrar la pantalla de muerte con teclas de reanudar.       |
| Cordura                       | Eventos condicionados por sala, lectura, umbral y ajustes de accesibilidad; gasto por error de puzle y daño.                                                                                    | Código y regresiones existentes revisados. No se midió coste GPU de efectos ni claridad jugada.                                                         |
| Guardado y carga              | `parseSave` valida salud 0–100, IDs y progreso; `writeSave` utiliza localStorage y avisa si falla.                                                                                              | Prueba dirigida conserva tónicos y estado tras recarga. No hay nueva prueba real de guardado tras F28-001.                                              |
| Cámara                        | Encuadres clásicos/modernos y corrección de oclusión ya presentes.                                                                                                                              | No se modificó. Falta revisión dinámica del combate con la Viuda.                                                                                       |

## Puzles de los doce capítulos: inventario de código

| Capítulo      | Mecanismo y prueba requerida                                                                        | Comprobación actual                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Lucius 189    | Inscripción romana tras formación y marca de Varro; centurión y tablilla.                           | `campaign.ts`, tests de campaña y traza histórica anterior.                                                    |
| Aurelia 312   | Patrón de teselas con cinabrio; custodio y molde.                                                   | `attemptMosaicPattern`, tests de campaña y traza anterior.                                                     |
| Maeve 537     | Corrección del registro de mareas; custodio y lista.                                                | `correctCoastLedger`, tests de campaña y traza anterior.                                                       |
| Samira 783    | Alineación del astro en tres pasos; vigilante y disco.                                              | `starAlignmentStep`, tests de campaña y traza anterior.                                                        |
| Idris 1092    | Montaje del arco en tres pasos; obrero y plano.                                                     | `assembleQuarryArch`, tests de campaña y traza anterior.                                                       |
| Oona 1217     | Identificar remedio, defender testimonio y elegir Ada o Bran.                                       | `identifyHospitalRemedy`, tests de campaña y traza anterior.                                                   |
| Isabelle 1348 | Inscripción del scriptorium; sombra y códice.                                                       | `main.ts`, tests de campaña y traza anterior.                                                                  |
| Tomás 1491    | Tres planchas ordenadas tras dos pruebas; cajista y plancha auténtica.                              | `late-chapters.ts`, regresiones de cuatro épocas y traza anterior.                                             |
| Inés 1610     | Inventario, árbol y retrato en tres pasos; guardián y acta.                                         | Igual.                                                                                                         |
| Amara 1786    | Contrapesos grave, mudo y agudo; autómata y partitura.                                              | Igual.                                                                                                         |
| Émile 1899    | Superposición de negativos y fijado; sombra y placa.                                                | Igual.                                                                                                         |
| Élise 1927    | Caja astronómica, sellos y decisión persistente; desenlace histórico condicionado por once pruebas. | `phase2.ts`, `historicalEndingReadiness`, traza anterior. Final alternativo exige prueba independiente actual. |

La tabla identifica reglas y evidencia previa, **no es una nueva certificación jugada de los doce puzles**. Los estados de error, la claridad de pistas y posibles bloqueos tras guardar deben verificarse de nuevo en navegador tras los cambios locales.

## Corrección prioritaria

Antes del cambio, la regresión de 0 PS falló: `drinkTonic` devolvía `used`, curaba 40 PS y retiraba el objeto. El motor procesaba H antes de comprobar la rama de muerte; la interfaz también permitía pulsar el botón si había tónicos. Ahora la función rechaza el consumo a 0 PS, el botón se deshabilita y el panel de muerte no se cierra mediante Espacio, Escape o Tab. La prueba dirigida cubre el objeto intacto a 0 PS; los tests existentes cubren salud baja, cordura cero, duplicados y guardado. La regresión de pared alta verifica que ningún ataque de los dos combatientes causa daño a través del sólido.

## Verificación y pendientes

Verificación de la tanda F28: `npm test -- --maxWorkers=1` **268/268 PASS**, `npm run build` PASS, `npm run format:check` PASS y `npm run audit:rooms` **29 salas, 418 rutas, cero inaccesibles**. A diferencia de intentos anteriores con `crashpad EPERM`, `test:browser` sí inició Chromium con SwiftShader en el sandbox y confirmó WebGL y Nueva partida, pero **falló** después durante la navegación de la mansión: sala 0, x=2,72268, z=3,29009, salud 0, tras aproximadamente 44 segundos simulados. Ese resultado no certifica Intel HD 620 ni demuestra por sí solo un defecto de navegación; requiere reproducción en Linux Mint con aceleración real. Comandos con Vite en 5174:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:browser
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_PHASE26_WIDOW_OUTPUT=docs/capturas/fase26/viuda-linux-mint npm run test:phase26:widow:browser
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_PHASE26_BENCHMARK_OUTPUT=docs/capturas/fase26/viuda-benchmark-intel.json npm run benchmark:phase26:widow
```

Siguientes prioridades: (1) validar la Viuda y su cámara en Chromium real, (2) medir Medio/Bajo en Intel HD 620, (3) repetir campaña y finales tras Fases 26–28. **No se declara Fase 28 completa ni GOLD MASTER.**
