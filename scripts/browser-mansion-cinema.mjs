import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/";
const output =
  process.env.SANITY_MANSION_CINEMA_OUTPUT ||
  "docs/capturas/fase25/navegador-linux-mint";
mkdirSync(output, { recursive: true });
const views = [
  { id: "entrada", floor: 0, x: 0, z: 4.5, zone: "entrada" },
  { id: "pie", floor: 0, x: 5, z: -1.3, zone: "pie de escalera Veyr" },
  { id: "mitad", floor: 0, x: 5, z: -3.35, zone: "escalera Veyr" },
  { id: "descansillo", floor: 1, x: 5.3, z: -5.8, zone: "rellano superior" },
  { id: "galeria", floor: 1, x: 2, z: -5.8, zone: "rellano superior" },
  { id: "retratos", floor: 1, x: -5, z: -3, zone: "sala de retratos superior" },
  {
    id: "observatorio",
    floor: 1,
    x: -1.3,
    z: -3,
    zone: "observatorio superior",
  },
];
const report = {
  url,
  startedAt: new Date().toISOString(),
  hardwareRequested: process.env.SANITY_HARDWARE === "1",
  views: [],
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
  await page.goto(new URL("?qa=1", url).href, {
    waitUntil: "domcontentloaded",
  });
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
  if (report.hardwareRequested)
    assert.match(
      String(report.renderer),
      /Intel/i,
      "No se detectó la GPU Intel",
    );

  for (const view of views) {
    await page.evaluate(({ floor, x, z }) => {
      window.sanityQa.openRoom(0, floor);
      window.sanityQa.position(x, z);
    }, view);
    await page.waitForFunction(
      ({ zone, floor }) => {
        const state = window.sanityInspect();
        return (
          state.cinematicZone === zone &&
          state.state.floor === floor &&
          !state.paused &&
          state.state.health > 0
        );
      },
      view,
      { timeout: 5000 },
    );
    // A fixed photographic exposure interval makes the camera's damped move
    // comparable between captures; correctness was established above.
    await page.waitForTimeout(350);
    const state = await page.evaluate(() => window.sanityInspect());
    assert.equal(state.state.room, 0);
    assert.equal(state.state.floor, view.floor);
    assert.equal(state.cinematicZone, view.zone);
    await page.screenshot({
      path: join(output, `${view.id}.png`),
      type: "png",
    });
    report.views.push({
      id: view.id,
      requested: { floor: view.floor, x: view.x, z: view.z },
      actual: {
        floor: state.state.floor,
        x: state.state.x,
        z: state.state.z,
        health: state.state.health,
      },
      camera: state.camera,
      cameraCorrected: state.cameraCorrected,
      zone: state.cinematicZone,
      enemy: state.combat.kind,
      interaction: state.interaction?.id ?? null,
    });
    console.log(`PASS cámara normal: ${view.id}`);
  }
  assert.equal(report.views.length, views.length);
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  report.completed = true;
} catch (error) {
  report.errors.push({ message: String(error), stack: error.stack });
  if (page)
    report.failureState = await page
      .evaluate(() => window.sanityInspect?.())
      .catch(() => null);
  console.error(`FAIL cámara mansión: ${error}`);
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(
    join(output, "recorrido.json"),
    JSON.stringify(report, null, 2),
  );
  await browser?.close();
}
process.exitCode = report.completed ? 0 : 1;
