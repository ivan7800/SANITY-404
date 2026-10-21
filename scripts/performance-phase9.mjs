import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import {
  classifyRenderer,
  summarizeFrames,
  validateScenario,
} from "./phase9-benchmark.mjs";

const option = (name, fallback) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3) ?? fallback;
const seconds = Number(option("seconds", "60"));
const output = option("output", "phase9-performance.json");
const url = option("url", "http://127.0.0.1:5173/");
const headed = process.argv.includes("--headed");
const requireHardware = process.argv.includes("--hardware") || headed;
const playwrightChromium = process.argv.includes("--playwright-chromium");
if (!Number.isFinite(seconds) || seconds < 1)
  throw new Error("--seconds debe ser al menos 1");
if (requireHardware && !headed)
  throw new Error("La medición de GPU física exige --headed en X11");
const executablePath = playwrightChromium
  ? chromium.executablePath()
  : process.env.CHROME_PATH || "/usr/bin/google-chrome";
const browser = await chromium.launch({
  executablePath,
  headless: !headed,
  chromiumSandbox: true,
  ignoreDefaultArgs: ["--enable-unsafe-swiftshader"],
});
const report = {
  date: new Date().toISOString(),
  url,
  requestedSecondsPerScenario: seconds,
  headed,
  requireHardware,
  executablePath,
  browserVersion: browser.version(),
  results: [],
};
try {
  for (const [room, era] of [
    [0, "1927"],
    [8, "189"],
    [9, "1348"],
  ]) {
    for (const scenario of ["exploration", "combat", "psychological"]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        await page.addInitScript(
          ({ room, scenario }) => {
            localStorage.setItem(
              "sanity404-settings",
              JSON.stringify({
                quality: 1,
                volume: 0,
                reduced: false,
                cameraMode: "classic",
              }),
            );
            localStorage.setItem(
              "sanity404-save",
              JSON.stringify({
                version: 1,
                room,
                x: 0,
                z: 3,
                health: 100,
                sanity: scenario === "psychological" ? 30 : 100,
                items: scenario === "combat" ? Array(20).fill("Tónico 0") : [],
                collected: [],
                read: scenario === "psychological" ? [String(room)] : [],
                defeated: scenario === "combat" ? [] : [`enemy${room}`],
                seals: [],
                elapsed: 0,
                ended: false,
              }),
            );
          },
          { room, scenario },
        );
        await page.goto(url);
        await page
          .getByRole("button", { name: "Continuar", exact: true })
          .click();
        await page.waitForFunction(
          () =>
            window.sanityInspect?.().draw.frame > 5 &&
            !window.sanityInspect().paused,
        );
        const gpu = await page.evaluate(() => {
          const gl = document
            .querySelector("#viewport canvas")
            ?.getContext("webgl2");
          if (!gl) throw new Error("WebGL 2 no disponible");
          const debug = gl.getExtension("WEBGL_debug_renderer_info");
          return {
            renderer: debug
              ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
              : gl.getParameter(gl.RENDERER),
            vendor: debug
              ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
              : gl.getParameter(gl.VENDOR),
            unmasked: Boolean(debug),
          };
        });
        const gpuType = classifyRenderer(gpu);
        if (requireHardware && gpuType !== "physical") {
          report.results.push({
            era,
            room,
            scenario,
            gpu,
            gpuType,
            rejected: true,
            reason: "Se exige GPU física identificable",
          });
          throw new Error(
            `GPU física requerida; detectado ${gpuType}: ${gpu.renderer}`,
          );
        }
        const sample = await page.evaluate(
          async ({ duration, scenario }) => {
            const frames = [];
            const start = performance.now();
            const initial = window.sanityInspect();
            let previous = 0,
              expectedGameMs = 0,
              pausedFrames = 0,
              enemyFrames = 0,
              engagedFrames = 0;
            let activeKey = "",
              eventPeak = initial.sanityEvent.count;
            const key = (type, code) =>
              dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
            function setKey(code) {
              if (code === activeKey) return;
              if (activeKey) key("keyup", activeKey);
              activeKey = code;
              if (code) key("keydown", code);
            }
            await new Promise((resolve) => {
              function frame(now) {
                const inspect = window.sanityInspect();
                if (previous) {
                  const interval = now - previous;
                  frames.push(interval);
                  expectedGameMs += Math.min(interval, 200);
                }
                previous = now;
                if (inspect.paused || inspect.state.health <= 0) pausedFrames++;
                if (inspect.enemy.visible) enemyFrames++;
                if (
                  inspect.enemy.visible &&
                  inspect.combat.aiState !== "patrol"
                )
                  engagedFrames++;
                eventPeak = Math.max(eventPeak, inspect.sanityEvent.count);
                const elapsed = now - start;
                if (scenario === "exploration") {
                  setKey(
                    ["KeyW", "KeyD", "KeyS", "KeyA"][
                      Math.floor(elapsed / 1200) % 4
                    ],
                  );
                } else if (scenario === "combat") {
                  // Defensive movement and in-game tonics keep the enemy active.
                  const dx = inspect.state.x - inspect.enemy.position[0];
                  const dz = inspect.state.z - inspect.enemy.position[2];
                  const close = Math.hypot(dx, dz) < 3.2;
                  setKey(
                    close
                      ? Math.abs(dx) > Math.abs(dz)
                        ? dx > 0
                          ? "KeyD"
                          : "KeyA"
                        : dz > 0
                          ? "KeyS"
                          : "KeyW"
                      : ["KeyA", "KeyW", "KeyD", "KeyS"][
                          Math.floor(elapsed / 1400) % 4
                        ],
                  );
                  if (inspect.state.health < 65) {
                    key("keydown", "KeyH");
                    key("keyup", "KeyH");
                  }
                }
                if (elapsed < duration) requestAnimationFrame(frame);
                else resolve();
              }
              requestAnimationFrame(frame);
            });
            setKey("");
            const inspect = window.sanityInspect();
            const canvas = document.querySelector("#viewport canvas");
            return {
              frames,
              expectedGameSeconds: expectedGameMs / 1000,
              elapsedSeconds: (performance.now() - start) / 1000,
              gameElapsedSeconds: inspect.state.elapsed - initial.state.elapsed,
              pausedFrames,
              enemyVisibleRatio: enemyFrames / (frames.length + 1),
              combatEngagedRatio: engagedFrames / (frames.length + 1),
              eventCount: eventPeak - initial.sanityEvent.count,
              tonicsUsed:
                initial.state.items.length - inspect.state.items.length,
              healthAtEnd: inspect.state.health,
              pausedAtEnd: inspect.paused,
              enemyVisible: inspect.enemy.visible,
              roomAtEnd: inspect.state.room,
              viewport: [innerWidth, innerHeight],
              renderResolution: [canvas.width, canvas.height],
              renderScale: canvas.width / innerWidth,
              drawCalls: inspect.draw.calls,
              triangles: inspect.draw.triangles,
              gpuResources: inspect.memory,
              jsHeapBytes: performance.memory?.usedJSHeapSize ?? null,
            };
          },
          { duration: seconds * 1000, scenario },
        );
        const { frames, ...observations } = sample;
        const metrics = summarizeFrames(frames);
        const validation = validateScenario({
          ...observations,
          ...metrics,
          scenario,
          room,
          requireHardware,
          errors,
        });
        report.results.push({
          era,
          room,
          scenario,
          gpu,
          gpuType,
          ...observations,
          ...metrics,
          ...validation,
          errors,
        });
        console.log(
          `${era} ${scenario}: ${metrics.averageFps?.toFixed(1) ?? "n/a"} FPS · ${gpuType} · ${validation.scenarioValid ? "válido" : validation.invalidReasons.join(", ")}`,
        );
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(`Datos: ${output}`);
}
if (report.results.some((result) => result.rejected || !result.scenarioValid))
  process.exitCode = 1;
