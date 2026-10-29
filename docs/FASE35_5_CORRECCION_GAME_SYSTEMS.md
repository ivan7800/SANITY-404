# F35.5 · Corrección y diagnóstico de `game-systems`

## Hallazgo

En F35.4, `game-systems` superó puerta cerrada, pérdida de cordura y bloqueo de ruinas. Falló al esperar durante 30 segundos el botón «Reintentar» (`scripts/browser-systems.mjs:119` de aquella ejecución). El registro `docs/capturas/fase35/linux-mint-2026-10-29T06-44-15Z/game-systems.txt` solo contiene el timeout. Esa carpeta no contiene captura ni estado de la partida del fallo, por lo que no permite afirmar si el juego seguía activo, se pausó por pérdida de foco o no recibió el golpe.

El botón aparece únicamente cuando `state.health <= 0` y termina la animación de muerte de 0,85 segundos. Entonces se muestra el panel de derrota. Al pulsar «Reintentar», `begin(readSave() ?? fresh())` carga la última memoria válida, o una partida nueva si no la hay. `parseSave` rechaza salud 0, y `writeSave` valida antes de escribir: una derrota no debe sustituir el guardado válido.

El escenario anterior sembraba 12 de salud en `(3, -3)` de la mansión, cerca de la sombra, y daba por supuesta la derrota sin comprobar salud, foco, pausa ni guardado. Una prueba de simulación con el mapa y combate reales confirma que la sombra aparece en `(2, -3)` y un golpe mata a Élise desde ese escenario. Esto descarta un fallo estático de colocación o daño; **la causa concreta del timeout de Chrome de F35.4 sigue sin poder determinarse a partir del registro disponible**. La prueba ahora identifica por separado inicio, daño, muerte, botón y reinicio, y conserva el estado en el primer fallo.

## Cambios

- `scripts/browser-systems.mjs`: comprueba la partida activa con 12 de salud; trae Chrome al frente; espera salud 0 antes del botón; detecta una pausa intermedia como error de combate; exige «Reintentar» visible; pulsa el botón y comprueba salud 100, overlay cerrado y ubicación correcta.
- El combate activo usa un guardado de 12 de salud, pero antes del golpe se establece una memoria segura independiente con 100 de salud. La prueba compara el guardado completo antes y después de «Reintentar» para detectar corrupción y verifica que el reinicio recupera ese punto seguro. No se ha ampliado el timeout ni eliminado ninguna aserción previa.
- Ante un fallo, la prueba escribe `<prefijo>.json` y `<prefijo>.png`. El JSON incluye etapa, URL, visibilidad y foco del documento, panel, overlay, salud, cordura, ubicación, guardado, errores de página y de red; en desarrollo incluye `sanityInspect`.
- `scripts/phase35-linux-mint-qa.sh` dirige esos archivos al mismo directorio de evidencias de la ejecución.
- `tests/game-systems-death.test.ts` reproduce el escenario con el mapa y combate reales; comprueba el golpe mortal y que un estado con salud 0 no sustituye un guardado sano.

## Verificación local

- `npm test -- --reporter=dot`: **308 pruebas superadas, 71 archivos**.
- `npm run build:web`: **PASS**.
- `node --check scripts/browser-systems.mjs`, `git diff --check`: **PASS**.
- Chrome real en este sandbox: **bloqueado antes de abrir página** (`Crashpad setsockopt: Operation not permitted`, `SIGTRAP`). Esto reproduce la restricción de F35.4 y no valida el navegador.

## Prueba pendiente en Linux Mint normal

En un terminal gráfico fuera de Codex, desde el proyecto:

```bash
npm run build:web
./node_modules/.bin/vite preview --host 127.0.0.1 --port 5180 --strictPort
```

En otro terminal, con Preview activo:

```bash
cd /ruta/al/proyecto/SANITY-404-FASE11
CHROME_PATH="$(command -v google-chrome)" \
SANITY_HARDWARE=1 \
SANITY_TEST_URL=http://127.0.0.1:5180/SANITY-404/ \
SANITY_SYSTEMS_OUTPUT=docs/capturas/fase35/game-systems-f35-5-failure \
node scripts/browser-systems.mjs
```

El criterio de cierre es la salida 0 con `PASS daño, muerte y reintento` y el resto de comprobaciones. Si falla, conservar el JSON, PNG y registro íntegro. Salud 12 con overlay visible apunta a una pausa; salud 12 con overlay oculto apunta a combate sin golpe o simulación detenida; salud 0 sin botón apunta a la transición de derrota; botón presente y reinicio incorrecto apunta a la carga del guardado. Ejecutar también `SANITY_SKIP_NPM_CI=1 bash scripts/phase35-linux-mint-qa.sh` para repetir la validación completa de F35 después de confirmar `game-systems`.
