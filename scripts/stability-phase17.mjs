import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const url = process.env.SANITY_BENCH_URL || "http://127.0.0.1:5173/";
const label =
  process.argv.find((a) => a.startsWith("--label="))?.split("=")[1] ||
  "stability";
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
const errors = [];
try {
  const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    }),
    page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.addInitScript(() => {
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
        room: 0,
        x: 0,
        z: 5,
        health: 100,
        sanity: 100,
        items: [],
        collected: [],
        read: [],
        defeated: ["enemy0"],
        seals: [],
        elapsed: 0,
        ended: false,
      }),
    );
    window.phase17ActionMs = [];
    window.phase17Long = [];
    new PerformanceObserver((l) =>
      window.phase17Long.push(...l.getEntries().map((e) => e.duration)),
    ).observe({ type: "longtask", buffered: true });
  });
  await page.goto(url);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect().draw.frame > 50);
  const cdp = await context.newCDPSession(page);
  await cdp.send("HeapProfiler.collectGarbage");
  const before = await page.evaluate(() => ({
    inspect: window.sanityInspect(),
    heap: performance.memory?.usedJSHeapSize,
  }));
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Opciones", exact: true }).click();
    await page
      .locator("#camera-mode")
      .selectOption(i % 2 ? "classic" : "modern");
    await page.evaluate(() => {
      const b = document.querySelector("#back"),
        f = b.onclick;
      b.onclick = function (e) {
        const t = performance.now();
        const v = f.call(this, e);
        window.phase17ActionMs.push(performance.now() - t);
        return v;
      };
    });
    await page
      .getByRole("button", { name: "Aplicar y volver", exact: true })
      .click();
    await page.getByRole("button", { name: "Volver", exact: true }).click();
    await page.waitForFunction(() => window.sanityInspect().draw.frame > 10);
  }
  await page.waitForTimeout(300);
  await cdp.send("HeapProfiler.collectGarbage");
  const after = await page.evaluate(() => ({
    inspect: window.sanityInspect(),
    heap: performance.memory?.usedJSHeapSize,
    actions: window.phase17ActionMs,
    longTasks: window.phase17Long,
  }));
  assert.deepEqual(errors, []);
  assert.equal(after.inspect.cameraMode, "classic");
  const data = { label, url, before, after, errors };
  fs.mkdirSync("docs/capturas/fase17", { recursive: true });
  fs.writeFileSync(
    `docs/capturas/fase17/${label}-stability.json`,
    JSON.stringify(data, null, 2),
  );
  console.log(
    JSON.stringify({
      label,
      actions: after.actions,
      memoryBefore: before.inspect.memory,
      memoryAfter: after.inspect.memory,
      heapBefore: before.heap,
      heapAfter: after.heap,
      longTasks: after.longTasks,
      errors,
    }),
  );
  await cdp.detach();
  await context.close();
} finally {
  await browser.close();
}
