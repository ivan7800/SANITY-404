import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const out = "docs/capturas/fase17/auditoria";
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
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const state = () => page.evaluate(() => window.sanityInspect().state);
async function move(key, predicate, timeout = 30000) {
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(predicate, null, { timeout });
  } finally {
    await page.keyboard.up(key);
  }
}
const steps = [];
try {
  await page.addInitScript(() => {
    if (!localStorage.getItem("sanity404-save"))
      localStorage.setItem(
        "sanity404-save",
        JSON.stringify({
          version: 1,
          room: 0,
          x: 5,
          z: -1.5,
          floor: 0,
          health: 100,
          sanity: 100,
          items: [],
          collected: [],
          read: [],
          defeated: [
            "enemy0",
            "mansion-guest",
            "mansion-widow",
            "mansion-crawler",
            "mansion-reflection",
            "mansion-root",
          ],
          seals: [],
          elapsed: 0,
          ended: false,
        }),
      );
    localStorage.setItem(
      "sanity404-settings",
      JSON.stringify({
        quality: 1,
        volume: 0,
        reduced: false,
        cameraMode: "classic",
      }),
    );
  });
  await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect?.().draw.frame > 5);
  steps.push({ at: "inicio", ...(await state()) });
  await move("w", () => window.sanityInspect().state.floor === 1);
  steps.push({ at: "escalera", ...(await state()) });
  await page.screenshot({ path: `${out}/recorrido-escalera.png` });
  await move("w", () => window.sanityInspect().state.z < -5.75);
  await move("a", () => window.sanityInspect().state.x < -4.9);
  await move("s", () => window.sanityInspect().state.z > -3.1);
  steps.push({ at: "retratos", ...(await state()) });
  await page.screenshot({ path: `${out}/recorrido-retratos.png` });
  await move("w", () => window.sanityInspect().state.z < -5.75);
  await move("d", () => window.sanityInspect().state.x > -1.4);
  await move("s", () => window.sanityInspect().state.z > -3.1);
  steps.push({ at: "observatorio", ...(await state()) });
  await page.screenshot({ path: `${out}/recorrido-observatorio.png` });
  await move("w", () => window.sanityInspect().state.z < -5.75);
  await move("d", () => window.sanityInspect().state.x > 1.9);
  await page.keyboard.press("e");
  await page.waitForTimeout(200);
  const saved = JSON.parse(
    await page.evaluate(() => localStorage.getItem("sanity404-save")),
  );
  assert.equal(saved.floor, 1);
  steps.push({ at: "guardado", ...saved });
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect?.().draw.frame > 5);
  const loaded = await state();
  assert.equal(loaded.floor, 1);
  assert.equal(loaded.x, saved.x);
  assert.equal(loaded.z, saved.z);
  steps.push({ at: "recarga", ...loaded });
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/recorrido-planta-superior.json`,
    JSON.stringify({ date: new Date().toISOString(), steps, errors }, null, 2),
  );
  console.log(
    "PASS escalera, retratos, observatorio, guardado y recarga en planta superior",
  );
} finally {
  await browser.close();
}
