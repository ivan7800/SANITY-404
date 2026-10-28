import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/";
const output =
  process.env.SANITY_MANSION_STAIR_OUTPUT ||
  "docs/capturas/fase23/mansion-escalera/qa-browser";
mkdirSync(output, { recursive: true });
const report = {
  url,
  startedAt: new Date().toISOString(),
  hardwareRequested: process.env.SANITY_HARDWARE === "1",
  route: [],
  checks: [],
  errors: [],
  completed: false,
};
let browser;
let page;
const inspect = () => page.evaluate(() => window.sanityInspect());
const check = (label, condition, detail) => {
  report.checks.push({ label, passed: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"} ${label}`);
  assert.ok(condition, `${label}: ${JSON.stringify(detail)}`);
};
async function step(axis, target, key, label) {
  report.currentStep = label;
  const before = (await inspect()).state;
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ axis, target, positive }) => {
        const game = window.sanityInspect();
        if (game.paused || game.state.health <= 0) return false;
        return positive
          ? game.state[axis] >= target - 0.08
          : game.state[axis] <= target + 0.08;
      },
      { axis, target, positive: key === "d" || key === "s" },
      { timeout: 10000 },
    );
  } finally {
    await page.keyboard.up(key);
  }
  const after = (await inspect()).state;
  report.route.push({ label, key, target, before, after });
  check(label, after.health > 0 && !after.ended, {
    x: after.x,
    z: after.z,
    floor: after.floor,
    health: after.health,
  });
}

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    ...browserLaunchOptions(),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(new URL("?qa=1", url).href, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() => Boolean(window.sanityQa));
  await page.evaluate(() => {
    window.sanityQa.openRoom(0);
    window.sanityQa.position(5, -1.3);
    // Development-only photography mode isolates architecture from combat.
    // Every subsequent position in the traversal comes from keyboard controls.
    window.sanityQa.architectureView([5, 3.2, 0], [5, 3.6, -5]);
  });
  check(
    "Inicio de diagnóstico en el pie de la escalera",
    (await inspect()).state.floor === 0,
  );
  await step("z", -4.95, "w", "Subir hasta el último tramo inferior");
  const stairBeforeLanding = await inspect();
  check(
    "La carta del rellano no se selecciona desde otra planta",
    stairBeforeLanding.state.floor === 0 &&
      stairBeforeLanding.interaction?.id !== "gallery-chart",
    {
      floor: stairBeforeLanding.state.floor,
      position: [stairBeforeLanding.state.x, stairBeforeLanding.state.z],
      interaction: stairBeforeLanding.interaction,
    },
  );
  await step("z", -5.55, "w", "Completar la subida por la escalera");
  check(
    "Desembarco alcanzado por movimiento real",
    (await inspect()).state.floor === 1,
  );
  await step("x", 5.3, "d", "Girar en el descansillo");
  check(
    "Carta astral seleccionada en el rellano",
    (await inspect()).interaction?.id === "gallery-chart",
    (await inspect()).interaction,
  );
  await page.keyboard.press("e");
  await page
    .getByRole("heading", { name: "La bóveda de las cenizas" })
    .waitFor();
  check("Interacción real con la carta astral", (await inspect()).paused);
  await page.locator("#close").click();
  await page.waitForFunction(() => !window.sanityInspect().paused);
  await step("z", -5.2, "s", "Tomar el pasillo libre tras el descansillo");
  await step("x", 3.3, "a", "Rodear el atril y entrar en la galería");
  await step("z", -5.8, "w", "Alinear el corredor superior");
  await step("x", -5, "a", "Cruzar la galería hacia retratos");
  await step("z", -3, "s", "Entrar en la sala de retratos");
  await step("z", -5.8, "w", "Regresar de retratos");
  await step("x", -1.3, "d", "Cruzar hacia el observatorio");
  await step("z", -3, "s", "Entrar en el observatorio");
  await step("z", -5.8, "w", "Regresar del observatorio");
  await step("x", 3.3, "d", "Volver al extremo oriental de la galería");
  await step("z", -5.2, "s", "Rodear el borde abierto de la galería");
  await step("x", 5.3, "d", "Girar hacia el descansillo");
  await step("z", -5.8, "w", "Entrar de nuevo en el descansillo");
  await step("z", -1.3, "s", "Bajar la escalera completa");
  check("Regreso físico a planta baja", (await inspect()).state.floor === 0);
  check("Sin errores JavaScript", report.errors.length === 0, report.errors);
  report.completed = true;
} catch (error) {
  report.errors.push({ message: String(error), stack: error.stack });
  report.state = page ? await inspect().catch(() => null) : null;
  if (page)
    await page.screenshot({ path: join(output, "fallo.png") }).catch(() => {});
  console.error(`FAIL escalera Veyr: ${error.message}`);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(
    join(output, "recorrido.json"),
    JSON.stringify(report, null, 2),
  );
  await browser?.close().catch(() => {});
}
