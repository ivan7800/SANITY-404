import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const stage = path.resolve(process.argv[2] ?? "");
const binary = path.join(
  stage,
  process.platform === "win32" ? "sanity404-server.exe" : "sanity404-server",
);
const game = path.join(stage, "game");
const origin = "http://127.0.0.1:40404";
const profile = await mkdtemp(path.join(os.tmpdir(), "sanity404-profile-"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSmoke(existing) {
  const env = {
    ...process.env,
    CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath(),
    SANITY_TEST_URL: `${origin}/`,
    SANITY_EXPECT_PATH_PREFIX: "/",
    SANITY_OFFLINE_TEST: "1",
    SANITY_SOFTWARE: "1",
    SANITY_PERSIST_PROFILE: profile,
    ...(existing
      ? { SANITY_EXPECT_EXISTING_SAVE: "1" }
      : { SANITY_TEST_CORRUPT_SAVE: "1" }),
  };
  const child = spawn(
    process.execPath,
    ["scripts/phase34-web-production-smoke.mjs"],
    { env, stdio: "inherit" },
  );
  const code = await new Promise((resolve, reject) =>
    child.once("error", reject).once("exit", resolve),
  );
  assert.equal(code, 0, `Browser QA ${existing ? "after restart" : "initial"}`);
}
async function serverStopped() {
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
  throw new Error("El servidor sigue escuchando tras el cierre");
}
async function session(existing) {
  await serverStopped();
  const server = spawn(binary, ["--serve", game], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      output += chunk;
    });
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null)
        throw new Error(`Servidor terminado: ${output}`);
      try {
        const health = await fetch(`${origin}/__sanity404/health`, {
          signal: AbortSignal.timeout(500),
        });
        if (health.status === 200 && (await health.text()) === game) {
          ready = true;
          break;
        }
      } catch {
        /* starting */
      }
      await sleep(100);
    }
    assert.ok(ready, `Servidor no disponible: ${output}`);
    await runSmoke(existing);
  } finally {
    server.kill();
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      sleep(5000),
    ]);
    assert.ok(
      server.exitCode !== null || server.signalCode !== null,
      "El servidor no terminó",
    );
    await serverStopped();
  }
}

try {
  await session(false);
  await session(true);
  console.log(
    "PASS navegador: mismo origen, partida guardada tras reinicio y cierre de ambos servidores",
  );
} finally {
  await rm(profile, { recursive: true, force: true });
}
