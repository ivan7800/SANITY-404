import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL ?? "http://127.0.0.1:5180/SANITY-404/";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  ...browserLaunchOptions(),
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();
const failures = [];
page.on("pageerror", (error) => failures.push(`JavaScript: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`Console: ${message.text()}`);
});
page.on("requestfailed", (request) =>
  failures.push(`Resource: ${request.url()} ${request.failure()}`),
);
page.on("response", (response) => {
  if (response.status() >= 400)
    failures.push(`HTTP ${response.status()}: ${response.url()}`);
});

const waitForGame = () =>
  page.waitForFunction(() => {
    const curtain = document.querySelector("#title-transition");
    const canvas = document.querySelector("#viewport canvas");
    return (
      document.querySelector("#overlay")?.hidden &&
      !curtain?.classList.contains("title-transition--closed") &&
      canvas?.width > 0 &&
      canvas?.height > 0
    );
  });

try {
  const response = await page.goto(url, { waitUntil: "load" });
  assert.equal(response?.status(), 200, "Página de producción");
  assert.ok(new URL(page.url()).pathname.startsWith("/SANITY-404/"));
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await waitForGame();
  console.log("PASS recursos, menú y Nueva partida");

  await page.keyboard.down("a");
  try {
    await page.waitForFunction(
      () =>
        document
          .querySelector("#prompt")
          ?.textContent?.includes("Escritorio de memoria"),
      null,
      { timeout: 10000 },
    );
  } finally {
    await page.keyboard.up("a");
  }
  await page.keyboard.press("e");
  await page.waitForFunction(() =>
    document
      .querySelector("#toast")
      ?.textContent?.includes("Memoria conservada"),
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sanity404-save") || "null"),
  );
  assert.equal(saved?.version, 2);
  assert.equal(saved?.room, 0);
  assert.ok(saved?.x < -0.05);
  console.log("PASS navegación y guardado real");

  await page.reload({ waitUntil: "load" });
  const load = page.getByRole("button", { name: "Continuar", exact: true });
  await load.waitFor({ state: "visible" });
  assert.equal(await load.isEnabled(), true);
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sanity404-save") || "null"),
  );
  assert.equal(persisted?.x, saved.x);
  await load.click();
  await waitForGame();
  console.log("PASS recarga y Continuar");
  assert.deepEqual(failures, []);
  console.log("PASS sin errores JavaScript ni recursos fallidos");
} finally {
  await browser.close();
}
