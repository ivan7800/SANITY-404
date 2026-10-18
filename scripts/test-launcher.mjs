import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import net from "node:net";
const run = promisify(execFile),
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  shell = path.join(root, "INICIAR-SANITY-404.sh");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sanity-launcher-")),
  capture = path.join(temp, "browser-url.txt"),
  fake = path.join(temp, "browser");
fs.writeFileSync(fake, `#!/bin/sh\nprintf '%s' "$1" > '${capture}'\n`, {
  mode: 0o755,
});
if (process.argv.includes("--real-browser")) {
  const wrapper = path.join(temp, "google-chrome"),
    dom = path.join(temp, "game.html");
  fs.writeFileSync(
    wrapper,
    `#!/bin/sh\nprintf '%s' "$1" > '${capture}'\nexec /usr/bin/google-chrome --headless --no-sandbox --disable-dev-shm-usage --use-angle=swiftshader --enable-unsafe-swiftshader --user-data-dir='${temp}/chrome-profile' --dump-dom "$1" > '${dom}' 2> '${temp}/chrome.log'\n`,
    { mode: 0o755 },
  );
  const env = {
    ...process.env,
    PATH: temp + path.delimiter + process.env.PATH,
  };
  delete env.SANITY_BROWSER_COMMAND;
  await run(shell, [], { env });
  const s = JSON.parse(
    fs.readFileSync(path.join(root, ".sanity-launcher/server.json")),
  );
  for (let i = 0; i < 300; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (fs.existsSync(dom) && fs.readFileSync(dom, "utf8").includes("<canvas"))
      break;
  }
  assert.equal(fs.readFileSync(capture, "utf8"), s.url);
  assert.match(fs.readFileSync(dom, "utf8"), /<canvas/);
  assert.match(fs.readFileSync(dom, "utf8"), /Nueva partida/);
  console.log(
    "PASS Chrome real iniciado por el lanzador con la URL del videojuego y canvas WebGL",
  );
  console.log("Evidencia:", dom);
  process.exit(0);
}
let blocker;
try {
  await run(shell, ["--stop"]);
  const normal = await run(shell, ["--check"]);
  assert.match(normal.stdout, /Dependencias disponibles/);
  console.log("PASS Node PATH");
  const nvm = await run(shell, ["--check"], {
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.match(nvm.stdout, /\.nvm\/versions\/node/);
  console.log("PASS Node mediante NVM real y PATH gráfico");
  blocker = net.createServer();
  await new Promise((resolve, reject) => {
    blocker.once("error", reject);
    blocker.listen(5173, "127.0.0.1", resolve);
  });
} catch (e) {
  if (e.code !== "EADDRINUSE") throw e;
}
try {
  const env = { ...process.env, SANITY_BROWSER_COMMAND: fake };
  const outputs = await Promise.all([
    run(shell, [], { env }),
    run(shell, ["--no-browser"]),
  ]);
  const s = JSON.parse(
    fs.readFileSync(path.join(root, ".sanity-launcher/server.json")),
  );
  assert.match(s.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
  assert.notEqual(new URL(s.url).port, "5173");
  const again = await run(shell, ["--status"]);
  assert.equal(again.stdout.trim(), s.url);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(root, ".sanity-launcher/server.json")))
      .pid,
    s.pid,
  );
  console.log("PASS inicio concurrente, reutilización y puerto alternativo");
  for (let i = 0; i < 30 && !fs.existsSync(capture); i++)
    await new Promise((r) => setTimeout(r, 100));
  assert.equal(fs.readFileSync(capture, "utf8"), s.url);
  assert.match(await (await fetch(s.url)).text(), /src\/main.ts/);
  console.log("PASS URL del videojuego enviada al navegador");
  assert.equal((await fetch(s.url + "__sanity_launcher")).status, 403);
  console.log("PASS control de cierre autenticado");
  await run(shell, ["--stop"]);
  await assert.rejects(() =>
    fetch(s.url, { signal: AbortSignal.timeout(1000) }),
  );
  assert.equal(
    fs.existsSync(path.join(root, ".sanity-launcher/server.json")),
    false,
  );
  console.log("PASS cierre y retirada del bloqueo");
  fs.writeFileSync(path.join(root, ".sanity-launcher/server.json"), "");
  await Promise.all([
    run(shell, ["--no-browser"]),
    run(shell, ["--no-browser"]),
  ]);
  assert.match((await run(shell, ["--status"])).stdout, /127.0.0.1/);
  await run(shell, ["--stop"]);
  console.log("PASS recuperación de bloqueo incompleto tras cierre inesperado");
} finally {
  await run(shell, ["--stop"]).catch(() => {});
  blocker?.close();
}
