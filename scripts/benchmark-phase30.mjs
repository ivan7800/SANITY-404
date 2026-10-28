/** Matched rendering scenarios. QA setup is isolated from campaign certification. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";
import {
  benchmarkPlan,
  blockedProfileResults,
} from "./phase30-benchmark-plan.mjs";

const manifest = benchmarkPlan();
const { url, durationSeconds: seconds, scenarios: cases, profiles } = manifest;
const output =
  process.env.SANITY_PHASE30_OUTPUT || "/tmp/sanity-phase30-benchmark";
if (process.argv.includes("--describe")) {
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}
const percentile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
};
const report = {
  startedAt: new Date().toISOString(),
  url,
  mode: "QA aislado; no certifica campaña ni final",
  viewport: [1440, 900],
  durationSeconds: seconds,
  warmup: "1,5 s tras entrada observable; cordura espera manifestación real",
  hardwareRequired: process.env.SANITY_HARDWARE === "1",
  manifest,
  results: [],
};
mkdirSync(output, { recursive: true });
let failed = false;

for (const { name: profile, quality } of profiles) {
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
      ...browserLaunchOptions(),
    });
    for (const scene of cases) {
      let context;
      const errors = [];
      const result = {
        profile,
        scenario: scene.id,
        name: scene.name,
        startedAt: new Date().toISOString(),
        status: "PENDING",
        errors,
      };
      report.results.push(result);
      try {
        context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
        });
        await context.addInitScript((value) => {
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
        const page = await context.newPage();
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        await page.goto(new URL("?qa=1", url).href, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForFunction(() =>
          Boolean(window.sanityQa && window.sanityInspect),
        );
        result.renderer = await page.evaluate(() => {
          const gl = document.querySelector("canvas")?.getContext("webgl2");
          const extension = gl?.getExtension("WEBGL_debug_renderer_info");
          return extension
            ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
            : gl?.getParameter(gl.RENDERER);
        });
        if (report.hardwareRequired)
          assert.match(String(result.renderer), /Intel/i, "GPU Intel ausente");
        if (scene.room !== undefined) {
          await page.evaluate((setup) => {
            window.sanityQa.openRoom(setup.room, setup.floor || 0);
            if (setup.position) window.sanityQa.position(...setup.position);
            if (setup.sanity !== undefined) {
              window.sanityQa.setSanity(setup.sanity);
              // Keeps the enemy out of this isolated visual-cost sample.
              window.sanityQa.architectureView([0, 3.2, 6], [0, 1, -2]);
            }
          }, scene);
          await page.waitForFunction((room) => {
            const snapshot = window.sanityBenchmarkState();
            return snapshot.room === room && !snapshot.paused;
          }, scene.room);
        }
        if (scene.id === "widow")
          await page.waitForFunction(
            () => window.sanityInspect().combat.kind === "widow",
          );
        if (scene.id === "sanity")
          await page.waitForFunction(
            () => window.sanityBenchmarkState().eventCount > 0,
            null,
            { timeout: 20000 },
          );
        if (scene.id === "sanity") {
          result.screenshot = `${profile.toLowerCase()}-${scene.id}.png`;
          await page.screenshot({ path: join(output, result.screenshot) });
        } else await page.waitForTimeout(1500);
        const measured = await page.evaluate(async (durationMs) => {
          const frames = [];
          let effectFrames = 0;
          let first;
          let previous;
          await new Promise((resolve) => {
            const tick = (now) => {
              if (first === undefined) first = now;
              if (previous !== undefined) frames.push(now - previous);
              if (window.sanityBenchmarkState().eventActive) effectFrames++;
              previous = now;
              if (now - first >= durationMs) resolve();
              else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          return {
            frames,
            effectFrames,
            elapsedMs: previous - first,
            inspect: window.sanityInspect(),
          };
        }, seconds * 1000);
        const frames = measured.frames.filter((value) => value > 0);
        if (frames.length < 10)
          throw new Error(`Muestra insuficiente: ${frames.length} fotogramas`);
        const snapshot = measured.inspect;
        Object.assign(result, {
          browser: browser.version(),
          canvas: {
            width: snapshot.canvas.width,
            height: snapshot.canvas.height,
          },
          quality: snapshot.quality,
          elapsedMs: measured.elapsedMs,
          frames: frames.length,
          fpsMean: frames.length / (measured.elapsedMs / 1000),
          fpsLow1: 1000 / percentile(frames, 0.99),
          frameMedianMs: percentile(frames, 0.5),
          frameP95Ms: percentile(frames, 0.95),
          cpu: scene.id === "menu" ? null : snapshot.performance,
          gpu: snapshot.gpuTime,
          draw: snapshot.draw,
          memory: snapshot.memory,
          sceneBudget: snapshot.textures,
          health: snapshot.state.health,
          enemyKind: snapshot.combat.kind,
          eventCount: snapshot.sanityEvent.count,
          effectFrames: measured.effectFrames,
        });
        if (scene.id !== "sanity") {
          result.screenshot = `${profile.toLowerCase()}-${scene.id}.png`;
          await page.screenshot({ path: join(output, result.screenshot) });
        }
        if (
          errors.length ||
          (scene.id !== "menu" && snapshot.state.health <= 0) ||
          (scene.id === "widow" && snapshot.combat.kind !== "widow") ||
          (scene.id === "sanity" && measured.effectFrames === 0)
        )
          throw new Error("Escenario no permaneció válido durante la muestra");
        result.status = "PASS";
      } catch (error) {
        failed = true;
        result.error = String(error);
        result.status = /GPU Intel ausente/.test(result.error)
          ? "BLOCKED"
          : "FAIL";
      } finally {
        result.finishedAt = new Date().toISOString();
        await context?.close().catch(() => {});
      }
    }
  } catch (error) {
    failed = true;
    report.results.push(...blockedProfileResults(profile, cases, error));
  } finally {
    await browser?.close().catch(() => {});
  }
}
report.finishedAt = new Date().toISOString();
writeFileSync(join(output, "resultados.json"), JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    report.results.map(({ profile, scenario, status, fpsMean, error }) => ({
      profile,
      scenario,
      status,
      fpsMean,
      error: error?.split("\n")[0],
    })),
  ),
);
process.exitCode = failed ? 1 : 0;
