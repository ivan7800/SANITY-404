/** Isolated adversarial save QA. Never uses the player's Chrome profile. */
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { browserLaunchOptions } from "./browser-launch.mjs";

const option = (name, fallback) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3) ?? fallback;
const url = option(
  "url",
  process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/",
);
const output = option("output-dir", "docs/capturas/fase32/guardados-nativo");
mkdirSync(output, { recursive: true });
const report = {
  startedAt: new Date().toISOString(),
  url,
  storage: "contexto Playwright aislado; nunca perfil del usuario",
  checks: [],
  errors: [],
  completed: false,
};
let browser;
let context;
let page;
const check = (label, passed, details = {}) => {
  report.checks.push({ label, passed: Boolean(passed), details });
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  assert.ok(passed, `${label}: ${JSON.stringify(details)}`);
};
const inspect = () => page.evaluate(() => window.sanityInspect());
async function caseSave(label, state, shouldContinue) {
  await page.evaluate(
    (raw) => localStorage.setItem("sanity404-save", raw),
    JSON.stringify(state),
  );
  await page.reload();
  await page.locator("#load").waitFor();
  const enabled = await page.locator("#load").isEnabled();
  check(label, enabled === shouldContinue, { enabled, shouldContinue });
}

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    ...browserLaunchOptions(),
  });
  context = await browser.newContext({ viewport: { width: 960, height: 640 } });
  page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.sanityInspect));
  const fresh = (await inspect()).state;

  await caseSave(
    "Guardado muerto no habilita Continuar",
    { ...fresh, health: 0 },
    false,
  );
  await page.screenshot({ path: join(output, "guardado-muerto-menu.png") });
  await caseSave(
    "Tónico duplicado no habilita Continuar",
    { ...fresh, items: ["Tónico 0", "Tónico 0"] },
    false,
  );
  await caseSave(
    "Campaña v2 incompleta no habilita Continuar",
    { ...fresh, campaign: undefined },
    false,
  );
  await caseSave(
    "Isabelle temprana legítima conserva Continuar",
    {
      ...fresh,
      campaign: {
        visited: ["mansion-1927", "abbey-1348"],
        completed: ["abbey-1348"],
        witnessed: [],
      },
    },
    true,
  );

  const old = {
    ...fresh,
    version: 1,
    room: 8,
    health: 12,
    items: ["Tónico 0"],
  };
  delete old.campaign;
  await caseSave("Guardado v1 válido habilita Continuar", old, true);
  await page.locator("#load").click();
  await page.waitForFunction(() => {
    const s = window.sanityInspect();
    return s.started && s.state.room === 8;
  });
  const migrated = await inspect();
  check(
    "Continuar migra v1 conservando sala, salud e inventario",
    migrated.state.version === 2 &&
      migrated.state.room === 8 &&
      migrated.state.health === 12 &&
      migrated.state.items.includes("Tónico 0"),
    {
      version: migrated.state.version,
      room: migrated.state.room,
      health: migrated.state.health,
      items: migrated.state.items,
    },
  );

  await caseSave(
    "Guardado muerto sigue sin habilitar Continuar",
    { ...fresh, health: 0 },
    false,
  );
  await page.locator("#new").click();
  await page.waitForFunction(() => {
    const s = window.sanityInspect();
    return s.started && !s.paused && s.state.room === 0 && s.state.elapsed > 0;
  });
  const newGame = await inspect();
  check(
    "Nueva partida tras guardado corrupto empieza con 100 de salud",
    newGame.state.health === 100,
    {
      room: newGame.state.room,
      health: newGame.state.health,
    },
  );
  await page.screenshot({
    path: join(output, "nueva-partida-tras-corrupcion.png"),
  });
  check("Sin errores JavaScript", report.errors.length === 0, report.errors);
  report.completed = true;
} catch (error) {
  report.errors.push({
    type: "failure",
    message: String(error),
    stack: error.stack,
  });
  console.error(`FAIL guardados F32: ${error}`);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(
    join(output, "recorrido.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await context?.close();
  await browser?.close();
  console.log(`RESULTADO GUARDADOS F32: ${process.exitCode || 0}`);
}
