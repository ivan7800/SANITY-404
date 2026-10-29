# Recuperación de la sesión F36–F39 · 29-10-2026

## Estado encontrado

- Rama `fix/f35-11-electron-windows`, commit `8d57c66`; árbol limpio antes de trabajar.
- El historial y los archivos del repositorio terminan en F35.11. No se encontró la «ORDEN MAESTRA FINAL» ni una especificación de F36–F39, ni commits o paquetes de esas fases.
- Por tanto, ninguna tarea concreta de F36–F39 puede acreditarse como completada o implementarse exactamente sin su texto.

## Verificaciones de esta recuperación

| Comprobación | Resultado |
| --- | --- |
| `npm ci --offline` y `npm ci --prefix desktop --offline` | PASS |
| `npm test -- --maxWorkers=1` | PASS: 311 pruebas, 72 archivos |
| `npm run build:web` | PASS |
| `npm run build:desktop:assets` | PASS |
| `npm run format:check` | PASS |
| `npm run audit:rooms` | PASS: 29 salas, 418 rutas, cero inaccesibles |
| `npm run verify:distribution` | PASS: siete archivos por destino |
| Linux AppImage y DEB | Generados; ASAR y metadatos DEB inspeccionados |
| ZIP Linux | Generado; `unzip -t` y `sha256sum -c` PASS |
| `npm run test:desktop:smoke` | Bloqueado al iniciar Electron: `sandbox_host_linux.cc`, `Operation not permitted`; no llegó al juego |
| Instalador NSIS Windows | No generado: la configuración local usa el Electron Linux; al desactivar esa ruta para la compilación cruzada, la descarga de Electron Windows falla con `getaddrinfo ENOTFOUND github.com` |

## Artefactos locales

- `desktop/release/SANITY-404-0.1.0-linux-x64.zip` — SHA-256 `80a9dc774f6684e8e21ed81a88f62d29d87c1e8f9a3176f89d7b1d7d2b70747a`.
- El ZIP contiene AppImage, DEB, `SHA256SUMS-linux.txt` y `README-linux.txt`. Los artefactos se conservan en `desktop/release/`, excluido de Git.
- No existe ZIP Windows nativo verificado. No se ha hecho push, merge, despliegue ni release.

## Pendiente

1. Incorporar el texto exacto de la orden F36–F39 para determinar y ejecutar sus tareas.
2. Generar y verificar el instalador Windows en un entorno con Electron Windows disponible, preferiblemente Windows x64; después crear el ZIP Windows con instalador, hashes y manifiesto.
3. Ejecutar el arranque y las pruebas nativas de los paquetes en un entorno que permita Electron; la compilación y las inspecciones estáticas no certifican la ejecución instalada.

**SANITY-404 no se declara completado.**

## Continuación tras recibir la orden definitiva

La orden posterior cambió el objetivo a ZIP web portables con servidor local; el ZIP Linux Electron mencionado arriba se conserva como artefacto histórico distinto. El desarrollo nuevo está en `portable/`, `INICIAR-SANITY-404.sh` y `INICIAR-SANITY-404.bat`. El ZIP portable Linux se genera en `portable/release/SANITY-404-Linux-x64.zip`. El ZIP portable Windows depende de una compilación nativa del servidor en el workflow manual; no se sustituye por un binario ficticio.
