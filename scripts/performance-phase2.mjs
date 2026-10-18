import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

const output = "docs/capturas/fase2";
fs.mkdirSync(output, { recursive: true });
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
const selected = process.argv
  .find((arg) => arg.startsWith("--rooms="))
  ?.split("=")[1];
const rooms = selected ? selected.split(",").map(Number) : [0, 1, 5, 6, 3, 7];
const runs = Number(
  process.argv.find((arg) => arg.startsWith("--runs="))?.split("=")[1] || 3,
);
const results = [];
try {
  for (let round = 0; round < runs; round++) {
    for (const room of rooms) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.addInitScript((room) => {
        localStorage.setItem(
          "sanity404-save",
          JSON.stringify({
            version: 1,
            room,
            x: 0,
            z: 0,
            health: 100,
            sanity: 100,
            items: [],
            collected: [],
            read: [],
            defeated: [],
            seals: [],
            elapsed: 0,
            ended: false,
            phase2: {
              visited: [0, room].filter(
                (value, index, values) => values.indexOf(value) === index,
              ),
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
          JSON.stringify({
            quality: 1,
            volume: 0,
            reduced: false,
            cameraMode: "classic",
            reduceFlashes: true,
          }),
        );
      }, room);
      await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page.keyboard.down("f");
      await page.waitForFunction(
        () =>
          window.sanityInspect().draw.frame > 120 &&
          window.sanityInspect().combat.windup > 0,
        null,
        { timeout: 40000 },
      );
      const gpu = await page.evaluate(() => {
        const gl = document.querySelector("canvas").getContext("webgl2");
        const extension = gl.getExtension("WEBGL_debug_renderer_info");
        return gl.getParameter(extension.UNMASKED_RENDERER_WEBGL);
      });
      assert.match(gpu, /Intel.*620/);
      await page.evaluate(() => {
        window.sanityResetMetrics();
        window.phase2Frames = [];
        let previous = performance.now();
        const sample = (now) => {
          window.phase2Frames.push(now - previous);
          previous = now;
          if (window.phase2Frames.length < 600) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      await page.waitForFunction(
        () => window.phase2Frames?.length >= 600,
        null,
        { timeout: 120000 },
      );
      const metrics = await page.evaluate(() => {
        const raw = window.phase2Frames.slice(1);
        const sorted = [...raw].sort((a, b) => a - b);
        const percentile = (p) => sorted[Math.floor((sorted.length - 1) * p)];
        let rolling = raw.slice(0, 60).reduce((sum, value) => sum + value, 0);
        let minRolling60 = 60000 / rolling;
        for (let i = 60; i < raw.length; i++) {
          rolling += raw[i] - raw[i - 60];
          minRolling60 = Math.min(minRolling60, 60000 / rolling);
        }
        return {
          snapshot: window.sanityInspect(),
          frame: {
            samples: raw.length,
            fps:
              1000 / (raw.reduce((sum, value) => sum + value, 0) / raw.length),
            p95: percentile(0.95),
            p99: percentile(0.99),
            max: sorted.at(-1),
            over25: raw.filter((value) => value > 25).length,
            over50: raw.filter((value) => value > 50).length,
            minRolling60,
          },
          heap: performance.memory?.usedJSHeapSize ?? null,
        };
      });
      assert.deepEqual(errors, []);
      assert.equal(metrics.snapshot.paused, false);
      const result = { round: round + 1, room, gpu, ...metrics, errors };
      results.push(result);
      fs.writeFileSync(
        `${output}/rendimiento.json`,
        JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
      );
      console.log(
        `sala ${room} vuelta ${round + 1}: ${metrics.frame.fps.toFixed(2)} FPS, P95 ${metrics.frame.p95.toFixed(1)} ms, GPU ${metrics.snapshot.gpuTime?.medianMs.toFixed(2)} ms, CPU ${metrics.snapshot.performance.renderMedianMs.toFixed(2)} ms`,
      );
      await context.close();
    }
  }
  fs.writeFileSync(
    `${output}/rendimiento.json`,
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
  );
} finally {
  await browser.close();
}
