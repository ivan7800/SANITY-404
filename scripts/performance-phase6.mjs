import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const url = process.env.SANITY_BENCH_URL || "http://127.0.0.1:5173/";
const output =
  process.env.SANITY_BENCH_OUTPUT ||
  "docs/capturas/fase6/benchmark-playwright.json";
const runs = Number(
  process.argv.find((arg) => arg.startsWith("--runs="))?.slice(7) || 2,
);
const frames = Number(
  process.argv.find((arg) => arg.startsWith("--frames="))?.slice(9) || 240,
);
assert.ok(Number.isInteger(runs) && runs > 0 && runs <= 20);
assert.ok(Number.isInteger(frames) && frames >= 60 && frames <= 3600);
const rooms = [0, 8, 9, 10];
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=gl",
    "--ignore-gpu-blocklist",
    "--enable-gpu",
    "--enable-precise-memory-info",
  ],
});
const results = [];
const quantile = (sorted, fraction) =>
  sorted[Math.floor((sorted.length - 1) * fraction)];

try {
  for (const room of rooms)
    for (let run = 1; run <= runs; run++) {
      const context = await browser.newContext({
        viewport: { width: 881, height: 793 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.addInitScript((roomNumber) => {
        localStorage.setItem(
          "sanity404-settings",
          JSON.stringify({ quality: 1, volume: 0, cameraMode: "classic" }),
        );
        localStorage.setItem(
          "sanity404-save",
          JSON.stringify({
            version: 1,
            room: roomNumber,
            x: 0,
            z: 0,
            health: 100,
            sanity: 100,
            items: [],
            collected: [],
            read: [],
            defeated: ["enemy" + roomNumber],
            seals: [],
            elapsed: 0,
            ended: false,
          }),
        );
      }, room);
      try {
        await page.goto(url);
        await page
          .getByRole("button", { name: "Continuar", exact: true })
          .click();
        await page.waitForFunction(
          () => window.sanityInspect().draw.frame > 60,
        );
        const sample = await page.evaluate(async (count) => {
          const frameTimes = [];
          let previous = 0;
          await new Promise((resolve) => {
            const tick = (now) => {
              if (previous) frameTimes.push(now - previous);
              previous = now;
              if (frameTimes.length >= count) resolve();
              else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          const inspect = window.sanityInspect();
          const gl = document.querySelector("canvas").getContext("webgl2");
          const debug = gl.getExtension("WEBGL_debug_renderer_info");
          return {
            frameTimes,
            room: inspect.state.room,
            renderer: debug
              ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
              : gl.getParameter(gl.RENDERER),
            canvas: {
              width: inspect.canvas.width,
              height: inspect.canvas.height,
            },
            draw: {
              calls: inspect.draw.calls,
              triangles: inspect.draw.triangles,
            },
            memory: { ...inspect.memory },
            jsHeap: performance.memory?.usedJSHeapSize ?? null,
          };
        }, frames);
        assert.equal(sample.room, room);
        assert.deepEqual(errors, []);
        const sorted = sample.frameTimes.sort((a, b) => a - b);
        const mean =
          sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
        const result = {
          room,
          run,
          renderer: sample.renderer,
          canvas: sample.canvas,
          frames: sorted.length,
          fpsMean: 1000 / mean,
          frameMs: {
            mean,
            p95: quantile(sorted, 0.95),
            p99: quantile(sorted, 0.99),
          },
          draw: sample.draw,
          memory: sample.memory,
          jsHeap: sample.jsHeap,
          errors,
        };
        results.push(result);
        console.log(JSON.stringify(result));
      } finally {
        await context.close();
      }
    }
} finally {
  await browser.close();
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      date: new Date().toISOString(),
      url,
      runs,
      frames,
      viewport: "881x793",
      quality: "Baja",
      scenario: "x=0, z=0, enemy defeated",
      results,
    },
    null,
    2,
  ),
);
