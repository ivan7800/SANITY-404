import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(
  process.env.SANITY_WINDOWS_PACKAGE_ROOT ?? "desktop/release/win-unpacked",
);
const requireDesktop = createRequire(path.resolve("desktop/package.json"));
const { extractFile, listPackage } = requireDesktop("@electron/asar");
const packageJson = JSON.parse(await readFile("desktop/package.json", "utf8"));
const executable = path.join(root, `${packageJson.build.productName}.exe`);
const archive = path.join(root, "resources", "app.asar");

assert.ok((await stat(executable)).size > 0, "Ejecutable Windows vacío");
await access(archive);
const files = new Set(listPackage(archive));
for (const file of [
  "/main.mjs",
  "/paths.mjs",
  "/package.json",
  "/assets/icon.ico",
  "/assets/icon.png",
  "/dist-desktop/index.html",
]) {
  assert.ok(files.has(file), `Falta ${file} en app.asar`);
}
const index = extractFile(archive, "dist-desktop/index.html").toString();
assert.ok(index.includes("./assets/"), "Base de Electron incorrecta");
assert.ok(!index.includes("/src/main.ts"), "HTML de desarrollo empaquetado");
for (const [, reference] of index.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(?:https?:|data:|#)/.test(reference)) continue;
  assert.ok(reference.startsWith("./"), `Referencia no local: ${reference}`);
  assert.ok(
    files.has(`/dist-desktop/${reference.slice(2)}`),
    `Recurso no empaquetado: ${reference}`,
  );
}
const packedJson = JSON.parse(extractFile(archive, "package.json").toString());
assert.equal(packedJson.main, "main.mjs");
assert.deepEqual(packedJson.dependencies ?? {}, {});

const ico = extractFile(archive, "assets/icon.ico");
assert.equal(ico.readUInt16LE(0), 0);
assert.equal(ico.readUInt16LE(2), 1);
const iconSizes = new Set();
for (let i = 0; i < ico.readUInt16LE(4); i++) {
  const offset = 6 + i * 16;
  iconSizes.add(ico[offset] || 256);
}
for (const size of [16, 32, 48, 256])
  assert.ok(iconSizes.has(size), `Falta icono Windows ${size}x${size}`);

const installers = (await readdir(path.dirname(root))).filter((name) =>
  name.toLowerCase().endsWith(".exe"),
);
assert.equal(installers.length, 1, "Se esperaba un único instalador NSIS");
assert.ok(
  (await stat(path.join(path.dirname(root), installers[0]))).size > 0,
  "Instalador NSIS vacío",
);
console.log(
  JSON.stringify(
    {
      status: "PASS",
      executable,
      archive,
      bundledFiles: files.size,
      iconSizes: [...iconSizes].sort((a, b) => a - b),
      installer: installers[0],
    },
    null,
    2,
  ),
);
