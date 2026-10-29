import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const platform = process.argv[2];
if (!["linux", "windows"].includes(platform))
  throw new Error("Uso: node scripts/stage-portable.mjs linux|windows");
const root = process.cwd();
const stage = path.join(root, "portable", "release", platform);
const game = path.join(root, "portable", "game");
const serverName =
  platform === "windows" ? "sanity404-server.exe" : "sanity404-server";
const source = path.join(root, "portable", "bin", platform, serverName);
if ((await stat(source)).size === 0)
  throw new Error(`Servidor vacío: ${source}`);
await stat(path.join(game, "index.html"));
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
await cp(game, path.join(stage, "game"), { recursive: true });
await cp(source, path.join(stage, serverName));
for (const file of [
  "RELEASE_NOTES_1.0.md",
  "QA_FINAL_1.0.md",
  platform === "windows"
    ? "INSTRUCCIONES_WINDOWS.md"
    : "INSTRUCCIONES_LINUX.md",
  platform === "windows" ? "INICIAR-SANITY-404.bat" : "INICIAR-SANITY-404.sh",
])
  await cp(path.join(root, file), path.join(stage, file));

const files = [];
async function inventory(directory, prefix = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory())
      await inventory(path.join(directory, entry.name), relative);
    else if (entry.isFile()) {
      const contents = await readFile(path.join(directory, entry.name));
      files.push({
        file: relative,
        bytes: contents.length,
        sha256: createHash("sha256").update(contents).digest("hex"),
      });
    } else throw new Error(`Entrada no permitida: ${relative}`);
  }
}
await inventory(stage);
files.sort((a, b) => a.file.localeCompare(b.file));
const head = (await readFile(path.join(root, ".git", "HEAD"), "utf8")).trim();
const commit =
  process.env.GITHUB_SHA ??
  (head.startsWith("ref: ")
    ? (await readFile(path.join(root, ".git", head.slice(5)), "utf8")).trim()
    : head);
const manifest = {
  name: "SANITY-404",
  version: "1.0",
  platform: `${platform}-x64`,
  sourceBaseCommit: commit,
  sourceTree: process.env.GITHUB_ACTIONS
    ? "clean-checkout"
    : "local-working-tree",
  origin: "http://127.0.0.1:40404",
  files,
};
await writeFile(
  path.join(stage, "MANIFIESTO_DISTRIBUCION.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
const manifestBytes = await readFile(
  path.join(stage, "MANIFIESTO_DISTRIBUCION.json"),
);
files.push({
  file: "MANIFIESTO_DISTRIBUCION.json",
  bytes: manifestBytes.length,
  sha256: createHash("sha256").update(manifestBytes).digest("hex"),
});
files.sort((a, b) => a.file.localeCompare(b.file));
await writeFile(
  path.join(stage, "SHA256SUMS.txt"),
  files.map((item) => `${item.sha256}  ${item.file}`).join("\n") + "\n",
);
console.log(`${stage}: ${files.length} archivos verificados`);
