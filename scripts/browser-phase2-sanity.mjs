import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

const output = "docs/capturas/fase2";
fs.mkdirSync(output, { recursive: true });
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
const records = [];
try {
  for (const room of [5, 6]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript((room) => {
      localStorage.setItem(
        "sanity404-save",
        JSON.stringify({
          version: 1,
          room,
          x: 0,
          z: 0,
          health: 100,
          sanity: 20,
          items: [],
          collected: [],
          read: [String(room)],
          defeated: [`enemy${room}`],
          seals: [],
          elapsed: 34,
          ended: false,
          phase2: {
            visited: [0, room],
            solved: [],
            steps: [0, 0, 0, 0],
            discoveries: ["adrien"],
            shortcuts: [],
            ending: false,
          },
        }),
      );
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({
          quality: 1,
          volume: 0,
          reduced: false,
          cameraMode: "classic",
          reduceFlashes: true,
        }),
      );
    }, room);
    await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(
      () => window.sanityInspect().sanityEvent.count > 0,
      null,
      { timeout: 25000 },
    );
    const event = await page.evaluate(() => window.sanityInspect().sanityEvent);
    await page.screenshot({ path: `${output}/cordura-${room}.png` });
    assert.deepEqual(errors, []);
    records.push({ room, event, errors });
    await context.close();
  }
  fs.writeFileSync(`${output}/cordura.json`, JSON.stringify(records, null, 2));
  console.log(
    "PASS eventos perceptibles de cordura en archivo e invernadero",
    records,
  );
} finally {
  await browser.close();
}
