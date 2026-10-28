import { constants, accessSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const desktopRoot = fileURLToPath(
  new URL("../desktop/", import.meta.url),
);
const desktopRequire = createRequire(path.join(desktopRoot, "package.json"));

export function resolveElectronExecutable(
  load = () => desktopRequire("electron"),
) {
  let executable;
  try {
    // Electron 45 obtains its binary lazily when its module is loaded.
    executable = load();
    if (typeof executable !== "string" || !path.isAbsolute(executable)) {
      throw new Error("el paquete no devolvió una ruta absoluta");
    }
    accessSync(executable, constants.X_OK);
    if (!statSync(executable).isFile())
      throw new Error("la ruta no es un archivo");
    return executable;
  } catch (error) {
    throw new Error(
      "Electron no tiene un ejecutable utilizable. Comprueba `npm --prefix desktop ls electron` y ejecuta `node desktop/node_modules/electron/install.js` desde la raíz del repositorio; revisa la descarga y la caché si falla.",
      { cause: error },
    );
  }
}
