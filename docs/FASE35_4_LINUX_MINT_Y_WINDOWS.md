# F35.4 · Validación fuera del sandbox y Windows

**Actualización del 29-10-2026:** la ejecución en un terminal normal de Linux Mint terminó con **11/11 PASS y código 0**. Evidencia: `capturas/fase35/linux-mint-2026-10-29T07-02-43Z/exit-codes.tsv`, `game-systems.txt` y `webgl/resultado.json`. El diagnóstico de bloqueo que sigue corresponde únicamente al sandbox. Para la distribución Windows actualizada, consultar [FASE35_6_DISTRIBUCION_WINDOWS.md](FASE35_6_DISTRIBUCION_WINDOWS.md).

## Diagnóstico del entorno Codex

En la sesión aislada, `/proc/self/status` informó `NoNewPrivs: 1`, `Seccomp: 2` y cero capacidades efectivas. Una escucha TCP mínima devolvió `listen EPERM` tanto en `127.0.0.1` como en `0.0.0.0`. Chrome 156 terminó antes de abrir una página: `Crashpad setsockopt: Operation not permitted`, `SIGTRAP`. Es **probable** que el aislamiento cause ambos síntomas. La confirmación exige repetir las mismas pruebas en un terminal normal de Linux Mint. No se ha atribuido ninguno de estos fallos al juego ni se han desactivado sus comprobaciones.

## Comando recomendado en Linux Mint

Abrir un terminal **fuera de Codex**, dentro de la sesión gráfica de Linux Mint, y ejecutar:

```bash
cd /ruta/al/proyecto/SANITY-404-FASE11
bash scripts/phase35-linux-mint-qa.sh
qa_exit=$?
printf 'F35.4 exit=%s\n' "$qa_exit"
```

El script ejecuta `npm ci`, compila la web, calcula SHA-256 de los recursos, inicia `vite preview` en `127.0.0.1:5180`, comprueba `http://127.0.0.1:5180/SANITY-404/`, selecciona Google Chrome real con `SANITY_HARDWARE=1`, y ejecuta el smoke de producción, escenarios de juego, 50 navegaciones, 20 navegaciones con GC y pérdida/restauración de WebGL. Continúa con las pruebas independientes si una falla. Guarda `exit-codes.tsv`, registros `.txt`, HTML/cabeceras, JSON y capturas en `docs/capturas/fase35/linux-mint-<fecha UTC>/`. Devuelve código 1 si falla alguna etapa. Solo termina el proceso Preview que él inició. Para usar dependencias existentes: `SANITY_SKIP_NPM_CI=1 bash scripts/phase35-linux-mint-qa.sh`. Para otro Chrome: `CHROME_PATH=/ruta/a/google-chrome bash scripts/phase35-linux-mint-qa.sh`.

## Comandos individuales para reproducir un fallo

Terminal 1:

```bash
cd /ruta/al/proyecto/SANITY-404-FASE11
npm ci
npm run build:web
./node_modules/.bin/vite preview --host 127.0.0.1 --port 5180 --strictPort
```

Terminal 2, con Preview activo:

```bash
cd /ruta/al/proyecto/SANITY-404-FASE11
curl --noproxy '*' -fsS -D /tmp/sanity-f35-headers.txt -o /tmp/sanity-f35-index.html http://127.0.0.1:5180/SANITY-404/
grep -F '/SANITY-404/assets/' /tmp/sanity-f35-index.html
export CHROME_PATH="$(command -v google-chrome)"
export SANITY_HARDWARE=1
export SANITY_TEST_URL=http://127.0.0.1:5180/SANITY-404/
node scripts/phase34-web-production-smoke.mjs; printf 'smoke exit=%s\n' "$?"
node scripts/browser-systems.mjs; printf 'systems exit=%s\n' "$?"
SANITY_NAV_RUNS=50 SANITY_NAV_OUTPUT=/tmp/sanity-f35-navigation-50.json node scripts/phase35-web-navigation.mjs; printf 'navigation exit=%s\n' "$?"
SANITY_FORCE_GC=1 SANITY_NAV_RUNS=20 SANITY_NAV_OUTPUT=/tmp/sanity-f35-navigation-gc.json node scripts/phase35-web-navigation.mjs; printf 'navigation GC exit=%s\n' "$?"
SANITY_WEBGL_OUTPUT=/tmp/sanity-f35-webgl node scripts/phase35-webgl-production.mjs; printf 'WebGL exit=%s\n' "$?"
```

`SANITY_HARDWARE=1` abre Chrome con la GPU de la sesión gráfica. No equivale a `SANITY_SOFTWARE=1`. Si un paso falla, conservar el JSON, la captura y el registro íntegro; anotar paso, duración, GPU, URL y hora. Un PASS del preview local no certifica automáticamente GitHub Pages.

## Instalador Windows x64 NSIS

`.github/workflows/distribution-verify.yml` conserva `workflow_dispatch` como único disparador y `contents: read` como único permiso. El job Windows se detiene si el repositorio no es privado. Instala ambos lockfiles con `npm ci`, compila web y escritorio, verifica el bundle, ejecuta los smoke nativos de Electron y la prueba de guardado/reapertura, crea NSIS x64 con `--publish never`, inspecciona `win-unpacked` y `app.asar`, exige un único EXE no vacío y genera `SHA256SUMS.txt`. Conserva evidencias de QA en un artefacto separado del instalador. El workflow no despliega Pages, no crea release y no se ha ejecutado en esta revisión.

La revisión local comprobó que `desktop/package.json` fija Electron 45.1.0 y electron-builder 26.18.0 mediante `desktop/package-lock.json`, no declara dependencias de ejecución, usa `app.asar` y `dist-desktop`, icono ICO con 16/24/32/48/64/128/256 píxeles e icono PNG de 512 píxeles. `sanity://game` es un origen estable; el guardado usa `localStorage` en ese origen. El smoke de Windows prueba el guardado real y la reapertura en el runner; sigue siendo imprescindible instalar y jugar con el EXE en Windows x64 real antes de certificar esa plataforma.

El repositorio público no supera la condición de privacidad del workflow. Para generar el artefacto privado hará falta ejecutar manualmente el workflow desde una copia privada que contenga estos cambios. Incorporar cambios al remoto o ejecutar Actions requiere autorización posterior; ninguna de esas operaciones se hizo aquí.
