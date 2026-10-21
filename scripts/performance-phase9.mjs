import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const option = (name, fallback) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1] ??
  fallback;
const seconds = Number(option("seconds", "60"));
const output = option("output", "phase9-performance.json");
const url = option("url", "http://127.0.0.1:5173/");
if (!Number.isFinite(seconds) || seconds < 1)
  throw new Error("--seconds debe ser al menos 1");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: !process.argv.includes("--headed"),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results = [];
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
            JSON.stringify({ quality: 1, volume: 0, cameraMode: "classic" }),
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
              items: [],
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
      await page.waitForFunction(() => window.sanityInspect?.().draw.frame > 5);
      const gpu = await page.evaluate(() => {
        const gl = document.querySelector("canvas").getContext("webgl2");
        const info = gl.getExtension("WEBGL_debug_renderer_info");
        return info
          ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
          : gl.getParameter(gl.RENDERER);
      });
      const measurement = await page.evaluate(async (duration) => {
        const frames = [];
        let previous = 0;
        const start = performance.now();
        const initial = window.sanityInspect();
        const scenario = initial.enemy.visible
          ? "combat"
          : initial.state.sanity < 50
            ? "psychological"
            : "exploration";
        const route = ["KeyW", "KeyD", "KeyS", "KeyA"];
        let routeIndex = 0;
        let activeKey = "";
        let combatActiveSeconds = 0;
        const trackCombat = setInterval(() => {
          if (window.sanityInspect().enemy.visible) combatActiveSeconds++;
        }, 1000);
        const key = (type, code) =>
          dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
        const drive = setInterval(() => {
          if (activeKey) key("keyup", activeKey);
          activeKey =
            scenario === "exploration"
              ? route[routeIndex++ % route.length]
              : "";
          if (activeKey) key("keydown", activeKey);
          if (scenario === "combat") {
            key("keydown", "Space");
            key("keyup", "Space");
          }
        }, 1200);
        await new Promise((resolve) => {
          function sample(now) {
            if (previous) frames.push(now - previous);
            previous = now;
            if (now - start < duration) requestAnimationFrame(sample);
            else resolve();
          }
          requestAnimationFrame(sample);
        });
        clearInterval(drive);
        clearInterval(trackCombat);
        if (activeKey) key("keyup", activeKey);
        const sorted = [...frames].sort((a, b) => a - b);
        const percentile = (p) =>
          sorted[Math.ceil(p * sorted.length) - 1] ?? null;
        const inspect = window.sanityInspect();
        const canvas = document.querySelector("canvas");
        return {
          elapsedSeconds: (performance.now() - start) / 1000,
          frames: frames.length,
          averageFps:
            (frames.length * 1000) / frames.reduce((sum, ms) => sum + ms, 0),
          minimumObservedFps: 1000 / sorted.at(-1),
          frameP95Ms: percentile(0.95),
          frameP99Ms: percentile(0.99),
          viewport: [innerWidth, innerHeight],
          renderResolution: [canvas.width, canvas.height],
          renderScale: canvas.width / innerWidth,
          drawCalls: inspect.draw.calls,
          triangles: inspect.draw.triangles,
          gpuResources: inspect.memory,
          jsHeapBytes: performance.memory?.usedJSHeapSize ?? null,
          eventCount: inspect.sanityEvent.count,
          enemyVisible: inspect.enemy.visible,
          combatActiveSeconds,
          gameElapsedSeconds: inspect.state.elapsed - initial.state.elapsed,
          pausedAtEnd: inspect.paused,
          scenarioValid:
            !inspect.paused &&
            inspect.state.elapsed - initial.state.elapsed >=
              (duration / 1000) * 0.9 &&
            (scenario !== "psychological" || inspect.sanityEvent.count > 0) &&
            (scenario !== "combat" ||
              combatActiveSeconds >= (duration / 1000) * 0.8),
        };
      }, seconds * 1000);
      results.push({ era, room, scenario, gpu, ...measurement, errors });
      console.log(
        `${era} ${scenario}: ${measurement.averageFps.toFixed(1)} FPS`,
      );
      await context.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(
  output,
  JSON.stringify(
    {
      date: new Date().toISOString(),
      url,
      requestedSecondsPerScenario: seconds,
      headless: !process.argv.includes("--headed"),
      results,
    },
    null,
    2,
  ),
);
console.log(`Datos: ${output}`);
