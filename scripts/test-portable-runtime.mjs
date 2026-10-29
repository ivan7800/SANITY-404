import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, chmod, cp } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const stage = path.resolve(process.argv[2] ?? "");
const windows = process.platform === "win32";
const binary = path.join(
  stage,
  windows ? "sanity404-server.exe" : "sanity404-server",
);
const launcher = path.join(
  stage,
  windows ? "INICIAR-SANITY-404.bat" : "INICIAR-SANITY-404.sh",
);
const game = path.join(stage, "game");
const origin = "http://127.0.0.1:40404";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const temp = await mkdtemp(path.join(os.tmpdir(), "sanity404-runtime-"));

function start(file, args = [], env = process.env) {
  const child = spawn(file, args, {
    cwd: stage,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.output = "";
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (chunk) => {
      child.output += chunk;
    });
  return child;
}
function launch(env) {
  return windows
    ? start("cmd.exe", ["/d", "/c", launcher], env)
    : start(launcher, [], env);
}
async function stopped() {
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(`${origin}/__sanity404/health`, {
        signal: AbortSignal.timeout(300),
      });
    } catch {
      return;
    }
    await sleep(100);
  }
  throw new Error("El puerto 40404 sigue respondiendo después del cierre");
}
async function stop(child) {
  if (child.exitCode === null && child.signalCode === null) {
    if (windows)
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        timeout: 5000,
      });
    else child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      sleep(5000),
    ]);
    if (child.exitCode === null && child.signalCode === null)
      throw new Error(`No se detuvo el proceso ${child.pid}`);
  }
  await stopped();
}
async function ready(child) {
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null || child.signalCode !== null)
      throw new Error(`El lanzador terminó: ${child.output}`);
    try {
      const health = await fetch(`${origin}/__sanity404/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (health.status === 200 && (await health.text()) === game) return;
    } catch {
      /* starting */
    }
    await sleep(100);
  }
  throw new Error(`No arrancó el servidor del ZIP: ${child.output}`);
}
function expectExit(file, args, expected, env) {
  const result = spawnSync(file, args, {
    cwd: stage,
    env,
    encoding: "utf8",
    timeout: 6000,
  });
  assert.equal(
    result.status,
    expected,
    `${file}: ${result.stdout}\n${result.stderr}\n${result.error ?? ""}`,
  );
  return result;
}
function expectLauncherExit(expected, env) {
  return windows
    ? expectExit("cmd.exe", ["/d", "/c", launcher], expected, env)
    : expectExit(launcher, [], expected, env);
}
async function blocker(body) {
  const server = net.createServer((socket) => {
    socket.once("data", () =>
      socket.end(
        `HTTP/1.1 200 OK\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`,
      ),
    );
  });
  await new Promise((resolve, reject) =>
    server.once("error", reject).listen(40404, "127.0.0.1", resolve),
  );
  return server;
}
async function close(server) {
  await new Promise((resolve) => server.close(resolve));
}

try {
  await stopped();
  expectExit(binary, ["--serve", path.join(temp, "missing")], 2);
  const invalid = path.join(temp, "invalid");
  await cp(launcher, invalid + (windows ? ".bat" : ".sh"));
  await cp(binary, path.join(temp, path.basename(binary)));
  if (!windows) await chmod(invalid + ".sh", 0o755);
  const missing = windows
    ? ["cmd.exe", ["/d", "/c", invalid + ".bat"]]
    : [invalid + ".sh", []];
  expectExit(missing[0], missing[1], 2);
  console.log("PASS recursos ausentes: servidor y lanzador devuelven error");

  // A foreign HTTP server may deliberately return the same health body.
  const foreign = await blocker(game);
  try {
    expectExit(binary, ["--serve", game], 3);
    expectLauncherExit(3);
  } finally {
    await close(foreign);
  }
  await stopped();
  console.log(
    "PASS puerto ocupado: servidor ajeno con health falsificado rechazado",
  );

  const server = start(binary, ["--serve", game]);
  try {
    await ready(server);
    const index = await fetch(origin);
    assert.equal(index.status, 200);
    const html = await index.text();
    assert.match(html, /\.\/assets\//);
    assert.doesNotMatch(html, /\/src\/main\.ts/);
    for (const [, asset] of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g)) {
      const response = await fetch(`${origin}/${asset.slice(2)}`);
      assert.equal(response.status, 200, asset);
      assert.ok(Number(response.headers.get("content-length")) > 0);
    }
    assert.equal((await fetch(`${origin}/%2e%2e/package.json`)).status, 404);
    expectExit(binary, ["--serve", game], 3);
    // 127.0.0.2 reaches wildcard listeners but must not reach this loopback-only listener.
    await assert.rejects(
      fetch("http://127.0.0.2:40404/__sanity404/health", {
        signal: AbortSignal.timeout(1000),
      }),
    );
    if (windows) {
      const listeners = spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "@(Get-NetTCPConnection -LocalPort 40404 -State Listen).LocalAddress -join ','",
        ],
        { encoding: "utf8", timeout: 5000 },
      );
      assert.equal(listeners.status, 0, listeners.stderr);
      assert.equal(listeners.stdout.trim(), "127.0.0.1");
    }
  } finally {
    await stop(server);
  }
  console.log(
    "PASS contenido, duplicado y escucha exclusiva en 127.0.0.1; cierre verificado",
  );

  let env = process.env;
  let capture;
  if (!windows) {
    capture = path.join(temp, "opened-url.txt");
    const opener = path.join(temp, "xdg-open");
    await writeFile(
      opener,
      '#!/bin/sh\nprintf \'%s\' "$1" > "$SANITY_OPEN_CAPTURE"\n',
      { mode: 0o755 },
    );
    env = {
      ...process.env,
      PATH: `${temp}${path.delimiter}${process.env.PATH}`,
      SANITY_OPEN_CAPTURE: capture,
    };
  }
  const launched = launch(env);
  try {
    await ready(launched);
    if (capture) {
      for (let i = 0; i < 30; i++) {
        try {
          assert.equal(await readFile(capture, "utf8"), `${origin}/`);
          break;
        } catch (error) {
          if (i === 29) throw error;
          await sleep(100);
        }
      }
    }
    assert.equal((await fetch(origin)).status, 200);
    expectLauncherExit(3, env);
  } finally {
    await stop(launched);
  }
  console.log(
    `PASS lanzador ${windows ? "Windows" : "Linux"}: arranque, origen, conflicto, navegador cuando es verificable y cierre`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
