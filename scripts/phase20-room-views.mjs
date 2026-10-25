import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/";
const out = "docs/capturas/fase20/salas";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: false,
  chromiumSandbox: true,
  ignoreDefaultArgs: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const records = [];
const inspect = () => page.evaluate(() => window.sanityInspect());
try {
  for (let room = 0; room <= 28; room++) {
    await page.goto(url);
    await page.evaluate((roomNumber) => {
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
          version: 2,
          room: roomNumber,
          x: 0,
          z: 5,
          floor: 0,
          health: 100,
          sanity: 100,
          items: [],
          collected: [],
          read: [],
          defeated: [
            `enemy${roomNumber}`,
            "mansion-guest",
            "mansion-widow",
            "mansion-crawler",
            "mansion-reflection",
            "mansion-root",
          ],
          seals: [],
          elapsed: 0,
          ended: false,
          phase2: {
            visited: [0],
            solved: [],
            steps: [0, 0, 0, 0],
            discoveries: [],
            shortcuts: [],
            ending: false,
          },
          campaign: {
            visited: ["mansion-1927"],
            completed: [],
            witnessed: [],
          },
        }),
      );
    }, room);
    await page.reload();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(
      () =>
        window.sanityInspect().draw.frame > 5 && !window.sanityInspect().paused,
    );
    const entrance = await inspect();
    if (entrance.state.room !== room) throw new Error(`Sala ${room} no cargó`);
    const name = String(room).padStart(2, "0");
    await page.screenshot({
      path: join(out, `${name}-entrada.jpg`),
      type: "jpeg",
      quality: 68,
    });
    await page.keyboard.down("w");
    await page.waitForTimeout(800);
    await page.keyboard.up("w");
    await page.keyboard.down("d");
    await page.waitForTimeout(800);
    await page.keyboard.up("d");
    const moved = await inspect();
    await page.screenshot({
      path: join(out, `${name}-movimiento.jpg`),
      type: "jpeg",
      quality: 68,
    });
    records.push({
      room,
      entrance: {
        x: entrance.state.x,
        z: entrance.state.z,
        cameraCorrected: entrance.cameraCorrected,
        cameraZone: entrance.cinematicZone,
      },
      moved: {
        x: moved.state.x,
        z: moved.state.z,
        cameraCorrected: moved.cameraCorrected,
        cameraZone: moved.cinematicZone,
      },
      displacement: Math.hypot(
        moved.state.x - entrance.state.x,
        moved.state.z - entrance.state.z,
      ),
      health: moved.state.health,
      sanity: moved.state.sanity,
      paused: moved.paused,
    });
    console.log(`${name}: ${records.at(-1).displacement.toFixed(2)} m`);
  }
  writeFileSync(
    join(out, "traza.json"),
    JSON.stringify({ url, errors, records }, null, 2),
  );
} finally {
  await browser.close();
}
