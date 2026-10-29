import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  closeElectron,
  launchElectron,
  mainFailures,
  snapshot,
  waitForGame,
  waitForMenu,
} from "./phase34-electron-qa.mjs";

const outputDir = path.resolve(
  process.argv.find((arg) => arg.startsWith("--output-dir="))?.slice(13) ??
    "docs/capturas/fase34/electron-save-native",
);
const stamp = new Date().toISOString().replaceAll(":", "-");
const userData = await mkdtemp(path.join(os.tmpdir(), "sanity34-save-"));
const report = {
  startedAt: new Date().toISOString(),
  checks: [],
  errors: [],
  completed: false,
};
process.on("unhandledRejection", (error) => {
  report.errors.push({ type: "unhandledRejection", message: String(error) });
  console.error(`FAIL promesa Electron sin manejar: ${error?.stack || error}`);
  process.exitCode = 1;
});
let app;
let page;
await mkdir(outputDir, { recursive: true });

function check(label, passed, details = {}) {
  report.checks.push({ label, passed: Boolean(passed), details });
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  assert.ok(passed, `${label}: ${JSON.stringify(details)}`);
}

try {
  ({ app, page } = await launchElectron(userData, report));
  await waitForMenu(page);
  check(
    "Continuar deshabilitado sin guardado",
    !(await page.locator("#load").isEnabled()),
  );
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await waitForGame(page);
  await page.keyboard.down("a");
  try {
    await page.waitForFunction(
      () => {
        const prompt = document.querySelector("#prompt");
        return (
          prompt &&
          getComputedStyle(prompt).display !== "none" &&
          prompt.textContent?.includes("Escritorio de memoria")
        );
      },
      null,
      { timeout: 10000 },
    );
  } finally {
    await page.keyboard.up("a");
  }
  check("Escritorio alcanzado con movimiento real", true);
  await page.keyboard.press("e");
  await page.waitForFunction(
    () =>
      document
        .querySelector("#toast")
        ?.textContent?.includes("Memoria conservada"),
    null,
    { timeout: 5000 },
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sanity404-save") || "null"),
  );
  check(
    "Partida guardada mediante E",
    saved?.version === 2 &&
      saved.room === 0 &&
      saved.x < -0.05 &&
      saved.health > 0,
    saved,
  );
  report.saved = {
    room: saved.room,
    x: saved.x,
    z: saved.z,
    health: saved.health,
    elapsed: saved.elapsed,
  };
  await page.screenshot({
    path: path.join(outputDir, `guardado-${stamp}.png`),
  });
  await closeElectron(app, report);
  app = undefined;
  page = undefined;
  check("Aplicación cerrada tras guardar", true);

  ({ app, page } = await launchElectron(userData, report));
  await waitForMenu(page);
  check(
    "Continuar habilitado al reabrir",
    await page.locator("#load").isEnabled(),
  );
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sanity404-save") || "null"),
  );
  check(
    "Guardado real conservado",
    persisted?.room === saved.room &&
      persisted.x === saved.x &&
      persisted.z === saved.z &&
      persisted.health === saved.health,
    persisted,
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await waitForGame(page);
  await page.waitForFunction(
    () =>
      document
        .querySelector("#prompt")
        ?.textContent?.includes("Escritorio de memoria"),
    null,
    { timeout: 5000 },
  );
  const loaded = await snapshot(app, page);
  check(
    "Carga devuelve al escritorio",
    loaded.renderer.overlayHidden &&
      loaded.renderer.body.content.includes("SALUD"),
    loaded.renderer,
  );
  const failures = mainFailures(loaded.main.events);
  check("Sin fallos de carga ni renderer", failures.length === 0, failures);
  check("Sin errores JavaScript", report.errors.length === 0, report.errors);
  await page.screenshot({ path: path.join(outputDir, `carga-${stamp}.png`) });
  await closeElectron(app, report);
  app = undefined;
  page = undefined;
  report.completed = true;
} catch (error) {
  report.failure = { message: String(error), stack: error.stack };
  console.error(`FAIL guardado Electron: ${error.stack || error}`);
  process.exitCode = 1;
  if (app && page) {
    report.failure.snapshot = await snapshot(app, page).catch((cause) => ({
      error: String(cause),
    }));
    await page
      .screenshot({ path: path.join(outputDir, `fallo-${stamp}.png`) })
      .catch(() => {});
  }
} finally {
  if (app)
    await closeElectron(app, report).catch((error) => {
      report.cleanupError = String(error);
      process.exitCode = 1;
    });
  report.finishedAt = new Date().toISOString();
  await writeFile(
    path.join(outputDir, `recorrido-${stamp}.json`),
    JSON.stringify(report, null, 2) + "\n",
  );
  await rm(userData, { recursive: true, force: true });
}
