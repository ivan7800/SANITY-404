import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL ?? "http://127.0.0.1:5180/SANITY-404/";
const outputDir = path.resolve(
  process.env.SANITY_WEBGL_OUTPUT ?? "docs/capturas/fase35/webgl-production",
);
const report = {
  url,
  browserVersion: null,
  checks: [],
  errors: [],
};
let browser;
let page;
const check = (name, condition, details) => {
  assert.ok(condition, `${name}: ${JSON.stringify(details ?? null)}`);
  report.checks.push(name);
  console.log(`PASS ${name}`);
};
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    ...browserLaunchOptions(),
  });
  report.browserVersion = browser.version();
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    report.errors.push(`${request.url()}: ${request.failure()}`),
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      report.errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  page.on("crash", () => report.errors.push("Renderer crashed"));
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  check("Página HTTP 200", response?.status() === 200, response?.status());
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector("#overlay")?.hidden &&
      document.querySelector("#viewport canvas")?.width > 0,
  );
  check("Partida iniciada", true);
  const extension = await page.evaluate(() => {
    const canvas = document.querySelector("#viewport canvas");
    const gl = canvas?.getContext("webgl2");
    const webglLoss = gl?.getExtension("WEBGL_lose_context");
    if (!webglLoss) return false;
    window.__phase35WebglEvents = [];
    canvas.addEventListener("webglcontextlost", (event) => {
      window.__phase35WebglEvents.push({
        type: event.type,
        defaultPrevented: event.defaultPrevented,
      });
    });
    canvas.addEventListener("webglcontextrestored", (event) => {
      window.__phase35WebglEvents.push({ type: event.type });
    });
    window.__phase35WebglLoss = webglLoss;
    webglLoss.loseContext();
    return true;
  });
  check("Extensión WEBGL_lose_context", extension);
  await page.getByRole("heading", { name: "Gráficos interrumpidos" }).waitFor();
  check(
    "Aviso de contexto perdido",
    await page.locator("#overlay").isVisible(),
  );
  await page.evaluate(() => window.__phase35WebglLoss.restoreContext());
  const resume = page.getByRole("button", {
    name: "Volver al juego",
    exact: true,
  });
  await resume.waitFor({ state: "visible" });
  const events = await page.evaluate(() => window.__phase35WebglEvents);
  check(
    "Eventos de pérdida y restauración",
    events.length === 2 &&
      events[0].type === "webglcontextlost" &&
      events[0].defaultPrevented === true &&
      events[1].type === "webglcontextrestored",
    events,
  );
  await resume.click();
  await page.waitForFunction(() => document.querySelector("#overlay")?.hidden);
  check("Partida reanudada", true);
  await page.setViewportSize({ width: 960, height: 640 });
  await page.waitForFunction(
    () =>
      document.querySelector("#viewport canvas")?.getBoundingClientRect()
        .width === 960,
  );
  check("Canvas redimensionado", true);
  check(
    "Sin errores JS ni recursos fallidos",
    report.errors.length === 0,
    report.errors,
  );
  report.events = events;
  await mkdir(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "restaurado.png") });
} catch (error) {
  report.failure = String(error.stack ?? error);
  process.exitCode = 1;
  console.error(`FAIL WebGL producción: ${error.stack ?? error}`);
  await mkdir(outputDir, { recursive: true });
  if (page)
    await page
      .screenshot({ path: path.join(outputDir, "fallo.png") })
      .catch((cause) => report.errors.push(`screenshot: ${cause}`));
} finally {
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "resultado.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await browser?.close();
}
