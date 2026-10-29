# F35.7 · selección para el commit Windows privado

La rama de origen auditada es `fase11/campana-historica`, sobre `2064fa3ffc73085dfddb4c2093ccb65bac83ca2a`. La validación F35 de Linux Mint concluyó 11/11 PASS. Este commit reúne la corrección WebGL, la regresión de sistemas, los scripts de producción, la revisión de distribución Windows y los informes F35.

## Alcance seleccionado

- Código y configuración: `src/main.ts`, `scripts/browser-systems.mjs`, `scripts/phase35-linux-mint-qa.sh`, `scripts/phase35-web-navigation.mjs`, `scripts/phase35-webgl-production.mjs`, `scripts/verify-windows-package.mjs`, `tests/game-systems-death.test.ts`, `package.json`, `.github/workflows/distribution-verify.yml` y la referencia F35 de `README.md`.
- Informes: `docs/FASE35_INFORME_FINAL.md`, `docs/FASE35_4_LINUX_MINT_Y_WINDOWS.md`, `docs/FASE35_5_CORRECCION_GAME_SYSTEMS.md`, `docs/FASE35_6_DISTRIBUCION_WINDOWS.md`, este registro y las actualizaciones de `docs/FASE34_MATRIZ_QA.md` y `docs/FASE34_WINDOWS.md`.
- Evidencia mínima del 11/11: `exit-codes.tsv`, `bundle-sha256.txt`, `production-smoke.txt`, `game-systems.txt`, `navigation-50.txt`, `navigation-gc-20.txt` y `webgl/resultado.json` de `docs/capturas/fase35/linux-mint-2026-10-29T07-02-43Z/`.

Se excluyen `node_modules`, `dist`, `desktop/dist-desktop`, `desktop/release*`, cachés, temporales, capturas PNG, trazas JSON voluminosas y registros con rutas del equipo. También se excluyen las capturas F22–F34 no relacionadas, los siete PNG F23 modificados, `docs/RESCATE_SALAS_DATOS.json` regenerado por la auditoría y dos archivos accidentales con nombres truncados. Los informes F35 usan una ruta de ejemplo en sus comandos, sin el directorio personal del equipo.

## Verificaciones realizadas

- `npm test -- --maxWorkers=1`: 308/308, 71 archivos.
- `npm run format:check` y `npm run audit:rooms`: PASS; 29 salas, 418 rutas, cero inaccesibles.
- `npm run build:web`, `npm run build:desktop:assets` y `npm run verify:distribution`: PASS; siete archivos por destino.
- YAML del workflow: sintaxis válida, disparador solo manual, token `contents: read`, barrera de repositorio privado y pasos NSIS/ASAR/manifiesto presentes.
- `node --check` de scripts F35, `bash -n` del runner y `git diff --check`: PASS.

## Limitación del árbol principal

La carpeta `.git` del workspace es de solo lectura: `git add` devolvió `Unable to create .git/index.lock: Read-only file system`. El commit F35 se prepara en un clon local aislado bajo `/tmp`, en una rama propia, sin modificar `main`, el índice original ni ningún remoto. El SHA y el estado exacto de ese clon se entregan al terminar.

## Próxima compilación Windows, sin ejecutarla aquí

Usar la copia privada y los comandos de [F35.6](FASE35_6_DISTRIBUCION_WINDOWS.md): verificar `isPrivate=true`, lanzar `distribution-verify.yml` desde la rama predeterminada, comprobar que la ejecución corresponde al SHA de este commit, descargar **solo** el artefacto `sanity-404-windows-nsis-x64` por ID y contrastar EXE, `SHA256SUMS.txt` y `build-manifest.json`. Después instalar, guardar, reabrir y desinstalar en Windows x64 real. Crear la copia remota, enviar el commit y lanzar Actions quedan pendientes de autorización posterior.
