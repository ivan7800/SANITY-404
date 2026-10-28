# Fase 34 · matriz QA

Fecha de cierre: 28-10-2026. `PASS manual` recoge la confirmación del usuario; `PASS automatizado` indica ejecución de una prueba; `PENDIENTE` no equivale a fallo.

| Comprobación                                                 | Estado                       | Evidencia y alcance                                                                                                                                                           |
| ------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suite unitaria                                               | PASS automatizado            | `npm test -- --maxWorkers=1`: 307/307, 70 archivos, en esta revisión.                                                                                                         |
| Compilación web y escritorio                                 | PASS automatizado            | `build:web`, `build:desktop:assets`, `verify:distribution`; HTML y recursos referenciados presentes.                                                                          |
| Formato y mapa                                               | PASS automatizado            | `format:check`; `audit:rooms`: 29 salas, 418 rutas, cero inaccesibles.                                                                                                        |
| AppImage Linux                                               | PASS manual                  | El usuario confirma instalación/ejecución funcional. Archivo y hash actuales en `FASE34_LINUX.md`; no se atribuye este resultado al smoke automatizado.                       |
| Instalador DEB Linux                                         | PASS manual                  | El usuario confirma instalación/ejecución funcional. Archivo y hash actuales en `FASE34_LINUX.md`.                                                                            |
| Guardado real en Electron                                    | PASS automatizado comunicado | Prueba nativa de guardado: PASS, código 0, según el usuario.                                                                                                                  |
| Cierre, reapertura y «Continuar»                             | PASS manual comunicado       | El usuario confirma recuperación de la partida.                                                                                                                               |
| Campaña histórica                                            | PASS comunicado              | Campaña completa confirmada por el usuario.                                                                                                                                   |
| Regresión de navegador en desarrollo                         | PASS comunicado              | Confirmada por el usuario; distinta del preview de producción.                                                                                                                |
| Rutas absolutas del equipo en instaladores Linux             | PASS inspección estática     | AppImage y DEB extraídos; sin coincidencias de `/home/<usuario>/`, ruta del proyecto ni `C:\\Users\\<usuario>` en nombres o bytes extraídos.                                  |
| Instalador NSIS Windows x64                                  | PENDIENTE                    | Workflow preparado; no ejecutado, sin EXE ni hash.                                                                                                                            |
| Ejecución Windows del EXE                                    | PENDIENTE                    | Instalar y probar en Windows real; generar el EXE en CI no certifica ejecución.                                                                                               |
| Web de producción: base y recursos                           | PASS automatizado            | Build y `verify:distribution`; base `/SANITY-404/`, siete archivos presentes.                                                                                                 |
| Web de producción: navegación, guardado, recarga, consola JS | PASS automatizado            | `phase34-web-production-smoke.mjs` contra preview local: menú, recursos, Nueva partida, movimiento, guardado real, recarga, «Continuar», sin errores JS ni recursos fallidos. |
| Fallo de timeout de producción web                           | PENDIENTE                    | Fallo comunicado; el smoke local corto no la reproduce ni la cierra. Repetir con URL, duración y traza antes de certificar estabilidad.                                       |
| Web remota GitHub Pages                                      | PENDIENTE                    | No desplegada en esta fase.                                                                                                                                                   |
| F33: cambio de perfil durante combate                        | PENDIENTE                    | Riesgo previo conservado.                                                                                                                                                     |

## Lista de aceptación

### Windows

- [ ] Workflow manual en repositorio privado: suite, builds, NSIS x64, EXE no vacío, SHA-256 y artefacto de ejecución.
- [ ] Hash descargado coincide con `SHA256SUMS.txt`.
- [ ] Instalación y apertura del EXE en Windows x64 real; menú, recursos, controles, audio y gráficos sin errores.
- [ ] Guardar una partida real, cerrar, reabrir y recuperar mediante «Continuar».
- [ ] Desinstalación y ausencia de errores JavaScript o del proceso principal.

### Linux

- [x] AppImage y DEB ejecutados manualmente, según confirmación del usuario.
- [x] Guardado real y recuperación tras reapertura, según confirmación del usuario.
- [x] Tamaño, SHA-256 e inspección de rutas de desarrollo registrados.
- [ ] Registrar si se requiere una comprobación adicional de GPU, audio o periféricos concretos en la máquina de destino.

### Web

- [x] Base `/SANITY-404/` y recursos de producción verificados en el build.
- [x] Preview de producción: menú, navegación, guardado, recarga, «Continuar» y consola sin errores.
- [ ] Repetir en la URL remota después de un despliegue autorizado.
