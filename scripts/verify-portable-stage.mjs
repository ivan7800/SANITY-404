import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const directory = path.resolve(process.argv[2] ?? "");
const manifest = JSON.parse(
  await readFile(path.join(directory, "MANIFIESTO_DISTRIBUCION.json"), "utf8"),
);
assert.equal(manifest.origin, "http://127.0.0.1:40404");
assert.equal(manifest.version, "1.0");
assert.ok(["linux-x64", "windows-x64"].includes(manifest.platform));
const sums = (await readFile(path.join(directory, "SHA256SUMS.txt"), "utf8"))
  .trim()
  .split("\n");
assert.equal(sums.length, manifest.files.length + 1);
for (const item of manifest.files) {
  assert.ok(!item.file.includes("..") && !path.isAbsolute(item.file));
  const file = path.join(directory, item.file);
  const data = await readFile(file);
  assert.equal(data.length, item.bytes, item.file);
  assert.equal(
    createHash("sha256").update(data).digest("hex"),
    item.sha256,
    item.file,
  );
  assert.ok(sums.includes(`${item.sha256}  ${item.file}`), item.file);
}
const manifestBytes = await readFile(
  path.join(directory, "MANIFIESTO_DISTRIBUCION.json"),
);
const manifestHash = createHash("sha256").update(manifestBytes).digest("hex");
assert.ok(sums.includes(`${manifestHash}  MANIFIESTO_DISTRIBUCION.json`));
const executable =
  manifest.platform === "windows-x64"
    ? "sanity404-server.exe"
    : "sanity404-server";
assert.ok((await stat(path.join(directory, executable))).size > 0);
assert.ok((await stat(path.join(directory, "game", "index.html"))).size > 0);
console.log(
  `PASS ${manifest.platform}: ${manifest.files.length + 1} hashes, origin fijo, servidor y juego`,
);
