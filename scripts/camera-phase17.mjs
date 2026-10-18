import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/",
  out = "docs/capturas/fase17";
fs.mkdirSync(out, { recursive: true });
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
const errors = [],
  records = [];
async function scene(mode, state) {
  const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    }),
    page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.addInitScript(
    ({ mode, state }) => {
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({
          quality: 1,
          volume: 0,
          reduced: false,
          cameraMode: mode,
        }),
      );
      localStorage.setItem("sanity404-save", JSON.stringify(state));
    },
    { mode, state },
  );
  await page.goto(url);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect().draw.frame > 8);
  return { context, page };
}
try {
  for (const mode of ["classic", "modern"]) {
    const { context, page } = await scene(mode, base);
    const before = await page.evaluate(() => window.sanityInspect());
    await page.screenshot({ path: `${out}/camera-${mode}.png` });
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.sanityInspect().state.z < 0.5,
      null,
      { timeout: 30000 },
    );
    await page.keyboard.up("w");
    const after = await page.evaluate(() => window.sanityInspect());
    assert.equal(before.cameraMode, mode);
    assert.ok(after.state.z < before.state.z - 4);
    assert.ok(after.camera[1] < 2.6);
    assert.equal(after.state.x, 0);
    records.push({
      mode,
      before: { camera: before.camera, zone: before.cinematicZone },
      after: {
        camera: after.camera,
        zone: after.cinematicZone,
        state: after.state,
      },
    });
    await context.close();
  }
  assert.ok(
    Math.abs(records[0].before.camera[0] - records[1].before.camera[0]) > 2,
  );
  const { context, page } = await scene("classic", {
    ...base,
    z: 0,
    defeated: [],
  });
  await page.waitForFunction(
    () => window.sanityInspect().enemy.position[0] < 2.8,
    null,
    { timeout: 30000 },
  );
  await page.keyboard.press("Escape");
  const before = await page.evaluate(() => window.sanityInspect());
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  await page.locator("#camera-mode").selectOption("modern");
  await page
    .getByRole("button", { name: "Aplicar y volver", exact: true })
    .click();
  const after = await page.evaluate(() => window.sanityInspect());
  assert.equal(after.cameraMode, "modern");
  assert.deepEqual(after.enemy.position, before.enemy.position);
  assert.equal(after.combat.enemyHealth, before.combat.enemyHealth);
  assert.equal(after.state.health, before.state.health);
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect().camera[0] > 0, null, {
    timeout: 30000,
  });
  records.push({
    switchDuringCombat: {
      before: { enemy: before.enemy, combat: before.combat },
      after: {
        enemy: after.enemy,
        combat: after.combat,
        mode: after.cameraMode,
      },
    },
  });
  await context.close();
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${out}/cameras.json`,
    JSON.stringify({ records, errors }, null, 2),
  );
  console.log(
    "PASS cámaras clásica y moderna, movimiento estable y cambio en combate sin reiniciar enemigo",
  );
} finally {
  await browser.close();
}
