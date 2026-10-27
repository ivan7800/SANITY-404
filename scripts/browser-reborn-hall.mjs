/** Isolated visual QA of the rebuilt 1927 hall. Not a campaign certificate. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/";
const output = new URL("../docs/capturas/reborn/", import.meta.url);
const stamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");
await mkdir(output, { recursive: true });
const evidence = {
  at: new Date().toISOString(),
  url,
  scope: "QA visual aislado; no certifica la campaña",
  baseline: "docs/capturas/rescate/sala-0.png",
  views: [],
  errors: [],
};
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    ...browserLaunchOptions(),
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  await page.goto(new URL("?qa=1", url).toString());
  await page.waitForFunction(() => Boolean(window.sanityQa));
  await page.evaluate(() => window.sanityQa.openRoom(0));
  for (const view of [
    { id: "entrada", x: 0, z: 5.2 },
    { id: "eje-central", x: 0, z: 0 },
    { id: "umbral-romano", x: 5.25, z: 3 },
  ]) {
    await page.evaluate(({ x, z }) => window.sanityQa.position(x, z), view);
    const frame = await page.evaluate(
      () => window.sanityQa.inspect().draw.frame,
    );
    await page.waitForFunction(
      (startFrame) => window.sanityQa.inspect().draw.frame >= startFrame + 60,
      frame,
    );
    const snapshot = await page.evaluate(() => window.sanityQa.inspect());
    assert.equal(snapshot.state.room, 0);
    await page.screenshot({
      path: new URL(`${stamp}-${view.id}.png`, output).pathname,
    });
    evidence.views.push({
      id: view.id,
      position: { x: snapshot.state.x, z: snapshot.state.z },
      camera: snapshot.camera,
      selected: snapshot.interaction?.id ?? null,
      performance: snapshot.performance,
      gpuTime: snapshot.gpuTime,
      draw: snapshot.draw,
      memory: snapshot.memory,
    });
  }
  assert.equal(evidence.views.at(-1).selected, "roman-portal");
  await page.keyboard.press("e");
  await page.waitForFunction(() => window.sanityQa.inspect().state.room === 8);
  evidence.romanTransition = {
    room: (await page.evaluate(() => window.sanityQa.inspect())).state.room,
    through: "roman-portal",
  };
  assert.deepEqual(evidence.errors, []);
  evidence.result = "PASS";
} catch (error) {
  evidence.result = "FAIL";
  evidence.failure = String(error);
  throw error;
} finally {
  await writeFile(
    new URL(`${stamp}-hall.json`, output),
    JSON.stringify(evidence, null, 2),
  );
  await browser?.close();
}
