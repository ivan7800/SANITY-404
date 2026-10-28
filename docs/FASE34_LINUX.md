# Fase 34 · Linux

El usuario confirma que el AppImage y el instalador DEB generados funcionan manualmente. También confirma guardado real en Electron (PASS, código 0) y recuperación mediante «Continuar» tras cerrar y reabrir. Estas son confirmaciones de ejecución nativa comunicadas por el usuario, separadas de las comprobaciones automatizadas de esta revisión.

## Inventario de paquetes presentes

| Paquete   | Ruta                                                 |     Bytes | SHA-256                                                            |
| --------- | ---------------------------------------------------- | --------: | ------------------------------------------------------------------ |
| AppImage  | `desktop/release/SANITY-404-0.1.0.AppImage`          | 125981327 | `f7ae05312bf5485d44cd012fea956443b7c9cf4c61c34d95bf4a6a42f4fd84b3` |
| DEB amd64 | `desktop/release/sanity-404-desktop_0.1.0_amd64.deb` | 101368164 | `c1b6c1ec4a79cb22430916931cbc6a1acb0263fc4e790c089db12be8538e8a22` |

Los hashes se calcularon con `sha256sum` el 28-10-2026. Son de los archivos actuales en `desktop/release/`; reconstruirlos puede cambiar sus hashes. La confirmación manual del usuario no incluía hashes, así que no se puede demostrar retrospectivamente que los bytes probados sean exactamente estos. Hay AppImages de depuración anteriores en otros directorios, que no se usan como referencia de este cierre.

Se extrajo el AppImage mediante `--appimage-extract` y el DEB mediante `dpkg-deb -x`. La búsqueda en los nombres y bytes extraídos no encontró `/home/<usuario>/`, `<ruta-del-repositorio>` ni `C:\\Users\\<usuario>`. La inspección estática de rutas no sustituye el arranque nativo que ya confirmó el usuario.

## Repetición y aceptación

```bash
sha256sum desktop/release/SANITY-404-0.1.0.AppImage desktop/release/sanity-404-desktop_0.1.0_amd64.deb
npm run test:desktop:smoke
npm run test:desktop:save
```

Para un nuevo build: `npm ci`, `npm ci --prefix desktop`, `npm run build:linux`. Probar cada paquete real en Linux Mint: menú, Nueva partida, guardado, cierre, reapertura y «Continuar»; registrar GPU, audio y controles si se necesita certificar ese hardware concreto.
