# Fase 34 · preparación de publicación de desarrollo

Estado: **preparado para revisión; ningún archivo añadido al índice de Git**. Rama local `fase11/campana-historica`, remoto `origin` = `ivan7800/SANITY-404`, rama por defecto remota `main`, repositorio público. Esta preparación no hace commit, push, merge ni despliegue.

## Selección exacta

- `FASE34_PUBLICACION_INCLUIR.txt`: todos los archivos modificados o nuevos propuestos para el próximo commit. Cada línea es una ruta literal relativa a la raíz. Los archivos ya rastreados que no han cambiado siguen en el repositorio sin aparecer en esta lista.
- `FASE34_PUBLICACION_EXCLUIR.txt`: todos los archivos modificados o nuevos que quedan fuera del commit propuesto. Las rutas ignoradas masivas se resumen abajo porque `node_modules` y los builds contienen miles de archivos generados.

La selección incluye **125 rutas**: código, pruebas nuevas, `desktop/package-lock.json`, documentación F26–F34 y 29 evidencias QA concretas (25 nuevas y cuatro ya rastreadas, saneadas). Entre las nuevas hay 15 archivos enlazados desde documentación F30–F34, nueve capturas visuales seleccionadas y el recorrido de guardado Electron. Las trazas incluidas sustituyen la ruta absoluta local por `<workspace>`; los comandos de documentación usan una ruta genérica. Las capturas repetidas, intentos fallidos redundantes y dos archivos sueltos de salida accidental quedan fuera. Los siete PNG rastreados de F23 modificados y el JSON generado `docs/RESCATE_SALAS_DATOS.json` conservan su versión ya publicada, sin incorporar su modificación actual. El manifiesto de exclusión contiene **358 rutas**.

## Ignorados por `.gitignore`

`node_modules/`, `desktop/node_modules/`, `dist/`, `desktop/dist-desktop/`, `desktop/release/`, `desktop/release-*/`, `test-results/`, `playwright-report/`, `coverage/`, `.vite/`, `.cache/`, `.local-backups/`, `tmp/`, `temp/`, `*.tsbuildinfo`, perfiles locales, `.env*` salvo `.env.example`, claves, certificados, credenciales, logs y temporales del editor. Nueve logs QA citados en F30–F32 tienen excepciones explícitas y rutas locales saneadas.

## Workflows

- `pages.yml`: ahora solo `workflow_dispatch`; un push a `main` no inicia Pages automáticamente. La configuración remota de Pages informa `build_type: workflow`.
- `verify-pr.yml`: PR contra `main` ejecuta pruebas y navegador; no despliega.
- `distribution-verify.yml`: ejecución manual; compila NSIS solo en repositorio privado y sube artefacto de ejecución. **El remoto actual es público**, así que su job Windows se detendrá en la guarda de privacidad hasta usar un repositorio privado o decidir otro tratamiento del artefacto. No se deben eliminar esa guarda ni declarar Windows certificado sin instalación nativa.

## Riesgos pendientes

1. El fallo de timeout de producción web sigue **PENDIENTE**. El smoke corto local pasó, pero no demuestra estabilidad de una ejecución larga ni de GitHub Pages; véanse `FASE34_WEB.md` y `FASE34_MATRIZ_QA.md`.
2. La compilación Windows y la ejecución del instalador NSIS en Windows real siguen pendientes. El workflow no podrá producir el EXE privado en el remoto público actual.
3. Las evidencias seleccionadas suman 34,3 MB de los 35,1 MB propuestos; tres trazas JSON grandes concentran la mayor parte. Se seleccionan porque los informes técnicos enlazan directamente a ellas; revisar su conveniencia antes de autorizar el commit.
4. La confirmación manual Linux no vinculó los hashes probados a los bytes actuales de los instaladores.
5. La rama de trabajo no es `main`; incorporar cambios a `main` requerirá una acción posterior explícita. Pages permanece manual.
6. Siete archivos rastreados ya contenían rutas de usuario. La copia de trabajo las sanea; las versiones antiguas siguen en el historial remoto de Git. El lanzador `.desktop` ahora resuelve el shell respecto a su propia ubicación y usa un icono genérico; pasó `desktop-file-validate`, pero conviene comprobar su apertura gráfica en Linux Mint.

## Verificaciones

Se creó una copia en `/tmp` con `git archive HEAD` y únicamente las 125 rutas del manifiesto de inclusión, sin `node_modules` ni builds. `npm ci --offline --no-audit --no-fund` instaló 57 paquetes raíz; `npm ci --prefix desktop --offline --no-audit --no-fund` instaló 283. En esa copia pasaron `npm run build:web`, `npm run build:desktop:assets`, `npm run verify:distribution` y **307/307 pruebas unitarias** en 70 archivos. No se construyó un instalador en esta comprobación.

La búsqueda de patrones de claves privadas, tokens GitHub/OpenAI, claves AWS/Google, correos personales y rutas de usuario en los 125 archivos seleccionados no encontró coincidencias. El mismo patrón detectó siete archivos rastreados preexistentes con rutas locales; se sanearon en la copia de trabajo y se incluyen en el manifiesto. No se encontraron enlaces de evidencia QA rotos entre los informes F30–F34 y la selección propuesta. Los PNG seleccionados no contenían bloques de metadatos `tEXt`, `iTXt` o `eXIf` en la revisión básica.
