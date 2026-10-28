const packageInfo = require("./package.json");

module.exports = async function beforeBuild() {
  if (Object.keys(packageInfo.dependencies ?? {}).length !== 0) {
    throw new Error(
      "Hay dependencias de ejecución: revisar su empaquetado antes de omitir el colector de módulos.",
    );
  }
  // The renderer is bundled by Vite. The Electron main process uses only Node/Electron.
  // No production node_modules need rebuilding or copying into app.asar.
  return false;
};
