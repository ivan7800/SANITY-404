import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  closeElectron,
  launchElectron,
  mainFailures,
  menuReady,
  snapshot,
  verifyBundledResources,
  waitForGame,
  waitForMenu,
} from "./phase34-electron-qa.mjs";

const outputDir = path.resolve(
  process.argv.find((arg) => arg.startsWith("--output-dir="))?.slice(13) ??
    "docs/capturas/fase34/electron-native",
);
const stamp = new Date().toISOString().replaceAll(":", "-");
const userData = await mkdtemp(path.join(os.tmpdir(), "sanity34-electron-"));
const report = {
  startedAt: new Date().toISOString(),
  checks: [],
  runs: [],
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
  for (let run = 1; run <= 2; run++) {
    ({ app, page } = await launchElectron(userData, report));
    await page.waitForURL("sanity://game/index.html", { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    const resources = await verifyBundledResources(page);
    await waitForMenu(page);
    const before = await snapshot(app, page);
    report.runs.push({ run, before, resources });
    check(
      `Ventana visible en arranque ${run}`,
      before.main.visible,
      before.main,
    );
    check(
      `Documento local cargado en arranque ${run}`,
      before.main.url === "sanity://game/index.html" &&
        before.renderer.readyState === "complete",
      before,
    );
    check(
      `Recursos locales 200 en arranque ${run}`,
      resources.every((item) => item.status === 200),
      resources,
    );
    check(`Menú visible en arranque ${run}`, menuReady(before), before);
    const failures = mainFailures(before.main.events);
    check(
      `Sin fallos de carga ni renderer en arranque ${run}`,
      failures.length === 0,
      failures,
    );
    await page.screenshot({
      path: path.join(outputDir, `menu-${run}-${stamp}.png`),
    });

    if (run === 1) {
      await page
        .getByRole("button", { name: "Nueva partida", exact: true })
        .click();
      await waitForGame(page);
      const game = await snapshot(app, page);
      report.runs[0].game = game;
      check(
        "Nueva partida jugable",
        game.renderer.overlayHidden &&
          game.renderer.canvas &&
          game.renderer.body.content.includes("SALUD"),
        game.renderer,
      );
      await page.evaluate(() =>
        localStorage.setItem("sanity34-qa-origin", "persisted"),
      );
      await page.screenshot({
        path: path.join(outputDir, `nueva-partida-${stamp}.png`),
      });
    } else {
      const saved = await page.evaluate(() =>
        localStorage.getItem("sanity34-qa-origin"),
      );
      check(
        "Almacenamiento conservado tras cerrar y reabrir",
        saved === "persisted",
        { saved },
      );
    }
    await closeElectron(app, report);
    app = undefined;
    page = undefined;
    check(`Cierre de aplicación ${run}`, true);
  }
  check("Sin errores JavaScript", report.errors.length === 0, report.errors);
  report.completed = true;
} catch (error) {
  report.failure = { message: String(error), stack: error.stack };
  console.error(`FAIL Electron: ${error.stack || error}`);
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
