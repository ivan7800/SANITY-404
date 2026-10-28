/** Isolated live-AI regression. QA setup is separate from campaign certification. */
import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { blocked } from "../src/systems/collision.ts";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/";
const output =
  process.env.SANITY_PHASE26_WIDOW_OUTPUT || "/tmp/sanity-phase26-widow";
mkdirSync(output, { recursive: true });
const previous = [
  "recorrido.json",
  "antes.png",
  "despues.png",
  "fallo.png",
].filter((name) => existsSync(join(output, name)));
if (previous.length) {
  const archive = join(output, "historial");
  const tag = new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");
  mkdirSync(archive, { recursive: true });
  for (const name of previous)
    copyFileSync(join(output, name), join(archive, `${tag}-${name}`));
}
const report = {
  startedAt: new Date().toISOString(),
  url,
  mode: "QA aislado: posición inicial diagnóstica, persecución física real",
  renderer: null,
  samples: [],
  errors: [],
  completed: false,
};
let browser;
let page;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    ...browserLaunchOptions(),
  });
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(new URL("?qa=1", url).href);
  await page.waitForFunction(() =>
    Boolean(window.sanityQa && window.sanityInspect),
  );
  report.renderer = await page.evaluate(() => {
    const gl = document.querySelector("canvas")?.getContext("webgl2");
    const extension = gl?.getExtension("WEBGL_debug_renderer_info");
    return extension
      ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
      : gl?.getParameter(gl.RENDERER);
  });
  if (process.env.SANITY_HARDWARE === "1")
    assert.match(
      String(report.renderer),
      /Intel/i,
      "No se detectó la GPU Intel",
    );
  const setup = await page.evaluate(() => {
    window.sanityQa.openRoom(0, 1);
    window.sanityQa.position(3.8, -5.2);
    // Start before the first threat-sync frame and before taking screenshots.
    // Timers at 100 ms skipped the entire approach on slow hardware.
    window.__phase26WidowSamples = [];
    window.__phase26WidowErrors = 0;
    window.addEventListener("error", () => window.__phase26WidowErrors++);
    window.addEventListener(
      "unhandledrejection",
      () => window.__phase26WidowErrors++,
    );
    window.__phase26WidowSampling = true;
    const started = performance.now();
    const sampleFrame = () => {
      if (!window.__phase26WidowSampling) return;
      const snapshot = window.sanityInspect();
      if (snapshot.combat.kind === "widow") {
        const [x, y, z] = snapshot.enemy.position;
        window.__phase26WidowSamples.push({
          wallMs: performance.now() - started,
          gameSeconds: snapshot.state.elapsed,
          frame: snapshot.draw.frame,
          player: {
            x: snapshot.state.x,
            y: snapshot.playerY,
            z: snapshot.state.z,
            floor: snapshot.state.floor,
            health: snapshot.state.health,
          },
          x,
          y,
          z,
          distance: Math.hypot(x - snapshot.state.x, z - snapshot.state.z),
          aiState: snapshot.combat.aiState,
          route: snapshot.combat.route,
          waypointDistance: snapshot.combat.route?.waypoint
            ? Math.hypot(
                x - snapshot.combat.route.waypoint.x,
                z - snapshot.combat.route.waypoint.z,
              )
            : null,
          kind: snapshot.combat.kind,
          defeatedId: snapshot.combat.defeatedId,
          selectedKind: snapshot.enemy.selectedKind,
          cameraCorrected: snapshot.cameraCorrected,
          walkable: window.sanityQa.walkableAt(x, z, 1),
          jsErrors: window.__phase26WidowErrors,
        });
      }
      requestAnimationFrame(sampleFrame);
    };
    requestAnimationFrame(sampleFrame);
    return {
      state: window.sanityInspect(),
      obstacles: window.sanityQa.obstacles(),
    };
  });
  report.beforeThreatSync = {
    room: setup.state.state.room,
    floor: setup.state.state.floor,
    player: [setup.state.state.x, setup.state.state.z],
    selectedKind: setup.state.enemy.selectedKind,
    expectedKind: setup.state.enemy.expectedKind,
    combatKind: setup.state.combat.kind,
    defeatedId: setup.state.combat.defeatedId,
    enemyName: setup.state.enemy.name,
    enemyPosition: setup.state.enemy.position,
    enemyVisible: setup.state.enemy.visible,
    paused: setup.state.paused,
    frame: setup.state.draw.frame,
  };
  await page.waitForFunction(
    () => {
      const snapshot = window.sanityInspect();
      return (
        snapshot.state.room === 0 &&
        snapshot.state.floor === 1 &&
        snapshot.enemy.expectedKind === "widow" &&
        snapshot.enemy.selectedKind === "widow" &&
        snapshot.combat.kind === "widow" &&
        snapshot.combat.defeatedId === "mansion-widow" &&
        snapshot.enemy.visible &&
        !snapshot.paused
      );
    },
    null,
    { timeout: 5000 },
  );
  const ready = await page.evaluate(() => window.sanityInspect());
  report.afterThreatSync = {
    room: ready.state.room,
    floor: ready.state.floor,
    player: [ready.state.x, ready.state.z],
    selectedKind: ready.enemy.selectedKind,
    expectedKind: ready.enemy.expectedKind,
    combatKind: ready.combat.kind,
    defeatedId: ready.combat.defeatedId,
    enemyName: ready.enemy.name,
    enemyPosition: ready.enemy.position,
    enemyVisible: ready.enemy.visible,
    paused: ready.paused,
    frame: ready.draw.frame,
  };
  assert.equal(ready.state.floor, 1);
  assert.equal(ready.enemy.expectedKind, "widow");
  assert.equal(ready.enemy.selectedKind, "widow");
  assert.equal(ready.combat.kind, "widow");
  assert.equal(ready.combat.defeatedId, "mansion-widow");
  assert.equal(ready.enemy.visible, true);
  assert.equal(ready.enemy.name, "La Viuda del Rellano");
  await page.screenshot({ path: join(output, "antes.png") });
  await page.waitForFunction(
    () => {
      const state = window.sanityInspect();
      const [x, , z] = state.enemy.position;
      return (
        state.combat.kind === "widow" &&
        x < 5.2 &&
        Math.hypot(x - state.state.x, z - state.state.z) < 1.75 &&
        state.state.health < 100
      );
    },
    null,
    { timeout: 10000 },
  );
  report.samples = await page.evaluate(() => {
    window.__phase26WidowSampling = false;
    return window.__phase26WidowSamples;
  });
  const after = await page.evaluate(() => window.sanityInspect());
  report.phases = Object.fromEntries(
    [...new Set(report.samples.map((sample) => sample.aiState))].map(
      (phase) => [
        phase,
        report.samples.filter((sample) => sample.aiState === phase).length,
      ],
    ),
  );
  report.positions = new Set(
    report.samples.map(
      (sample) => `${sample.x.toFixed(3)},${sample.z.toFixed(3)}`,
    ),
  ).size;
  report.displacement = report.samples.length
    ? Math.hypot(
        report.samples.at(-1).x - report.samples[0].x,
        report.samples.at(-1).z - report.samples[0].z,
      )
    : 0;
  for (const sample of report.samples) {
    sample.blocked = blocked(sample.x, sample.z, setup.obstacles);
    sample.nearbyObstacles = setup.obstacles
      .filter(
        (obstacle) =>
          Math.abs(sample.x - obstacle.x) < obstacle.w / 2 + 0.8 &&
          Math.abs(sample.z - obstacle.z) < obstacle.d / 2 + 0.8,
      )
      .map(({ id }) => id);
  }
  let chaseStallStart = null;
  let longestChaseStall = 0;
  for (let index = 1; index < report.samples.length; index++) {
    const previous = report.samples[index - 1];
    const current = report.samples[index];
    const moved = Math.hypot(current.x - previous.x, current.z - previous.z);
    if (
      current.aiState === "chase" &&
      current.distance > 1.75 &&
      moved < 0.005
    ) {
      chaseStallStart ??= previous.gameSeconds;
      longestChaseStall = Math.max(
        longestChaseStall,
        current.gameSeconds - chaseStallStart,
      );
    } else chaseStallStart = null;
  }
  report.longestChaseStallSeconds = longestChaseStall;
  assert.ok(
    report.samples.length >= 6,
    `Faltan muestras físicas de persecución: ${report.samples.length}/6; fases=${JSON.stringify(report.phases)}`,
  );
  assert.ok(
    report.phases.chase >= 3,
    `No se observó persecución: ${JSON.stringify(report.phases)}`,
  );
  assert.ok(
    report.positions >= 4,
    `No hay cuatro posiciones distintas: ${report.positions}`,
  );
  assert.ok(
    report.displacement > 0.25,
    `Desplazamiento insuficiente: ${report.displacement}`,
  );
  assert.ok(
    report.phases.windup || report.phases.recover,
    "No se observó la fase de ataque",
  );
  assert.ok(
    longestChaseStall < 0.8,
    `Persecución bloqueada durante ${longestChaseStall.toFixed(2)} s`,
  );
  for (const sample of report.samples) {
    assert.equal(sample.kind, "widow");
    assert.equal(sample.defeatedId, "mansion-widow");
    assert.equal(sample.selectedKind, "widow");
    assert.equal(
      sample.walkable,
      true,
      `Fuera de la galería: ${JSON.stringify(sample)}`,
    );
    assert.equal(sample.blocked, false);
    assert.equal(sample.jsErrors, 0, `Error JS durante ${sample.aiState}`);
    assert.ok(
      Math.abs(sample.y - 2.64) < 0.03,
      `Caída de planta: ${JSON.stringify(sample)}`,
    );
  }
  assert.ok(after.state.health > 0, "Élise murió durante el diagnóstico");
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  report.after = {
    player: after.state,
    enemy: after.enemy.position,
    aiState: after.combat.aiState,
    cameraCorrected: after.cameraCorrected,
  };
  report.performance = {
    quality: after.quality,
    canvas: { width: after.canvas.width, height: after.canvas.height },
    frame: after.performance,
    gpu: after.gpuTime,
    draw: after.draw,
  };
  await page.screenshot({ path: join(output, "despues.png") });
  report.completed = true;
  console.log(
    `PASS encuentro de la Viuda: ${report.samples.length} muestras sin atravesar sólidos`,
  );
} catch (error) {
  if (page)
    report.samples = await page
      .evaluate(() => {
        window.__phase26WidowSampling = false;
        return window.__phase26WidowSamples ?? [];
      })
      .catch(() => report.samples);
  report.errors.push({ message: String(error), stack: error.stack });
  report.failure = page
    ? await page.evaluate(() => window.sanityInspect?.()).catch(() => null)
    : null;
  if (page)
    await page.screenshot({ path: join(output, "fallo.png") }).catch(() => {});
  console.error(`FAIL persecución de la Viuda: ${error.message}`);
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(
    join(output, "recorrido.json"),
    JSON.stringify(report, null, 2),
  );
  await browser?.close().catch(() => {});
}
process.exitCode = report.completed ? 0 : 1;
