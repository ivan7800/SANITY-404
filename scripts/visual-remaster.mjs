import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve(import.meta.dirname, ".."),
  out = path.join(root, "docs/capturas/fase15");
fs.mkdirSync(out, { recursive: true });
const server = JSON.parse(
  fs.readFileSync(path.join(root, ".sanity-launcher/server.json"), "utf8"),
);
const hardware = process.argv.includes("--hardware");
const active = process.argv.includes("--active");
const integrated = process.argv.includes("--integrated");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: hardware
    ? [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=gl",
        "--ignore-gpu-blocklist",
        "--enable-gpu",
      ]
    : [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
});
const base = {
  version: 1,
  room: 0,
  x: 0,
  z: 5,
  health: 100,
  sanity: 100,
  items: [],
  collected: [],
  read: [],
  defeated: [],
  seals: [],
  elapsed: 0,
  ended: false,
};
const errors = [],
  records = [];
async function load(width, height, quality, z = 5, fighting = false) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.addInitScript(
    ({ quality, state }) => {
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({ quality, volume: 0, reduced: false }),
      );
      localStorage.setItem("sanity404-save", JSON.stringify(state));
    },
    { quality, state: { ...base, z, defeated: fighting ? [] : ["enemy0"] } },
  );
  await page.goto(server.url);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect().draw.frame > 4);
  return { context, page };
}
try {
  if (hardware) {
    const { context, page } = await load(800, 600, 1.3);
    const gpu = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2"),
        ext = gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    });
    console.log("HARDWARE_GPU", gpu);
    assert.ok(!/SwiftShader|llvmpipe|Software/i.test(gpu));
    await context.close();
    if (process.argv.includes("--probe")) {
      await browser.close();
      process.exit(0);
    }
  }
  for (const [name, z] of active || integrated
    ? []
    : [
        ["entrada", 5],
        ["umbral", -6],
      ]) {
    const { context, page } = await load(800, 600, 1.3, z);
    await page.screenshot({ path: path.join(out, `fase15-${name}.png`) });
    const s = await page.evaluate(() => window.sanityInspect());
    const expected = name === "entrada" ? [6.8, 4.3, 7.25] : [5.9, 4.6, -0.2];
    assert.ok(s.camera.every((v, i) => Math.abs(v - expected[i]) < 1e-6));
    records.push({ capture: name, ...s });
    console.log(
      "CAPTURE",
      name,
      JSON.stringify({
        camera: s.camera,
        triangles: s.draw.triangles,
        calls: s.draw.calls,
        corrected: s.cameraCorrected,
      }),
    );
    await context.close();
  }
  if (process.argv.includes("--benchmark")) {
    for (const [width, height] of [
      [1280, 720],
      [1920, 1080],
    ])
      for (const quality of integrated
        ? [1]
        : active
          ? width === 1280
            ? [1.3]
            : [1]
          : [1, 1.3, 1.6]) {
        const { context, page } = await load(
          width,
          height,
          quality,
          active ? 0 : 5,
          active,
        );
        if (active) await page.keyboard.down("f");
        if (hardware) {
          await page.waitForFunction(
            () => window.sanityInspect().draw.frame > 30,
          );
          await page.evaluate(() => window.sanityResetMetrics());
        }
        await page.waitForFunction(
          (count) => window.sanityInspect().performance.samples >= count,
          hardware ? 600 : 65,
          { timeout: 240000 },
        );
        const s = await page.evaluate(() => {
          const canvas = document.querySelector("canvas"),
            gl = canvas.getContext("webgl2"),
            ext = gl.getExtension("WEBGL_debug_renderer_info");
          return {
            ...window.sanityInspect(),
            gpu: ext
              ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
              : gl.getParameter(gl.RENDERER),
            heap: performance.memory
              ? {
                  used: performance.memory.usedJSHeapSize,
                  total: performance.memory.totalJSHeapSize,
                }
              : null,
          };
        });
        if (quality === 1.3)
          await page.screenshot({
            path: path.join(
              out,
              active ? "fase15-combate.png" : `fase15-${height}p.png`,
            ),
          });
        records.push({ benchmark: true, active, width, height, ...s });
        console.log(
          "BENCHMARK",
          width,
          height,
          s.quality.name,
          JSON.stringify({
            performance: s.performance,
            draw: s.draw,
            memory: s.memory,
            gpu: s.gpu,
          }),
        );
        await context.close();
      }
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(
      out,
      hardware
        ? integrated
          ? active
            ? "mediciones-integrada.json"
            : "mediciones-integrada-reposo.json"
          : active
            ? "mediciones-combate.json"
            : "mediciones.json"
        : "mediciones-swiftshader.json",
    ),
    JSON.stringify(
      {
        environment: hardware
          ? "Chrome headless / Intel HD Graphics 620 · hardware verificado"
          : "Chrome headless / SwiftShader · software",
        records,
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
