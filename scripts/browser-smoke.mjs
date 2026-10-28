import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  axisTargetReached,
  blockedForRoute,
  clearMovement,
  EXECUTION_RADIUS,
  planRoute,
  PLAYER_RADIUS,
} from "./phase22-navigation.mjs";
import { browserLaunchOptions } from "./browser-launch.mjs";
import { campaignStartReady } from "./phase22-start-readiness.mjs";
const softwareRenderer = process.env.SANITY_SOFTWARE === "1";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  ...browserLaunchOptions(),
});
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const routes = [];
let graphics;
const report = (message) => {
  results.push(message);
  console.log("PASS", message);
};
const inspect = () => page.evaluate(() => window.game.inspect());
const key = async (k) => {
  const before = (await inspect()).draw.frame;
  await page.keyboard.press(k);
  await page.waitForFunction(
    (frame) => window.game.inspect().draw.frame > frame + 1,
    before,
  );
};
const interactExpected = async (id) => {
  await page.waitForFunction(
    (expected) => window.sanityInspect().interaction?.id === expected,
    id,
    { timeout: 5000 },
  );
  const before = await inspect();
  assert.equal(before.interaction?.id, id, `Interactuable seleccionado: ${id}`);
  routes.push({
    interaction: id,
    room: before.state.room,
    at: [before.state.x, before.state.z],
  });
  await key("e");
};
class RouteBlocked extends Error {
  constructor(details) {
    super(`Movimiento bloqueado: ${JSON.stringify(details)}`);
    this.details = details;
  }
}

