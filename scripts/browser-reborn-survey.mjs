/** Visual survey of every room using the isolated QA entry point. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/";
const requestedRooms = process.env.SANITY_SURVEY_ROOMS
  ? process.env.SANITY_SURVEY_ROOMS.split(",").map(Number)
  : Array.from({ length: 29 }, (_, room) => room);
if (
  !requestedRooms.length ||
  requestedRooms.some(
    (room) => !Number.isInteger(room) || room < 0 || room > 28,
  )
)
  throw new RangeError("SANITY_SURVEY_ROOMS admite índices de sala 0–28");
const stamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");
const output = new URL(
  `../docs/capturas/reborn/survey-${stamp}/`,
  import.meta.url,
);
await mkdir(output, { recursive: true });
const result = {
  at: new Date().toISOString(),
  url,
  scope: "encuesta visual QA; no certifica recorridos ni campaña",
  rooms: [],
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
  page.on("pageerror", (error) => result.errors.push(error.message));
  await page.goto(new URL("?qa=1", url).toString());
  await page.waitForFunction(() => Boolean(window.sanityQa));
  for (const room of requestedRooms) {
    const opened = await page.evaluate(
      (index) => window.sanityQa.openRoom(index),
      room,
    );
    const frame = opened.draw.frame;
    await page.waitForFunction(
      (startFrame) => window.sanityQa.inspect().draw.frame >= startFrame + 45,
      frame,
    );
    const snapshot = await page.evaluate(() => window.sanityQa.inspect());
    assert.equal(snapshot.state.room, room);
    const filename = `sala-${String(room).padStart(2, "0")}.png`;
    await page.screenshot({ path: new URL(filename, output).pathname });
    result.rooms.push({
      room,
      image: filename,
      position: [snapshot.state.x, snapshot.state.z],
      camera: snapshot.camera,
      performance: snapshot.performance,
      gpuTime: snapshot.gpuTime,
      draw: snapshot.draw,
      memory: snapshot.memory,
      selected: snapshot.interaction?.id ?? null,
    });
  }
  assert.deepEqual(result.errors, []);
  result.status = `PASS: ${requestedRooms.length} capturas; evaluación visual humana pendiente`;
} catch (error) {
  result.status = "FAIL";
  result.failure = String(error);
  throw error;
} finally {
  await writeFile(
    new URL("survey.json", output),
    JSON.stringify(result, null, 2),
  );
  await browser?.close();
}
