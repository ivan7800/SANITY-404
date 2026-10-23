# Fase 11 · validación y publicación

Registro del 23 de octubre de 2026 en `fase11/campana-historica` (HEAD `7dc59ccc41d3cb7556c36381c27d69d46451fa62`). `origin` usa `https://github.com/ivan7800/SANITY-404.git` para lectura y escritura. No se modificaron `main`, la PR #14 ni los respaldos.

## Comprobaciones superadas

| Comprobación ejecutada                                | Resultado                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                            | 24 archivos y 103 pruebas aprobadas. Incluye la migración de guardados v1 a v2 y las condiciones de la secuencia romana.                                                                                                                          |
| `npm run format:check`                                | Correcto.                                                                                                                                                                                                                                         |
| `npm run build`                                       | TypeScript y Vite correctos. Bundle `dist/assets/index-Dbjo5yp0.js`.                                                                                                                                                                              |
| `git diff --check`                                    | Correcto antes de redactar este registro.                                                                                                                                                                                                         |
| Chrome DevTools, apertura de `http://127.0.0.1:5173/` | El menú y el canvas cargaron. Las 44 solicitudes observadas respondieron 200 o 304; la consola mostró solo los dos mensajes de conexión de Vite, sin errores. [Captura del menú](capturas/fase11/menu.png). Esto acredita únicamente el arranque. |
| REA 6.5.0                                             | El servidor respondió con paquete y versión 6.5.0. Analizó estáticamente el bundle generado; evidencia `ev_835fd1399ef072f56ec8e39f07e5e4075fa83382200631cf767b0d006e095d50`. El grafo es parcial y no acredita ejecución, interacción ni FPS.    |

## Pendiente o bloqueado

| Comprobación                                                                                                        | Estado y causa                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorrido continuo del piloto romano: inicio, exploración, puzle, combate, cordura, epílogo y guardado tras recarga | **Pendiente.** La revisión automática del conector Chrome rechazó el clic en «Nueva partida» (`MCP tool call requires approval, but approval policy is never`). `npm run test:browser` terminó antes de abrir la página: Chrome 156 iniciado por Playwright salió con `SIGTRAP` tras `crashpad ... setsockopt: Operation not permitted`. El intento directo de Chrome reprodujo el fallo. No se observaron ni corrigieron defectos del piloto en ejecución. |
| Guardados antiguos en Chrome                                                                                        | **Pendiente.** La prueba unitaria de migración v1 pasó, pero no sustituye cargar un guardado antiguo en navegador y verificar sus acciones.                                                                                                                                                                                                                                                                                                                 |
| GPU física, exploración, combate y cordura en Roma                                                                  | **Pendiente.** No existe `/dev/dri` en este proceso y `glxinfo -B` no puede abrir el display `:0`; no se anotan FPS de software como rendimiento físico.                                                                                                                                                                                                                                                                                                    |
| Publicación de la rama y PR independiente                                                                           | **Pendiente.** El requisito previo de recorrido interactivo satisfactorio no se ha acreditado. No se ejecutó `git push` ni se creó una PR.                                                                                                                                                                                                                                                                                                                  |

## Reproducción desde el escritorio con Chrome y GPU Intel

Desde la raíz del proyecto, en una sesión gráfica con acceso a `/dev/dri`:

```bash
npm run dev -- --host 127.0.0.1
```

En otra terminal, confirmar primero `glxinfo -B` y el nombre de la GPU. Repetir la ruta del piloto mediante el menú y los controles reales; guardar en el escritorio de memoria, recargar la página y pulsar «Continuar». Comprobar también un guardado v1 existente. Registrar capturas en `docs/capturas/fase11/`, sin sobrescribir respaldos. Ejecutar la batería histórica y las mediciones físicas, cada escenario por separado y sin otras pruebas gráficas en paralelo:

```bash
npm run test:browser
node scripts/browser-historical.mjs
node scripts/performance-phase10.mjs --headed --hardware --only=189:exploration --seconds=60 --output=docs/capturas/fase11/roma-exploracion.json
node scripts/performance-phase10.mjs --headed --hardware --only=189:combat --seconds=60 --output=docs/capturas/fase11/roma-combate.json
node scripts/performance-phase10.mjs --headed --hardware --only=189:psychological --seconds=60 --output=docs/capturas/fase11/roma-cordura.json
```

`browser-historical.mjs` recorre hitos con guardados de ensayo; tampoco sustituye el recorrido continuo desde «Nueva partida». El script de rendimiento comprueba el identificador WebGL antes de aceptar datos de GPU física. Comparar la peor ventana de 60 fotogramas con el umbral de 45 FPS y revisar los errores de consola registrados en cada JSON. Solo después de aprobar el recorrido interactivo corresponde preparar la publicación de esta rama y una PR independiente.
