import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = "docs/capturas/fase16";
fs.mkdirSync(out, { recursive: true });
const { url } = JSON.parse(fs.readFileSync(".sanity-launcher/server.json"));
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=gl",
    "--ignore-gpu-blocklist",
    "--enable-gpu",
  ],
});
const errors = [],
  records = [];
const base = {
  version: 1,
  room: 0,
  x: 0,
  z: 5,
  health: 100,
  sanity: 100,
  items: [],
  collected: [],
  read: [],
  defeated: ["enemy0"],
  seals: [],
  elapsed: 0,
  ended: false,
};
try {
  for (const scenario of [
    { name: "clasica", cameraMode: "classic" },
    { name: "moderna", cameraMode: "modern" },
    {
      name: "combate",
      cameraMode: "classic",
      state: { z: 0, defeated: [] },
      active: true,
    },
    {
      name: "pasillo",
      cameraMode: "classic",
      state: { room: 1, x: 6.3, z: 0, defeated: ["enemy1"] },
    },
    {
      name: "cordura",
      cameraMode: "classic",
      state: { sanity: 20, elapsed: 21 },
    },
  ]) {
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(
      ({ state, cameraMode }) => {
        localStorage.setItem(
          "sanity404-settings",
          JSON.stringify({ quality: 1, volume: 0, reduced: false, cameraMode }),
        );
        localStorage.setItem("sanity404-save", JSON.stringify(state));
      },
      {
        state: { ...base, ...scenario.state },
        cameraMode: scenario.cameraMode,
      },
    );
    await page.goto(url);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(() => window.sanityInspect().draw.frame > 35);
    if (scenario.active) {
      await page.keyboard.down("f");
      await page.waitForFunction(
        () => window.sanityInspect().combat.windup > 0,
        { timeout: 30000 },
      );
    }
    await page.screenshot({ path: `${out}/${scenario.name}.png` });
    const initial = await page.evaluate(() => window.sanityInspect());
    assert.equal(initial.cameraMode, scenario.cameraMode);
    assert.ok(initial.draw.triangles > 1000);
    assert.ok(initial.camera[1] < 2.6);
    // Hold one world-space direction through a zone change in each camera mode.
    if (scenario.name === "clasica" || scenario.name === "moderna") {
      await page.keyboard.down("w");
      await page.waitForFunction(() => window.sanityInspect().state.z < 0.5);
      await page.keyboard.up("w");
      assert.ok(
        (await page.evaluate(() => window.sanityInspect().state.z)) <
          initial.state.z,
      );
    }
    // Reset after warm-up; no slow frames discarded. Active includes approaching and guarding.
    if (scenario.name === "clasica" || scenario.active) {
      await page.evaluate(() => window.sanityResetMetrics());
      await page.waitForFunction(
        () => window.sanityInspect().performance.samples >= 600,
        null,
        { timeout: 120000 },
      );
    }
    const record = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2"),
        ext = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        ...window.sanityInspect(),
        gpu: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
      };
    });
    assert.ok(/Intel.*620/.test(record.gpu));
    records.push({ scenario: scenario.name, initial, ...record });
    console.log(
      scenario.name,
      JSON.stringify({
        camera: record.camera,
        performance: record.performance,
        gpu: record.gpu,
      }),
    );
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto(url);
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  await page.locator("#camera-mode").selectOption("modern");
  await page
    .getByRole("button", { name: "Aplicar y volver", exact: true })
    .click();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  assert.equal(
    await page.evaluate(() => window.sanityInspect().cameraMode),
    "modern",
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("sanity404-settings")).cameraMode,
    ),
    "modern",
  );
  await context.close();
  console.log("PASS selección y persistencia de cámara mediante Opciones");
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${out}/mediciones.json`,
    JSON.stringify(
      { date: new Date().toISOString(), records, errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
