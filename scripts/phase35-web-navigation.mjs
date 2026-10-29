import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL ?? "http://127.0.0.1:5180/SANITY-404/";
const runs = Number(process.env.SANITY_NAV_RUNS ?? 12);
const output = path.resolve(
  process.env.SANITY_NAV_OUTPUT ??
    "docs/capturas/fase35/web-production-navigation.json",
);
assert.ok(Number.isInteger(runs) && runs > 0 && runs <= 100);

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  ...browserLaunchOptions(),
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();
const forceGc = process.env.SANITY_FORCE_GC === "1";
const cdp = forceGc ? await context.newCDPSession(page) : null;
const pending = new Set();
const report = {
  url,
  runsRequested: runs,
  browserVersion: browser.version(),
  forcedGarbageCollection: forceGc,
  navigations: [],
  errors: [],
};
let current;
const record = (kind, details) =>
  report.errors.push({ kind, details, navigation: current?.number ?? null });
page.on("request", (request) => pending.add(request));
page.on("requestfinished", (request) => pending.delete(request));
page.on("requestfailed", (request) => {
  pending.delete(request);
  record("requestfailed", `${request.url()}: ${request.failure()}`);
});
page.on("response", (response) => {
  if (response.status() >= 400)
    record("http", `${response.status()} ${response.url()}`);
});
page.on("pageerror", (error) => record("javascript", error.message));
page.on("console", (message) => {
  if (message.type() === "error") record("console", message.text());
});
page.on("crash", () => record("page-crash", page.url()));
page.on("close", () => record("page-close", page.url()));
browser.on("disconnected", () =>
  record("browser-disconnected", browser.version()),
);
page.on("domcontentloaded", () => {
  if (current) current.domContentLoadedMs = Date.now() - current.startedAtMs;
});
page.on("load", () => {
  if (current) current.loadEventMs = Date.now() - current.startedAtMs;
});

try {
  for (let index = 0; index < runs; index++) {
    current = { number: index + 1, kind: index % 2 ? "reload" : "goto" };
    report.navigations.push(current);
    current.startedAtMs = Date.now();
    const response =
      index % 2
        ? await page.reload({ waitUntil: "commit", timeout: 30000 })
        : await page.goto(url, { waitUntil: "commit", timeout: 30000 });
    current.httpStatus = response?.status();
    assert.equal(current.httpStatus, 200, `navigation ${index + 1}`);
    current.commitMs = Date.now() - current.startedAtMs;
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
    current.domReadyWaitMs = Date.now() - current.startedAtMs;
    await page
      .getByRole("button", { name: "Nueva partida", exact: true })
      .waitFor({
        state: "visible",
        timeout: 30000,
      });
    current.gameReadyMs = Date.now() - current.startedAtMs;
    await page.waitForLoadState("load", { timeout: 30000 });
    current.loadWaitMs = Date.now() - current.startedAtMs;
    if (cdp) await cdp.send("HeapProfiler.collectGarbage");
    current.page = await page.evaluate(async () => ({
      readyState: document.readyState,
      path: location.pathname,
      serviceWorkers:
        (await navigator.serviceWorker?.getRegistrations())?.length ?? 0,
      cacheNames: typeof caches === "undefined" ? [] : await caches.keys(),
      resourceCount: performance.getEntriesByType("resource").length,
      heapUsed: performance.memory?.usedJSHeapSize ?? null,
      canvasCount: document.querySelectorAll("canvas").length,
      canvasWidth: document.querySelector("#viewport canvas")?.width ?? 0,
    }));
    current.pendingRequests = [...pending].map((request) => request.url());
    assert.equal(current.page.path, "/SANITY-404/");
    assert.equal(current.page.canvasCount, 1);
    assert.equal(current.page.serviceWorkers, 0);
    assert.deepEqual(current.page.cacheNames, []);
    assert.deepEqual(current.pendingRequests, []);
    assert.deepEqual(report.errors, []);
    console.log(
      `PASS navigation ${current.number}/${runs}: ${current.kind}, DOM ${current.domReadyWaitMs} ms, game ${current.gameReadyMs} ms, load ${current.loadWaitMs} ms`,
    );
    delete current.startedAtMs;
  }
} catch (error) {
  report.failure = String(error);
  report.pendingRequests = [...pending].map((request) => request.url());
  process.exitCode = 1;
  console.error(
    `FAIL navigation ${current?.number ?? "startup"}: ${error.stack ?? error}`,
  );
  await page
    .screenshot({ path: output.replace(/\.json$/, "-failure.png") })
    .catch((cause) => record("screenshot", String(cause)));
} finally {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
