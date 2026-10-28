/** Native UI and preference regression. Uses an isolated browser context. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/";
const output = process.env.SANITY_PHASE33_OUTPUT || "docs/capturas/fase33";
mkdirSync(output, { recursive: true });
const report = { url, checks: [], errors: [], finished: false };
let browser;
let context;
let page;
const check = (name, value, details) => {
  report.checks.push({ name, passed: Boolean(value), details });
  console.log(`${value ? "PASS" : "FAIL"} ${name}`);
  assert.ok(value, `${name}: ${JSON.stringify(details)}`);
};
const inspect = () => page.evaluate(() => window.sanityInspect());

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    ...browserLaunchOptions(),
  });
  context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.sanityInspect));
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  await page.locator("#large-text").check();
  await page.locator("#quality").selectOption("1");
  await page.screenshot({ path: join(output, "ajustes-texto-390x844.png") });
  await page.getByRole("button", { name: "Aplicar y volver" }).click();
  const saved = await page.evaluate(() => ({
    largeText: document.documentElement.classList.contains("large-text"),
    settings: JSON.parse(localStorage.getItem("sanity404-settings")),
  }));
  check(
    "Texto ampliado y perfil Bajo aplicados",
    saved.largeText && saved.settings.largeText && saved.settings.quality === 1,
    saved,
  );

  await page.reload();
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  const persisted = {
    largeText: await page.locator("#large-text").isChecked(),
    quality: await page.locator("#quality").inputValue(),
  };
  check(
    "Preferencias conservadas tras recarga",
    persisted.largeText && persisted.quality === "1",
    persisted,
  );
  await page.getByRole("button", { name: "Aplicar y volver" }).click();
  const menuFrame = (await inspect()).draw.frame;
  await page.getByRole("button", { name: "Nueva partida" }).click();
  await page.waitForFunction(
    (previousFrame) => {
      const s = window.sanityInspect();
      return (
        s.started &&
        !s.paused &&
        s.overlayHidden &&
        s.state.health === 100 &&
        s.state.elapsed > 0 &&
        s.draw.frame > previousFrame
      );
    },
    menuFrame,
    { timeout: 10000 },
  );
  const hud = await page.evaluate(() => ({
    objectiveSize: parseFloat(
      getComputedStyle(document.querySelector("#objective")).fontSize,
    ),
    quality: window.sanityInspect().quality.name,
  }));
  check(
    "HUD ampliado durante una partida real",
    hud.objectiveSize >= 16 && hud.quality === "Baja",
    hud,
  );
  await page.keyboard.press("Tab");
  await page.getByRole("heading", { name: "Inventario y diario" }).waitFor();
  const panel = await page.locator("#panel").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      paragraphSize: parseFloat(
        getComputedStyle(element.querySelector("p")).fontSize,
      ),
      left: bounds.left,
      right: bounds.right,
      viewport: innerWidth,
      scrollable: element.scrollHeight > element.clientHeight,
    };
  });
  check(
    "Diario legible y contenido dentro de la pantalla móvil",
    panel.paragraphSize >= 16 &&
      panel.left >= 0 &&
      panel.right <= panel.viewport,
    panel,
  );
  await page.screenshot({ path: join(output, "diario-texto-390x844.png") });
  await page.locator("#close").click();
  const beforeQuality = (await inspect()).state;
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  await page.locator("#quality").selectOption("1.3");
  await page.getByRole("button", { name: "Aplicar y volver" }).click();
  const afterQuality = await inspect();
  check(
    "Cambio Bajo a Medio conserva la partida",
    afterQuality.quality.name === "Media" &&
      afterQuality.state.room === beforeQuality.room &&
      afterQuality.state.health === beforeQuality.health &&
      JSON.stringify(afterQuality.state.items) ===
        JSON.stringify(beforeQuality.items) &&
      JSON.stringify(afterQuality.state.campaign) ===
        JSON.stringify(beforeQuality.campaign),
    {
      quality: afterQuality.quality.name,
      room: afterQuality.state.room,
      health: afterQuality.state.health,
    },
  );
  await page.reload();
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  check(
    "Perfil Medio y texto ampliado persisten tras reiniciar",
    (await page.locator("#quality").inputValue()) === "1.3" &&
      (await page.locator("#large-text").isChecked()),
  );
  check("Sin errores JavaScript", report.errors.length === 0, report.errors);
  report.finished = true;
} catch (error) {
  report.failure = { message: String(error), stack: error.stack };
  report.state = page ? await inspect().catch(() => null) : null;
  if (page)
    await page
      .screenshot({ path: join(output, "accesibilidad-fallo.png") })
      .catch(() => {});
  process.exitCode = 1;
  console.error(`FAIL accesibilidad F33: ${error}`);
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(
    join(output, "accesibilidad.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await context?.close();
  await browser?.close();
  console.log(`RESULTADO ACCESIBILIDAD F33: ${process.exitCode || 0}`);
}
