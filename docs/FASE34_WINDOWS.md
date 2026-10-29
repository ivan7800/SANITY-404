# Fase 34 · Windows

**Actualización F35.6:** el procedimiento vigente, incluido `build-manifest.json`, la copia privada y la aceptación del instalador, está en [FASE35_6_DISTRIBUCION_WINDOWS.md](FASE35_6_DISTRIBUCION_WINDOWS.md). Esta sección conserva el plan original de F34.

El workflow `.github/workflows/distribution-verify.yml` queda preparado para una ejecución **manual** (`workflow_dispatch`). Usa Ubuntu 24.04 para pruebas y verificación de bundles, y Windows Server 2022 para repetir pruebas, compilar web/escritorio y generar NSIS **x64**. Usa Node 22.16.0, acciones con versión exacta y `npm ci` con ambos lockfiles. `electron-builder` usa `--publish never`.

El job Windows exige que el repositorio sea **privado** antes de compilar o subir el EXE. Un artefacto de Actions en un repositorio público puede descargarse por quien tenga acceso de lectura; por ello un artefacto de ejecución no sería realmente privado allí. El workflow falla con un mensaje explícito si se lanza desde un repositorio público. No se usa secreto adicional. El permiso del token es `contents: read`. No hay pasos de commit, push, Pages ni release.

Tras compilar, el workflow exige exactamente un `*.exe` no vacío en `desktop/release/`, calcula SHA-256 y crea `SHA256SUMS.txt`. Sube ambos al artefacto `sanity-404-windows-nsis-x64` con retención de 14 días. **No se ha ejecutado el workflow; no existe un EXE verificado ni un hash Windows.** Generar un EXE en CI tampoco demuestra que instale o funcione en Windows.

## Pasos para obtener el instalador cuando se autorice Actions

1. Incorporar estos cambios al branch remoto de un repositorio **privado**. El archivo del workflow debe existir en la rama por defecto para que GitHub muestre «Run workflow».
2. En GitHub: **Actions → Verify distribution packages → Run workflow**; seleccionar el branch que contiene estos cambios y ejecutar. Alternativa: `gh workflow run distribution-verify.yml --ref <rama>` desde ese repositorio privado.
3. Esperar a que pasen los jobs `web` y `windows`. En la ejecución, descargar `sanity-404-windows-nsis-x64` desde **Artifacts**.
4. En Windows, descomprimir el artefacto y comparar el EXE con `SHA256SUMS.txt` (`Get-FileHash -Algorithm SHA256 '.\\SANITY-404 Setup 0.1.0.exe'`). Registrar el nombre real emitido por NSIS si difiere.
5. Instalar el EXE en Windows x64 real y completar la lista de aceptación de `FASE34_MATRIZ_QA.md` antes de declarar Windows certificado.

El envío de cambios al remoto y la ejecución del workflow quedan fuera de esta entrega por las restricciones de la fase.
