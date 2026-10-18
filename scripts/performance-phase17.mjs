import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const url = process.env.SANITY_BENCH_URL || "http://127.0.0.1:5174/";
const label =
  process.argv.find((a) => a.startsWith("--label="))?.split("=")[1] || "run";
const runs = Number(
  process.argv.find((a) => a.startsWith("--runs="))?.split("=")[1] || 3,
);
const profile = process.argv.includes("--profile");
const out = "docs/capturas/fase17";
fs.mkdirSync(out, { recursive: true });
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
const base = {
  version: 1,
  room: 0,
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
};
const records = [];
const alternate = process.argv.includes("--alternate");
const baselineUrl = process.env.SANITY_BASE_URL || "http://127.0.0.1:5175/";
try {
  for (let i = 0; i < runs; i++) {
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.addInitScript((state) => {
      localStorage.setItem("sanity404-save", JSON.stringify(state));
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({
          quality: 1,
          volume: 0,
          reduced: false,
          cameraMode: "classic",
        }),
      );
    }, base);
    const variant = alternate ? (i % 2 ? "candidate" : "baseline") : label;
    const targetUrl = alternate && i % 2 === 0 ? baselineUrl : url;
    await page.goto(targetUrl);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.keyboard.down("f");
    await page.waitForFunction(
      () =>
        window.sanityInspect().combat.windup > 0 &&
        window.sanityInspect().draw.frame > 100,
      null,
      { timeout: 60000 },
    );
    if (
      process.argv.includes("--capture") &&
      (i === 0 || (alternate && i === 1))
    )
      await page.screenshot({ path: `${out}/${label}-${variant}.png` });
    const gpu = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2"),
        e = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        renderer: gl.getParameter(e.UNMASKED_RENDERER_WEBGL),
        timerQuery: !!gl.getExtension("EXT_disjoint_timer_query_webgl2"),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      };
    });
    assert.match(gpu.renderer, /Intel.*620/);
    let cdp, cpuProfile;
    if (profile && i === 0) {
      cdp = await context.newCDPSession(page);
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.start");
    }
    await page.evaluate(() => {
      window.sanityResetMetrics();
      window.phase17Frames = [];
      let last = performance.now();
      const sample = (now) => {
        window.phase17Frames.push(now - last);
        last = now;
        if (window.phase17Frames.length < 600) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.waitForFunction(
      () => window.phase17Frames?.length >= 600,
      null,
      { timeout: 120000 },
    );
    if (cdp) {
      cpuProfile = (await cdp.send("Profiler.stop")).profile;
      await cdp.detach();
    }
    const sample = await page.evaluate(() => {
      const raw = window.phase17Frames.slice(1),
        a = [...raw].sort((x, y) => x - y),
        q = (p) => a[Math.floor((a.length - 1) * p)],
        s = window.sanityInspect();
      let rollingMs = raw.slice(0, 60).reduce((x, y) => x + y, 0),
        minRolling60Fps = 60000 / rollingMs;
      for (let i = 60; i < raw.length; i++) {
        rollingMs += raw[i] - raw[i - 60];
        minRolling60Fps = Math.min(minRolling60Fps, 60000 / rollingMs);
      }
      return {
        snapshot: s,
        frame: {
          samples: a.length,
          mean: a.reduce((x, y) => x + y, 0) / a.length,
          median: q(0.5),
          p95: q(0.95),
          p99: q(0.99),
          max: a.at(-1),
          over25: a.filter((x) => x > 25).length,
          over50: a.filter((x) => x > 50).length,
          minRolling60Fps,
        },
        heap: performance.memory?.usedJSHeapSize ?? null,
      };
    });
    assert.deepEqual(errors, []);
    const rec = { label, variant, run: i + 1, gpu, ...sample, errors };
    records.push(rec);
    if (cpuProfile) {
      const nodes = new Map(
        cpuProfile.nodes.map((n) => [n.id, n.callFrame.functionName]),
      );
      const hits = new Map();
      for (const id of cpuProfile.samples ?? []) {
        const name = nodes.get(id) || "unknown";
        hits.set(name, (hits.get(name) || 0) + 1);
      }
      fs.writeFileSync(
        `${out}/${label}-cpu-profile.json`,
        JSON.stringify(
          {
            sampleCount: cpuProfile.samples?.length,
            top: [...hits].sort((a, b) => b[1] - a[1]).slice(0, 40),
          },
          null,
          2,
        ),
      );
    }
    console.log(
      variant,
      i + 1,
      JSON.stringify({
        fps: 1000 / sample.frame.mean,
        p95: sample.frame.p95,
        p99: sample.frame.p99,
        over25: sample.frame.over25,
        over50: sample.frame.over50,
        minRolling60Fps: sample.frame.minRolling60Fps,
        cpuRender: sample.snapshot.performance.renderMedianMs,
        gpuTime: sample.snapshot.gpuTime,
        draw: sample.snapshot.draw,
        gpu: gpu.renderer,
        heap: sample.heap,
      }),
    );
    await context.close();
  }
  fs.writeFileSync(
    `${out}/${label}.json`,
    JSON.stringify(
      {
        date: new Date().toISOString(),
        url,
        baselineUrl: alternate ? baselineUrl : undefined,
        runs: records,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
