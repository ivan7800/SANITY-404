import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

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
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
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
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector("#overlay")?.hidden &&
      !!document.querySelector("canvas"),
  );
  await page.waitForTimeout(600);
  const result = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl2");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
      canvas: [canvas.width, canvas.height],
      hud: document.querySelector("#hud")?.getBoundingClientRect().width,
      observerAbsent: window.sanityInspect === undefined,
    };
  });
  assert.match(result.renderer, /Intel.*620/);
  assert.deepEqual(result.canvas, [1024, 576]);
  assert.ok(result.hud > 0);
  assert.equal(result.observerAbsent, true);
  await page.screenshot({ path: "docs/capturas/fase17/production-smoke.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS compilación de producción renderizada en Chrome Intel HD 620",
    result,
  );
} finally {
  await browser.close();
}
