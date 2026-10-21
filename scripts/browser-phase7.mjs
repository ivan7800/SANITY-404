import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

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
  ],
});
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [room, x, kind] of [
    [0, 3, "shade"],
    [8, 3, "centurion"],
    [9, 3, "plagueScribe"],
    [10, 0, "plagueScribe"],
  ]) {
    await page.goto("http://127.0.0.1:5173/");
    await page.evaluate(
      ({ room, x }) => {
        localStorage.setItem(
          "sanity404-settings",
          JSON.stringify({
            quality: 1,
            volume: 0.2,
            reduced: room === 10,
            reduceAudio: room === 10,
            reduceFlashes: room === 10,
          }),
        );
        localStorage.setItem(
          "sanity404-save",
          JSON.stringify({
            version: 1,
            room,
            x,
            z: -2,
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
      { room, x },
    );
    await page.reload();
    assert.equal(
      await page.evaluate(() => window.sanityInspect().audio.running),
      false,
    );
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(() => window.sanityInspect().audio.running);
    await page.waitForFunction(
      () => window.sanityInspect().combat.windup > 0,
      null,
      { timeout: 12000 },
    );
    const during = await page.evaluate(() => window.sanityInspect());
    assert.equal(during.combat.kind, kind);
    assert.ok(during.audio.activeTones <= 12);
    assert.equal(during.audio.volume, 0.2);
    assert.equal(during.audio.reduced, room === 10);
    await page.waitForFunction(
      () => window.sanityInspect().state.health < 100,
      null,
      { timeout: 12000 },
    );
    assert.ok(
      (await page.evaluate(() => window.sanityInspect().state.health)) < 100,
    );
    console.log(
      `PASS fase7 navegador época ${room}: IA, anticipación, impacto y audio`,
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
