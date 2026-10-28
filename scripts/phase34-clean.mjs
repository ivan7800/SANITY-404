import { rm, stat } from "node:fs/promises";
import path from "node:path";

const apply = process.argv.includes("--apply");
for (const relative of ["dist", "desktop/dist-desktop", "desktop/release"]) {
  const directory = path.resolve(relative);
  if (!directory.startsWith(process.cwd() + path.sep))
    throw new Error("Ruta fuera del repositorio");
  try {
    if ((await stat(directory)).isDirectory()) {
      if (apply) {
        await rm(directory, { recursive: true });
        console.log(`Eliminado artefacto generado: ${relative}`);
      } else {
        console.log(
          `Se limpiaría: ${relative}; ejecutar con --apply para confirmar`,
        );
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
