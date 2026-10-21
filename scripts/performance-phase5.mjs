import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const url = process.env.SANITY_BENCH_URL || "http://127.0.0.1:5173/";
const runs = Number(
  process.argv.find((a) => a.startsWith("--runs="))?.slice(7) || 2,
);
const frames = Number(
  process.argv.find((a) => a.startsWith("--frames="))?.slice(9) || 240,
);
const combat = process.argv.includes("--combat");
const contactPosition = process.argv
  .find((a) => a.startsWith("--position="))
  ?.slice(11)
  .split(",")
  .map(Number);
if (contactPosition)
  assert.ok(
    contactPosition.length === 2 && contactPosition.every(Number.isFinite),
  );
const output =
  process.env.SANITY_BENCH_OUTPUT ||
  `docs/capturas/fase5/metrics-${combat ? "combat" : "idle"}.json`;
const selectedRooms = process.argv.find((a) => a.startsWith("--rooms="));
const rooms = selectedRooms
  ? selectedRooms.slice(8).split(",").map(Number)
  : [0, 8, 9, 10];
assert.ok(
  rooms.length > 0 &&
    rooms.every((room) => Number.isInteger(room) && room >= 0 && room <= 10),
);
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
  for (const room of rooms) {
    for (let run = 1; run <= runs; run++) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.addInitScript(
        ({ roomNumber, combatMode, position }) => {
          localStorage.setItem(
            "sanity404-settings",
            JSON.stringify({ quality: 1, volume: 0, cameraMode: "classic" }),
          );
          localStorage.setItem(
            "sanity404-save",
            JSON.stringify({
              version: 1,
              room: roomNumber,
              x: position?.[0] ?? 0,
              z: position?.[1] ?? (combatMode ? 0 : 5),
              health: 100,
              sanity: 100,
              items: [],
              collected: [],
              read: [],
              defeated: [],
              seals: [],
              elapsed: 0,
              ended: false,
            }),
          );
        },
        { roomNumber: room, combatMode: combat, position: contactPosition },
      );
      await page.goto(url);
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page.waitForFunction(() => window.sanityInspect().draw.frame > 60);
      if (combat) {
        await page.keyboard.down("f");
        await page.waitForFunction(
          () => window.sanityInspect().combat.windup > 0,
          null,
          { timeout: 60000 },
        );
      }
      const cdp = await context.newCDPSession(page);
      await cdp.send("HeapProfiler.collectGarbage");
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
        const gl = document.querySelector("canvas").getContext("webgl2");
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        const inspect = window.sanityInspect();
        return {
          frameTimes,
          state: { room: inspect.state.room, health: inspect.state.health },
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
        };
      }, frames);
      await cdp.send("HeapProfiler.collectGarbage");
      const heapAfterGc = await page.evaluate(
        () => performance.memory?.usedJSHeapSize ?? null,
      );
      assert.equal(sample.state.room, room);
      assert.deepEqual(errors, []);
      const sorted = [...sample.frameTimes].sort((a, b) => a - b);
      const mean =
        sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
      const result = {
        room,
        run,
        renderer: sample.renderer,
        canvas: sample.canvas,
        health: sample.state.health,
        frames: sorted.length,
        fpsMean: 1000 / mean,
        frameMs: {
          mean,
          median: quantile(sorted, 0.5),
          p95: quantile(sorted, 0.95),
          p99: quantile(sorted, 0.99),
          max: sorted.at(-1),
        },
        draw: sample.draw,
        memory: sample.memory,
        heapAfterGc,
        errors,
      };
      results.push(result);
      console.log(JSON.stringify(result));
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
      viewport: "1280x720",
      quality: "Baja",
      scene: combat
        ? "Enemy attacking; guard held; character at (0,0)"
        : "Enemy active; character at room entry, no scripted movement",
      results,
    },
    null,
    2,
  ),
);
