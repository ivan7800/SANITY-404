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
const out = option("output-dir", "docs/capturas/remaster");
mkdirSync(out, { recursive: true });
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");
const report = {
  url,
  startedAt: new Date().toISOString(),
  checks: [],
  screenshots: [],
  errors: [],
  launchAttempts: [],
  completed: false,
  hardwareRequested: process.env.SANITY_HARDWARE === "1",
};
let browser;
let page;
const check = (label, condition, details) => {
  const passed = Boolean(condition);
  report.checks.push({ label, passed, details });
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  assert.ok(passed, `${label}: ${JSON.stringify(details)}`);
};
const screenshot = async (name) => {
  const path = join(out, `${name}.png`);
  await page.screenshot({ path });
  report.screenshots.push(path);
};
const noOverflow = () =>
  page.evaluate(() => {
    const panel = document.querySelector("#panel");
    const rect = panel.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      panelLeft: rect.left,
      panelRight: rect.right,
      panelTop: rect.top,
      panelBottom: rect.bottom,
      viewportHeight: innerHeight,
    };
  });
const checkLayout = async (label) => {
  const box = await noOverflow();
  check(
    label,
    box.documentWidth <= box.viewportWidth + 1 &&
      box.panelLeft >= -1 &&
      box.panelRight <= box.viewportWidth + 1 &&
      box.panelTop >= -1 &&
      box.panelBottom <= box.viewportHeight + 1,
    box,
  );
};
const inspect = () => page.evaluate(() => window.sanityInspect());
async function launchBrowser() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const instance = await chromium.launch({
        executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
        ...browserLaunchOptions(),
      });
      report.launchAttempts.push({ attempt, passed: true });
      return instance;
    } catch (error) {
      report.launchAttempts.push({
        attempt,
        passed: false,
        message: String(error),
      });
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Chromium no se ha iniciado");
}
try {
  browser = await launchBrowser();
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  page = await desktop.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#new").waitFor();
  check(
    "Menú real y acciones principales",
    (await page
      .getByRole("button", { name: "Nueva partida", exact: true })
      .isVisible()) &&
      (await page
        .getByRole("button", { name: "Opciones", exact: true })
        .isVisible()),
  );
  check(
    "Continuar y cargar desactivados sin partida",
    (await page.locator("#load").isDisabled()) &&
      (await page.locator("#load-menu").isDisabled()),
  );
  check(
    "Portada cinematográfica muestra escena original y lema",
    (await page.locator("#overlay.overlay--title #title-scene").isVisible()) &&
      (await page.getByText("ARCHIVO DE LAS AUSENCIAS · 1927").isVisible()) &&
      (await page.getByText(/LO QUE OLVIDAS/).isVisible()) &&
      (await page.evaluate(() =>
        getComputedStyle(
          document.querySelector("#title-scene"),
        ).backgroundImage.includes("menu-hall"),
      )),
  );
  check(
    "Nueva partida recibe foco inicial",
    await page
      .locator("#new")
      .evaluate((button) => button === document.activeElement),
  );
  await page.keyboard.press("Tab");
  check(
    "Menú principal navegable con Tab",
    await page
      .locator("#settings")
      .evaluate((button) => button === document.activeElement),
  );
  await page.keyboard.press("Shift+Tab");
  await checkLayout("Menú de escritorio sin desbordamiento");
  await screenshot("menu-1440x900");
  await page.setViewportSize({ width: 768, height: 1024 });
  await checkLayout("Menú de tableta sin desbordamiento");
  await screenshot("menu-768x1024");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Créditos" }).click();
  check(
    "Créditos navegables",
    await page
      .getByRole("heading", { name: "Los nombres que permanecen" })
      .isVisible(),
  );
  await screenshot("creditos-1440x900");
  await page.getByRole("button", { name: "Volver al título" }).click();
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  check(
    "Opciones y controles accesibles",
    (await page.locator("#quality").isVisible()) &&
      (await page.locator("#camera-mode").isVisible()),
  );
  await page.locator("#reduced").check();
  await screenshot("opciones-1440x900");
  await page.getByRole("button", { name: "Aplicar y volver" }).click();
  check(
    "Movimiento reducido desactiva animación del título",
    await page.evaluate(() => {
      const overlay = document.querySelector("#overlay");
      const scene = document.querySelector("#title-scene");
      return (
        overlay.classList.contains("overlay--reduced") &&
        getComputedStyle(scene).animationName === "none"
      );
    }),
  );
  await page.locator("#settings").click();
  await page.locator("#reduced").uncheck();
  await page.getByRole("button", { name: "Aplicar y volver" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  check(
    "Preferencia del sistema reduce movimiento del título",
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector("#title-scene"))
          .animationName === "none",
    ),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  check(
    "Nueva partida inicia fundido cinematográfico",
    await page
      .locator("#title-transition")
      .evaluate((curtain) =>
        curtain.classList.contains("title-transition--closed"),
      ),
  );
  await page.waitForFunction(() => window.sanityInspect().paused === false);
  check("Nueva partida desde el menú", (await inspect()).state.room === 0);
  await screenshot("hud-1440x900");
  await page.keyboard.press("Tab");
  await page.locator(".panel--inventory").waitFor();
  check(
    "Inventario y diario funcionales",
    (await page
      .getByRole("heading", { name: "Inventario y diario" })
      .isVisible()) && (await page.locator("#heal").isDisabled()),
  );
  await screenshot("inventario-1440x900");
  await page.getByText(/Documentos ·/).click();
  await screenshot("documentos-1440x900");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.sanityInspect().paused === false);
  const saveApproachStart = (await inspect()).state.x;
  report.currentStep = "Acercarse físicamente a save0";
  await page.keyboard.down("a");
  try {
    await page.waitForFunction(
      (startX) => {
        const game = window.sanityInspect();
        return (
          !game.paused &&
          game.state.x < startX - 0.1 &&
          game.interaction?.id === "save0"
        );
      },
      saveApproachStart,
      { timeout: 10000 },
    );
  } finally {
    await page.keyboard.up("a");
  }
  const saveApproach = await inspect();
  check(
    "Desplazamiento real hasta el perímetro del escritorio de guardado",
    saveApproach.state.x < saveApproachStart - 0.1 &&
      saveApproach.interaction?.id === "save0" &&
      !saveApproach.paused,
    {
      startX: saveApproachStart,
      x: saveApproach.state.x,
      z: saveApproach.state.z,
      interaction: saveApproach.interaction,
    },
  );
  report.currentStep = "Interactuar con save0 y observar el guardado";
  await page.keyboard.press("e");
  await page.waitForFunction(
    () => Boolean(localStorage.getItem("sanity404-save")),
    null,
    { timeout: 10000 },
  );
  check(
    "Guardado por interacción real",
    Boolean(await page.evaluate(() => localStorage.getItem("sanity404-save"))),
  );
  report.currentStep = "Abrir pantalla de carga y recuperar la partida";
  await page.keyboard.press("Escape");
  await page.locator("#load-menu").click();
  check(
    "Pantalla de carga presenta el guardado",
    await page.locator(".save-slot").isVisible(),
  );
  await screenshot("cargar-1440x900");
  await page.locator("#load-confirm").click();
  check(
    "Recarga desde la pantalla de carga",
    (await inspect()).state.room === 0 && !(await inspect()).paused,
  );
  await page.keyboard.press("Escape");
  await page.locator("#load").click();
  check(
    "Continuar utiliza el guardado existente",
    (await inspect()).state.room === 0 && !(await inspect()).paused,
  );
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  page = await mobile.newPage();
  report.currentStep = "Validar menú y controles móviles";
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#new").waitFor();
  await checkLayout("Menú móvil sin desbordamiento");
  await screenshot("menu-390x844");
  await page.locator("#new").tap();
  await page.waitForFunction(() => window.sanityInspect().paused === false);
  check(
    "Controles táctiles visibles en móvil",
    await page.locator("#touch-controls").isVisible(),
  );
  await screenshot("hud-390x844");
  const xBefore = (await inspect()).state.x;
  const move = page.locator('[data-touch-key="KeyD"]');
  const bounds = await move.boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  try {
    await page.waitForFunction(
      (x) => window.sanityInspect().state.x > x + 0.15,
      xBefore,
      { timeout: 10000 },
    );
  } finally {
    await page.mouse.up();
  }
  check("Movimiento táctil real", (await inspect()).state.x > xBefore + 0.15);
  await page.locator('[data-touch-key="Tab"]').tap();
  await page.waitForFunction(
    () =>
      window.sanityInspect().paused &&
      !document.querySelector("#overlay").hidden &&
      !!document.querySelector(".panel--inventory"),
  );
  check(
    "Diario accesible por control táctil",
    (await page.locator(".panel--inventory").isVisible()) &&
      (await page.locator("#touch-controls").isHidden()) &&
      (await inspect()).paused,
  );
  await checkLayout("Inventario móvil sin desbordamiento");
  await screenshot("inventario-390x844");
  await page.locator("#close").tap();
  await page.waitForFunction(
    () =>
      !window.sanityInspect().paused &&
      document.querySelector("#overlay").hidden &&
      !document.querySelector("#touch-controls").hidden,
  );
  check(
    "Diario táctil se cierra y devuelve control",
    (await page.locator("#touch-controls").isVisible()) &&
      !(await inspect()).paused,
  );
  check("Sin errores JavaScript", report.errors.length === 0, report.errors);
  report.completed = true;
  await mobile.close();
} catch (error) {
  report.errors.push({
    type: "failure",
    message: String(error),
    stack: error.stack,
  });
  console.error(`FAIL remaster UI: ${error.message}`);
  if (page) {
    report.state = await inspect().catch(() => null);
    report.ui = await page
      .evaluate(() => {
        const overlay = document.querySelector("#overlay");
        const panel = document.querySelector("#panel");
        return {
          activeElement:
            document.activeElement?.id || document.activeElement?.tagName,
          overlayHidden: overlay?.hidden,
          overlayClass: overlay?.className,
          panelClass: panel?.className,
          panelTitle: panel?.querySelector("h1,h2")?.textContent,
          prompt: document.querySelector("#prompt")?.textContent,
          toast: document.querySelector("#toast")?.textContent,
          savePresent: Boolean(localStorage.getItem("sanity404-save")),
        };
      })
      .catch(() => null);
    console.error(
      `DIAGNÓSTICO UI: ${JSON.stringify({ step: report.currentStep, state: report.state, ui: report.ui })}`,
    );
    await screenshot(`fallo-${runStamp}`).catch(() => {});
  }
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  const json = JSON.stringify(report, null, 2);
  writeFileSync(join(out, `ui-qa-${runStamp}.json`), json);
  writeFileSync(join(out, "ui-qa.json"), json);
  if (browser) await browser.close().catch(() => {});
}
