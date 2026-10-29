# F35.6 · distribución Windows x64

## Estado comprobado

La ejecución Linux Mint de F35.4 del 29-10-2026 terminó **11/11 PASS, código global 0** en `capturas/fase35/linux-mint-2026-10-29T07-02-43Z/`. Incluye `game-systems` y restauración WebGL. Esto certifica ese preview local de Linux Mint, no un instalador Windows ni la URL remota.

La configuración de `desktop/package.json` fija Electron 45.1.0 y electron-builder 26.18.0 en `desktop/package-lock.json`; genera NSIS x64 con `--publish never`, `asar: true`, instalador asistido y directorio seleccionable. El ICO contiene 16/24/32/48/64/128/256 píxeles y el PNG es 512×512. `main.mjs` carga `sanity://game/index.html` desde `dist-desktop` con `contextIsolation`, sandbox, sin Node en el renderer y navegación externa denegada. `paths.mjs` limita los recursos al bundle y `before-build.cjs` solo omite recopilar módulos porque no hay dependencias de ejecución externas. El origen estable permite conservar `localStorage` entre arranques; Electron guarda los datos de sesión en `userData` por defecto. La prueba del runner comprueba guardado real y reapertura en Electron sin empaquetar; la persistencia del **EXE instalado** queda pendiente de Windows real.

El workflow `.github/workflows/distribution-verify.yml` es manual (`workflow_dispatch`) y usa `contents: read`. En Windows Server 2022 instala ambos lockfiles con `npm ci`, compila el bundle de escritorio, verifica recursos, ejecuta smoke de Electron y guardado/reapertura, crea NSIS x64, inspecciona `win-unpacked` y `app.asar`, exige un único EXE no vacío y calcula SHA-256. El artefacto contiene EXE, `SHA256SUMS.txt` y `build-manifest.json` con commit, runner, versiones, hashes de lockfiles, ASAR e instalador. Los logs y capturas QA se suben por separado. El runner y las acciones son versiones seleccionadas, pero la imagen `windows-2022` y las descargas transitivas pueden actualizarse; el manifiesto permite identificar los insumos de cada ejecución, no garantiza instaladores idénticos bit a bit.

## Límite de privacidad y ruta segura

El remoto actual es público. GitHub permite listar/leer artefactos de un repositorio público a quien pueda leerlo. Por eso el job Windows **falla antes de compilar y subir** si `github.event.repository.private` es falso. No hay EXE nuevo ni ejecución Actions en esta fase. No se debe quitar esa guarda ni descargar un instalador de una ejecución pública suponiendo que sea privado. GitHub exige además que el workflow exista en la rama predeterminada para poder lanzarlo manualmente.

Para obtener un EXE mediante GitHub Actions, usar una **copia independiente privada**, con los cambios aprobados ya incorporados a un commit. No usar `--mirror` ni `--tags`; el envío `HEAD:main` limita las referencias enviadas. Los comandos siguientes **son pasos futuros; no se han ejecutado aquí**. Sustituir `OWNER` y `REPO_PRIVADO`:

```bash
cd /ruta/al/clon/F35
git status --short
git rev-parse HEAD
# Tras autorización para incorporar y enviar los cambios relevantes:
gh repo create OWNER/REPO_PRIVADO --private --source=. --remote=windows-private
git push windows-private HEAD:refs/heads/main
gh repo view OWNER/REPO_PRIVADO --json isPrivate,defaultBranchRef --jq '{private: .isPrivate, branch: .defaultBranchRef.name}'
# Confirmar private=true y branch=main antes de continuar.
gh workflow run distribution-verify.yml -R OWNER/REPO_PRIVADO --ref main
gh run list -R OWNER/REPO_PRIVADO --workflow distribution-verify.yml --limit 5 --json databaseId,headSha,status,conclusion
# Sustituir RUN_ID por el ID recién creado:
gh run watch RUN_ID -R OWNER/REPO_PRIVADO --exit-status
gh run view RUN_ID -R OWNER/REPO_PRIVADO --json headSha,conclusion --jq '{commit: .headSha, result: .conclusion}'
mkdir -p windows-installer-private
gh run download RUN_ID -R OWNER/REPO_PRIVADO -n sanity-404-windows-nsis-x64 -D windows-installer-private
```

