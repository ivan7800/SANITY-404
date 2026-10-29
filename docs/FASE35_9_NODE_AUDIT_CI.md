# F35.9 · auditoría de salas compatible con Node del runner

## Causa

El job `web` de `distribution-verify.yml` (run `40836816536`) usa Node 22.16.0 y ejecuta `npm run audit:rooms` después de `npm ci` y las pruebas. `scripts/audit-rooms.mjs` ya cargaba las escenas y sistemas TypeScript mediante `server.ssrLoadModule` de Vite, pero sus importaciones estáticas de `phase22-navigation.mjs` y `phase22-dynamic-audit.mjs` se resolvían antes de crear ese servidor. Ambos módulos importan `src/systems/collision.ts` directamente con el cargador ESM de Node; Node 22.16.0 devuelve `ERR_UNKNOWN_FILE_EXTENSION` para esa ruta. El Linux Mint local usó Node 22.23.3, cuya eliminación de tipos está activada, y por eso no reveló el fallo.

La solución carga también esos dos auxiliares con `server.ssrLoadModule`. Toda la cadena TypeScript de la auditoría pasa por el transformador explícito de Vite, ya fijado por el lockfile en la versión 7.3.7. Esa versión declara soporte para Node `>=22.12.0`. No se modifica la lógica del juego, ni se omite la auditoría, ni se añade una excepción silenciosa o una dependencia nueva. El workflow conserva Node 22.16.0 y su paso `audit:rooms`.

## Reproducción y validación

Antes de la corrección, con Node 22.23.3 y la eliminación automática de tipos desactivada:

```bash
NODE_OPTIONS=--no-experimental-strip-types npm run audit:rooms
```

Resultado: `ERR_UNKNOWN_FILE_EXTENSION` en `src/systems/collision.ts`, igual que en CI. Después de la corrección, el mismo comando termina con **29 salas, 418 rutas y cero inaccesibles**. Esta prueba elimina la dependencia de la función de Node que difiere entre 22.16 y 22.23; el ejecutable exacto 22.16.0 no está instalado en este entorno, por lo que la repetición en Actions sigue pendiente.

Verificaciones locales: `npm test -- --maxWorkers=1` (**308/308, 71 archivos**), `npm run format:check` (PASS), `npm run build:web` (PASS), `npm run build:desktop:assets` (PASS), `npm run verify:distribution` (PASS, siete recursos por destino), validación YAML del workflow (PASS), `node --check scripts/audit-rooms.mjs` (PASS) y `git diff --check` (PASS). La auditoría regenera `docs/RESCATE_SALAS_DATOS.json`; ese archivo derivado no forma parte de la corrección.

## Alcance y siguiente ejecución

Archivos del commit: `scripts/audit-rooms.mjs` y este informe. El workspace privado original está fuera del área de escritura de esta sesión; la corrección y el commit local se preparan en un clon aislado bajo `/tmp`, sin push ni ejecución remota. Para comprobar el arreglo en CI, incorporar posteriormente ese commit al repositorio privado y lanzar manualmente `distribution-verify.yml` desde la rama que lo contenga. El job web debe superar `audit:rooms` antes de que empiece Windows. La instalación real del EXE continúa pendiente de Windows x64.
