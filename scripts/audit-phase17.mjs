import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/";
const out = "docs/capturas/fase17/auditoria";
mkdirSync(out, { recursive: true });
const scenarios = [
  { id: "exploracion", x: 0, z: 5, defeated: ["enemy0"] },
  { id: "combate", x: 0, z: 0 },
  { id: "escalera", x: 5, z: -5.6 },
  { id: "planta-superior", x: -5, z: -5.7, floor: 1 },
  { id: "cordura", x: 0, z: 3, sanity: 20 },
  {
    id: "jefe",
    x: -1.3,
    z: -3.8,
    floor: 1,
    items: ["Folio del rellano", "Carta de la raíz"],
  },
];
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const captureOnly = process.argv.includes("--capture-only");
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
const results = [];
try {
  for (const scenario of scenarios) {
    if (only && !only.split(",").includes(scenario.id)) continue;
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript((scenario) => {
      localStorage.setItem(
        "sanity404-save",
        JSON.stringify({
          version: 1,
          room: 0,
          x: scenario.x,
          z: scenario.z,
          floor: scenario.floor ?? 0,
          health: 100,
          sanity: scenario.sanity ?? 100,
          items: scenario.items ?? [],
          collected: [],
          read: [],
          defeated: scenario.defeated ?? [],
          seals: [],
          elapsed: 0,
          ended: false,
        }),
      );
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({
          quality: 1,
          volume: 0,
          reduced: false,
          cameraMode: "classic",
        }),
      );
    }, scenario);
    await page.goto(url);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(
      () => window.sanityInspect?.().draw.frame > 100,
      null,
      { timeout: 60000 },
    );
    const gpu = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2");
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        vendor: debug
          ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
          : gl.getParameter(gl.VENDOR),
        renderer: debug
          ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
          : gl.getParameter(gl.RENDERER),
        webgl: gl.getParameter(gl.VERSION),
      };
    });
    if (!/Intel.*620/.test(gpu.renderer))
      throw new Error(`GPU física no confirmada: ${gpu.renderer}`);
    await page.screenshot({ path: `${out}/${scenario.id}.png` });
    if (captureOnly) {
      console.log(`${scenario.id}: captura realizada con ${gpu.renderer}`);
      await context.close();
      continue;
    }
    await page.evaluate(() => {
      window.auditFrames = [];
      let prior;
      function sample(now) {
        if (prior !== undefined) window.auditFrames.push(now - prior);
        prior = now;
        if (window.auditFrames.length < 600) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await page.waitForFunction(() => window.auditFrames?.length === 600, null, {
      timeout: 120000,
    });
    const data = await page.evaluate(() => {
      const frames = window.auditFrames;
      const sorted = [...frames].sort((a, b) => a - b);
      const meanMs = frames.reduce((sum, n) => sum + n, 0) / frames.length;
      const q = (p) => sorted[Math.floor((sorted.length - 1) * p)];
      let windowMs = frames.slice(0, 60).reduce((sum, n) => sum + n, 0);
      let minRolling60Fps = 60000 / windowMs;
      for (let index = 60; index < frames.length; index++) {
        windowMs += frames[index] - frames[index - 60];
        minRolling60Fps = Math.min(minRolling60Fps, 60000 / windowMs);
      }
      const state = window.sanityInspect();
      return {
        fps: 1000 / meanMs,
        meanMs,
        p95Ms: q(0.95),
        p99Ms: q(0.99),
        maxMs: sorted.at(-1),
        over25: frames.filter((n) => n > 25).length,
        minRolling60Fps,
        frameIntervalsMs: frames,
        heapBytes: performance.memory?.usedJSHeapSize ?? null,
        state: {
          room: state.state.room,
          floor: state.state.floor,
          x: state.state.x,
          z: state.state.z,
          sanity: state.state.sanity,
          enemyKind: state.combat.kind,
          aiState: state.combat.aiState,
          bossPhase: state.combat.phase,
          enemyVisible: state.enemy.visible,
          draws: state.draw.calls,
          triangles: state.draw.triangles,
          textures: state.memory.textures,
          canvas: [state.canvas.width, state.canvas.height],
        },
      };
    });
    results.push({ scenario: scenario.id, gpu, frames: 600, ...data, errors });
    console.log(
      `${scenario.id}: ${data.fps.toFixed(2)} FPS, mínimo 60 ${data.minRolling60Fps.toFixed(2)} FPS, P95 ${data.p95Ms.toFixed(1)} ms, ${data.state.enemyKind}`,
    );
    await context.close();
  }
  if (!captureOnly)
    writeFileSync(
      `${out}/${only ? `medicion-${only.replaceAll(",", "-")}` : "mediciones"}.json`,
      JSON.stringify({ date: new Date().toISOString(), url, results }, null, 2),
    );
} finally {
  await browser.close();
}
