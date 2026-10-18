import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

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
      "sanity404-save",
      JSON.stringify({
        version: 1,
        room: 6,
        x: 0,
        z: 0,
        health: 100,
        sanity: 85,
        items: [],
        collected: [],
        read: [],
        defeated: [],
        seals: [],
        elapsed: 0,
        ended: false,
        phase2: {
          visited: [0, 6],
          solved: [],
          steps: [0, 0, 0, 0],
          discoveries: [],
          shortcuts: [],
          ending: false,
        },
      }),
    );
    localStorage.setItem(
      "sanity404-settings",
      JSON.stringify({ quality: 1, volume: 0, reduced: true }),
    );
  });
  await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector("#location")?.textContent ===
      "Invernadero de vidrio negro",
  );
  await page.keyboard.down("w");
  await page.waitForTimeout(900);
  await page.keyboard.up("w");
  const result = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl2");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
      canvas: [canvas.width, canvas.height],
      hud: document.querySelector("#hud")?.getBoundingClientRect().width,
      observerAbsent: window.sanityInspect === undefined,
      title: document.querySelector("#location")?.textContent,
    };
  });
  assert.match(result.renderer, /Intel.*620/);
  assert.deepEqual(result.canvas, [1024, 576]);
  assert.ok(result.hud > 0);
  assert.equal(result.observerAbsent, true);
  assert.deepEqual(errors, []);
  fs.mkdirSync("docs/capturas/fase2", { recursive: true });
  await page.screenshot({
    path: "docs/capturas/fase2/produccion-invernadero.png",
  });
  fs.writeFileSync(
    "docs/capturas/fase2/produccion.json",
    JSON.stringify({ ...result, errors }, null, 2),
  );
  console.log("PASS producción Fase 2", result);
} finally {
  await browser.close();
}