async function goDirect(x, z) {
  for (const [axis, target] of [
    ["x", x],
    ["z", z],
  ]) {
    const before = await inspect();
    const diff = target - before.state[axis];
    if (axisTargetReached(before.state[axis], target, before.state[axis]))
      continue;
    const direction =
      axis === "x" ? (diff > 0 ? "d" : "a") : diff > 0 ? "s" : "w";
    let previous = before;
    let stalled = 0;
    // Bound by simulated travel time so both high and low frame rates work.
    const deadline = before.state.elapsed + Math.abs(diff) / 1.2 + 2;
    await page.keyboard.down(direction);
    try {
      for (;;) {
        await page.waitForFunction(
          (lastFrame) => window.sanityInspect().draw.frame > lastFrame,
          previous.draw.frame,
          { timeout: 6000 },
        );
        const current = await inspect();
        if (current.state.health <= 0)
          throw new RouteBlocked({
            axis,
            target,
            reason: "jugador muerto",
            state: current.state,
          });
        if (axisTargetReached(before.state[axis], target, current.state[axis]))
          break;
        const progress =
          (current.state[axis] - previous.state[axis]) * Math.sign(diff);
        stalled = progress < 0.0001 ? stalled + 1 : 0;
        if (stalled >= 4)
          throw new RouteBlocked({
            axis,
            target,
            reason: "sin progreso durante cuatro fotogramas",
            state: current.state,
          });
        if (current.state.elapsed > deadline)
          throw new RouteBlocked({
            axis,
            target,
            reason: "tiempo simulado de recorrido excedido",
            state: current.state,
          });
        previous = current;
      }
    } catch (error) {
      const diagnostic = await page.evaluate(() => ({
        state: window.sanityInspect().state,
        focused: document.activeElement?.tagName,
        obstacles: window.sanityRoomAudit().navigationObstacles,
      }));
      console.error(
        "FAIL ruta",
        JSON.stringify({
          axis,
          target,
          direction,
          diagnostic,
          error: String(error),
        }),
      );
      throw error;
    } finally {
      await page.keyboard.up(direction);
    }
  }
}
async function go(x, z) {
  const failed = new Set();
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = (await inspect()).state;
    const obstacles = (await page.evaluate(() => window.sanityRoomAudit()))
      .navigationObstacles;
    const goalRadius = blockedForRoute(x, z, obstacles, PLAYER_RADIUS)
      ? 1.5
      : 0.35;
    if (Math.hypot(current.x - x, current.z - z) <= goalRadius + 0.1) return;
    const route = planRoute(
      { x: current.x, z: current.z },
      { x, z },
      obstacles,
      { goalRadius, preferGrid: attempt > 0 },
    );
    const signature = JSON.stringify(route.waypoints);
    if (failed.has(signature))
      throw new RouteBlocked({
        reason: "ruta repetida",
        attempt,
        current,
        route,
      });
    routes.push({
      attempt,
      room: current.room,
      from: [current.x, current.z],
      target: [x, z],
      route,
    });
    let obstruction;
    for (const [index, waypoint] of route.waypoints.entries()) {
      const observed = (await inspect()).state;
      if (
        !clearMovement(
          { x: observed.x, z: observed.z },
          waypoint,
          obstacles,
          Math.min(EXECUTION_RADIUS, route.legRadii[index]),
        )
      ) {
        obstruction = {
          reason: "waypoint no transitable desde posición real",
          observed,
          waypoint,
        };
        break;
      }
      try {
        await goDirect(waypoint.x, waypoint.z);
      } catch (error) {
        if (!(error instanceof RouteBlocked)) throw error;
        obstruction = {
          reason: error.message,
          observed: (await inspect()).state,
          waypoint,
        };
        break;
      }
    }
    const after = (await inspect()).state;
    if (Math.hypot(after.x - x, after.z - z) <= goalRadius + 0.1) return;
    failed.add(signature);
    routes.push({
      attempt,
      room: after.room,
      replanning: obstruction ?? "fuera de alcance",
      position: [after.x, after.z],
    });
  }
  throw new RouteBlocked({
    reason: "seis replanteamientos sin alcanzar el destino",
    target: [x, z],
    state: (await inspect()).state,
  });
}
try {
  await page.goto(process.env.SANITY_TEST_URL || "http://localhost:5173");
  graphics = await page.evaluate(() => {
    const gl = document.querySelector("canvas")?.getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: ext
        ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)
        : gl?.getParameter(gl.VENDOR),
      renderer: ext
        ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : gl?.getParameter(gl.RENDERER),
    };
  });
  const gpuInfo = await browser
    .newBrowserCDPSession()
    .then((session) => session.send("SystemInfo.getInfo"))
    .catch(() => null);
  graphics.browserVersion = browser.version();
  graphics.devices = gpuInfo?.gpu?.devices?.map((device) => ({
    vendor: device.vendorString,
    device: device.deviceString,
  }));
  graphics.featureStatus = gpuInfo?.gpu?.featureStatus;
  console.log(
    "GRÁFICOS",
    JSON.stringify({
      softwareRenderer,
      hardwareRequested: process.env.SANITY_HARDWARE === "1",
      graphics,
    }),
  );
  await page.evaluate(async () => {
    window.game = { inspect: window.sanityInspect };
  });
  const menuFrame = (await inspect()).draw.frame;
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  try {
    await page.waitForFunction(
      (previousFrame) => {
        const current = window.sanityInspect();
        return (
          current.started &&
          !current.paused &&
          current.overlayHidden &&
          !current.titleTransitionClosed &&
          current.state.room === 0 &&
          current.state.health > 0 &&
          current.state.elapsed > 0 &&
          current.draw.frame > previousFrame
        );
      },
      menuFrame,
      { timeout: 10000 },
    );
  } catch (error) {
    const diagnostic = await page
      .evaluate(() => ({
        game: window.sanityInspect(),
        overlay: {
          hidden: document.querySelector("#overlay")?.hidden,
          classes: document.querySelector("#overlay")?.className,
        },
        curtain: {
          classes: document.querySelector("#title-transition")?.className,
        },
        newButton: {
          disabled: document.querySelector("#new")?.disabled,
          connected: document.querySelector("#new")?.isConnected,
        },
        focus: document.activeElement?.id,
      }))
      .catch(() => null);
    const evidence = {
      stage: "Nueva partida desde browser-smoke",
      menuFrame,
      diagnostic,
      javascriptErrors: errors,
      failure: String(error),
    };
    mkdirSync("docs/capturas/fase32", { recursive: true });
    writeFileSync(
      "docs/capturas/fase32/browser-smoke-start-failure.json",
      `${JSON.stringify(evidence, null, 2)}\n`,
    );
    await page
      .screenshot({
        path: "docs/capturas/fase32/browser-smoke-start-failure.png",
      })
      .catch(() => {});
    throw new Error(
      `Nueva partida no llegó a estado jugable: ${JSON.stringify(evidence)}`,
      {
        cause: error,
      },
    );
  }
  assert.equal(campaignStartReady(await inspect(), menuFrame), true);
  report("WebGL y nueva partida");
  mkdirSync("docs/capturas/fase32", { recursive: true });
  await page.screenshot({
    path: "docs/capturas/fase32/browser-smoke-start-pass.png",
  });
  await go(-2, 5);
  await interactExpected("save0");
  assert.ok(await page.evaluate(() => localStorage.getItem("sanity404-save")));
  const saved = JSON.parse(
    await page.evaluate(() => localStorage.getItem("sanity404-save")),
  );
  report("Movimiento e interacción de guardado");
  await key("Escape");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  assert.equal((await inspect()).state.x, saved.x);
  assert.equal((await inspect()).state.z, saved.z);
  report("Carga de partida");
  await key("Tab");
  assert.equal(await page.locator("#overlay").isVisible(), true);
  await page.keyboard.press("Tab");
  assert.equal(await page.locator("#overlay").isVisible(), true);
  await key("Escape");
  report("Inventario, foco de teclado y pausa");
  await go(-4.2, 5);
  await interactExpected("note0");
  await page.getByRole("button", { name: "Guardar en el diario" }).click();
  assert.equal((await inspect()).state.read.length, 1);
  report("Documento y diario");
  await go(-4, 1);
  await interactExpected("key");
  assert.ok((await inspect()).state.items.includes("Llave de latón"));
  report("Llave e inventario");
  await go(0, 4);
  await go(3, 4);
  await interactExpected("mansion-puzzle");
  await page.locator("#answer0").click();
  assert.ok((await inspect()).state.items.includes("Medallón Veyr"));
  report("Puzle de la mansión y medallón");
  await go(0, -6);
  await interactExpected("next");
  assert.equal((await inspect()).state.room, 1);
  report("Puerta y transición a biblioteca");
  for (let room = 1; room <= 3; room++) {
    await go(0, -3.2);
    await interactExpected(`seal${room}`);
    await page.locator("#answer" + (room - 1)).click();
    assert.ok((await inspect()).state.seals.includes(room - 1));
    await go(0, -6);
    await interactExpected("next");
    assert.equal((await inspect()).state.room, room + 1);
  }
  report("Tres puzles, cripta, capilla y acceso a ruinas");
  await go(0, -1.4);
  await interactExpected("end");
  await page
    .getByRole("button", { name: /Cerrar ahora · final anticipado/ })
    .click();
  await page.getByRole("button", { name: "Volver al título" }).waitFor();
  report("Ruta corta y final anticipado explícito");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: results,
        graphics,
        performance: (await inspect()).performance,
        errors,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(
    JSON.stringify(
      {
        passed: results,
        graphics,
        routes,
        state: await inspect().catch(() => null),
        errors,
      },
      null,
      2,
    ),
  );
  mkdirSync("docs/capturas/fase32", { recursive: true });
  await page
    .screenshot({ path: "docs/capturas/fase32/browser-smoke-failure.png" })
    .catch(() => {});
  throw e;
} finally {
  await browser.close();
}