Comprobar que el `headSha` coincide con el commit enviado y que el resultado es `success`. `gh run download` extrae el artefacto indicado en el directorio local; no usar un nombre de artefacto de otra ejecución. Conservar el directorio descargado en almacenamiento privado. La alternativa sin Actions es compilar en un Windows x64 propio desde una copia del mismo commit con `npm ci`, `npm ci --prefix desktop`, `npm run build:desktop:assets`, `npm --prefix desktop run package:windows`, `npm run verify:windows-package`, y calcular `Get-FileHash desktop/release/*.exe -Algorithm SHA256`; el EXE permanece local. Ninguna de estas rutas requiere publicar una release.

## Comprobar la descarga en Windows

En PowerShell, dentro de `windows-installer-private`:

```powershell
$manifest = Get-Content .\build-manifest.json -Raw | ConvertFrom-Json
$parts = (Get-Content .\SHA256SUMS.txt -TotalCount 1) -split '\s+', 2
$expected = $parts[0].ToLowerInvariant()
$installer = $parts[1].Trim()
$actual = (Get-FileHash -LiteralPath (Join-Path (Get-Location) $installer) -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected -or $actual -ne $manifest.installerSha256 -or $installer -ne $manifest.installer) { throw 'EXE o manifiesto no coincide' }
$manifest | Format-List
Get-AuthenticodeSignature -FilePath (Join-Path (Get-Location) $installer)
```

El hash confirma los bytes descargados frente a los datos **de la misma ejecución**; no constituye por sí solo firma de código ni procedencia independiente. El instalador actual no declara certificado de firma. Registrar cualquier aviso de SmartScreen y no interpretar un aviso como prueba de malware ni de inocuidad.

## Aceptación en Windows x64 real

1. Registrar versión de Windows, arquitectura, usuario de prueba, commit del manifiesto, nombre y SHA-256 del EXE. Conservar el ZIP y el EXE originales.
2. Ejecutar el instalador asistido y anotar si se elige instalación por usuario o por máquina y el directorio. Confirmar acceso directo, icono y ejecutable instalado. No usar el EXE de `win-unpacked` como sustituto del instalador.
3. Abrir desde el acceso directo. Confirmar menú, recursos gráficos, audio y controles; iniciar partida y mover a Élise. Registrar capturas y cualquier error de renderer o recursos.
4. Interactuar con un punto de guardado real y confirmar «Memoria conservada». Cerrar la aplicación normalmente y reabrir desde el acceso directo; «Continuar» debe estar habilitado y devolver la posición, salud y progreso guardados.
5. Cerrar, desinstalar desde **Configuración → Aplicaciones → Aplicaciones instaladas → SANITY-404 → Desinstalar**. Confirmar que desaparecen la aplicación, el acceso directo y el directorio de instalación. Registrar si el perfil de usuario conserva el guardado; no borrar ese perfil durante la prueba sin copia previa.
6. Anotar resultado y evidencias por paso en la matriz QA. Si hay fallo, conservar instalador, hash, versión de Windows, captura y secuencia exacta. Solo declarar Windows certificado cuando instalación, ejecución, guardado/reapertura y desinstalación pasen en Windows real.

## Riesgos pendientes

| Riesgo | Estado | Cierre requerido |
| --- | --- | --- |
| EXE y hash Windows | Pendiente | Ejecutar workflow privado o build local Windows; verificar manifiesto y hash. |
| Instalación y desinstalación | Pendiente | Prueba manual del NSIS x64 en Windows real. |
| Persistencia del EXE instalado | Pendiente | Guardar, cerrar, reabrir y usar «Continuar» tras instalación. |
| Firma y reputación de Windows | Pendiente | Decidir firma antes de distribución general; registrar avisos del instalador sin firmado. |
| URL remota web | Pendiente | Validar después de un despliegue autorizado. |

Fuentes técnicas: [artefactos de GitHub Actions](https://docs.github.com/en/rest/actions/artifacts), [ejecución manual de workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow), [descarga con GitHub CLI](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts), [opciones NSIS](https://www.electron.build/docs/nsis/), [rutas de datos de Electron](https://www.electronjs.org/docs/latest/api/app).
