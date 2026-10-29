import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const binary = path.resolve(
  process.env.SANITY_PORTABLE_SERVER ?? "/tmp/sanity404-server",
);
const game = path.resolve(process.env.SANITY_PORTABLE_GAME ?? "portable/game");
const url = "http://127.0.0.1:40404";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const server = spawn(binary, ["--serve", game], {
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (chunk) => (output += chunk));
server.stderr.on("data", (chunk) => (output += chunk));
const other = await mkdtemp(path.join(tmpdir(), "sanity404-other-"));
try {
  await writeFile(path.join(other, "index.html"), "other game");
  let health;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try {
      health = await fetch(`${url}/__sanity404/health`);
      if (health.ok) break;
    } catch {
      /* server is starting */
    }
    await wait(100);
  }
  assert.ok(health?.ok, `Server failed to start: ${output}`);
  assert.equal(await health.text(), game);
  const index = await fetch(url);
  assert.equal(index.status, 200);
  const html = await index.text();
  assert.match(html, /\.\/assets\//);
  assert.doesNotMatch(html, /\/src\/main\.ts/);
  for (const [, asset] of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g)) {
    const resource = await fetch(`${url}/${asset.slice(2)}`);
    assert.equal(resource.status, 200, asset);
    assert.ok(Number(resource.headers.get("content-length")) > 0);
  }
  assert.equal((await fetch(`${url}/../package.json`)).status, 404);
  assert.equal((await fetch(`${url}/%2e%2e/package.json`)).status, 404);
  assert.equal(spawnSync(binary, ["--probe", game]).status, 0);
  assert.equal(spawnSync(binary, ["--serve", game]).status, 0);
  assert.equal(spawnSync(binary, ["--serve", other]).status, 3);
  console.log(
    "PASS portable server: assets, fixed origin, duplicate, conflicting root, traversal",
  );
} finally {
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    wait(3000),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
  await rm(other, { recursive: true, force: true });
}
