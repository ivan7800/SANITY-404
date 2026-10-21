import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const baseUrl = process.env.SANITY_URL || "http://127.0.0.1:5173/";
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [room, expected] of [
    [8, "roman-ritual"],
    [9, "abbey-bell"],
    [10, "scriptorium-margin"],
  ]) {
    await page.goto(baseUrl);
    await page.evaluate((room) => {
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({
          quality: 1,
          volume: 0.2,
          reduceFlashes: true,
          reduceAudio: true,
        }),
      );
      localStorage.setItem(
        "sanity404-save",
        JSON.stringify({
          version: 1,
          room,
          x: 0,
          z: 5,
          health: 100,
          sanity: 35,
          items: [],
          collected: [],
          read: [String(room)],
          defeated: [`enemy${room}`],
          seals: [],
          elapsed: 0,
          ended: false,
        }),
      );
    }, room);
    await page.reload();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(
      () => window.sanityInspect().sanityEvent.count === 1,
      null,
      { timeout: 18000 },
    );
    const result = await page.evaluate(() => window.sanityInspect());
    assert.equal(result.sanityEvent.id, expected);
    assert.equal(result.state.version, 1);
    assert.equal(result.state.room, room);
    assert.equal(result.audio.reduced, true);
    assert.ok(result.audio.activeTones <= 12);
    console.log(`PASS Fase 8 navegador sala ${room}: ${expected}`);
  }
  await page.goto(baseUrl);
  await page.evaluate(() => {
    localStorage.setItem(
      "sanity404-settings",
      JSON.stringify({
        quality: 1,
        reduced: true,
        reduceFlashes: true,
        reduceAudio: true,
      }),
    );
    localStorage.setItem(
      "sanity404-save",
      JSON.stringify({
        version: 1,
        room: 8,
        x: 0,
        z: 5,
        health: 100,
        sanity: 20,
        items: [],
        collected: [],
        read: ["8"],
        defeated: ["enemy8"],
        seals: [],
        elapsed: 0,
        ended: false,
      }),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(
    () => window.sanityInspect().state.elapsed > 9,
    null,
    { timeout: 18000 },
  );
  assert.equal(
    (await page.evaluate(() => window.sanityInspect())).sanityEvent.count,
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS Fase 8 navegador: efectos reducidos, guardado v1 y sin errores JavaScript",
  );
} finally {
  await browser.close();
}
