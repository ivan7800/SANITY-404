/** Matched, isolated live encounter on Intel hardware. Not campaign certification. */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/";
const output =
  process.env.SANITY_PHASE26_BENCHMARK_OUTPUT ||
  "/tmp/sanity-phase26-widow-benchmark.json";
const seconds = Number(process.env.SANITY_PHASE26_BENCHMARK_SECONDS || 4);
if (!Number.isFinite(seconds) || seconds < 2 || seconds > 15)
  throw new RangeError(
    "SANITY_PHASE26_BENCHMARK_SECONDS debe estar entre 2 y 15",
  );

const percentile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
};
const report = {
  startedAt: new Date().toISOString(),
  scenario: "Viuda activa; jugador inmóvil en (3.8,-5.2), planta 1",
  viewport: [1440, 900],
  durationSeconds: seconds,
  results: [],
};
let failed = false;
for (const [name, quality] of [
  ["Medio", 1.3],
  ["Bajo", 1],
]) {
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
      ...browserLaunchOptions(),
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((value) => {
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({
          quality: value,
          volume: 0,
          reduced: false,
          cameraMode: "classic",
        }),
      );
    }, quality);
    await page.goto(new URL("?qa=1", url).href);
    await page.waitForFunction(() =>
      Boolean(window.sanityQa && window.sanityInspect),
    );
    const renderer = await page.evaluate(() => {
      const gl = document.querySelector("canvas")?.getContext("webgl2");
      const extension = gl?.getExtension("WEBGL_debug_renderer_info");
      return extension
        ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
        : gl?.getParameter(gl.RENDERER);
    });
    if (process.env.SANITY_HARDWARE === "1" && !/Intel/i.test(String(renderer)))
      throw new Error(`GPU Intel no detectada: ${renderer}`);
    await page.evaluate(() => {
      window.sanityQa.openRoom(0, 1);
      window.sanityQa.position(3.8, -5.2);
    });
    await page.waitForFunction(
      () => window.sanityInspect().combat.kind === "widow",
    );
    const measurement = await page.evaluate(async (duration) => {
      const frames = [];
      let start;
      let previous;
      await new Promise((resolve) => {
        const tick = (now) => {
          if (start === undefined) start = now;
          if (previous !== undefined) frames.push(now - previous);
          previous = now;
          if (now - start >= duration * 1000) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return {
        frames,
        inspect: window.sanityInspect(),
        elapsedMs: previous - start,
      };
    }, seconds);
    const frames = measurement.frames.filter((value) => value > 0);
    const state = measurement.inspect;
    const result = {
      profile: name,
      renderer,
      browser: browser.version(),
      quality: state.quality,
      canvas: { width: state.canvas.width, height: state.canvas.height },
      durationMs: measurement.elapsedMs,
      frames: frames.length,
      fps: frames.length / (measurement.elapsedMs / 1000),
      frameMedianMs: percentile(frames, 0.5),
      frameP95Ms: percentile(frames, 0.95),
      cpu: state.performance,
      gpu: state.gpuTime,
      draw: state.draw,
      memory: state.memory,
      health: state.state.health,
      aiState: state.combat.aiState,
      errors,
    };
    report.results.push(result);
    if (
      state.combat.kind !== "widow" ||
      state.state.health <= 0 ||
      errors.length
    ) {
      failed = true;
      result.invalid = "El encuentro no permaneció activo y jugable";
    }
    await page.close();
  } catch (error) {
    failed = true;
    report.results.push({ profile: name, error: String(error) });
  } finally {
    await browser?.close().catch(() => {});
  }
}
report.finishedAt = new Date().toISOString();
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    report.results.map(({ profile, fps, frameP95Ms, error }) => ({
      profile,
      fps,
      frameP95Ms,
      error,
    })),
  ),
);
process.exitCode = failed ? 1 : 0;
