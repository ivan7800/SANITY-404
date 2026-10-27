import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const bundledChrome = chromium.executablePath();
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (existsSync(bundledChrome) ? bundledChrome : "/usr/bin/google-chrome"),
  ...browserLaunchOptions(),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.waitForFunction(() => window.sanityInspect().state.elapsed > 0.1);
  await page.evaluate(() => {
    const gl = document.querySelector("#viewport canvas").getContext("webgl2");
    const extension = gl.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("WEBGL_lose_context no disponible");
    window.phase10LoseContext = extension;
    extension.loseContext();
  });
  await page.getByRole("heading", { name: "Gráficos interrumpidos" }).waitFor();
  assert.equal(
    (await page.evaluate(() => window.sanityInspect())).paused,
    true,
  );
  await page.evaluate(() => {
    window.phase10LoseContext.restoreContext();
  });
  await page.getByRole("button", { name: "Volver", exact: true }).waitFor();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  const before = await page.evaluate(
    () => window.sanityInspect().state.elapsed,
  );
  await page.waitForFunction(
    (elapsed) => window.sanityInspect().state.elapsed > elapsed + 0.1,
    before,
  );
  await page.setViewportSize({ width: 960, height: 640 });
  await page.waitForFunction(
    () => window.sanityInspect().canvas.rect.width === 960,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS pérdida y recuperación WebGL, reanudación y redimensionamiento",
  );
} finally {
  await browser.close();
}
