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
const page = await browser.newPage({ viewport: { width: 480, height: 320 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = {
  version: 1,
  room: 0,
  x: 0,
  z: 5,
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
async function seed(changes, settings = {}) {
  await page.goto(process.env.SANITY_TEST_URL || "http://localhost:5173");
  await page.evaluate(
    ({ state, settings }) => {
      localStorage.setItem("sanity404-save", JSON.stringify(state));
      localStorage.setItem("sanity404-settings", JSON.stringify(settings));
    },
    { state: { ...base, ...changes }, settings },
  );
  await page.reload();
  await page.evaluate(async () => {
    window.game = { inspect: window.sanityInspect };
  });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction((room) => {
    const current = window.game.inspect();
    return (
      !current.paused && current.state.room === room && current.draw.frame > 3
    );
  }, changes.room ?? 0);
}
async function key(k) {
  const frame = await page.evaluate(() => window.game.inspect().draw.frame);
  await page.keyboard.press(k);
  await page.waitForFunction(
    (f) => window.game.inspect().draw.frame > f + 1,
    frame,
  );
}
try {
  await seed({ x: 0, z: -6 });
  await key("e");
  assert.equal(await page.locator("#location").innerText(), "Mansión Veyr");
  assert.match(await page.locator("#toast").innerText(), /llave/);
  console.log("PASS puerta cerrada sin llave");
  await seed({ room: 1, x: 0, z: -3.2, defeated: ["enemy1"] });
  await key("e");
  await page.locator("#answer2").click();
  await page.waitForFunction(() => window.game.inspect().state.sanity < 90);
  console.log("PASS respuesta incorrecta reduce cordura");
  await seed({ room: 3, x: 0, z: -6, defeated: ["enemy3"] });
  await key("e");
  assert.equal(
    await page.locator("#location").innerText(),
    "Capilla del silencio",
  );
  assert.match(await page.locator("#toast").innerText(), /tres sellos/);
  console.log("PASS ruinas bloqueadas sin sellos");
  await seed({ x: 3, z: -3, health: 12 });
  await page
    .getByRole("button", { name: "Reintentar" })
    .waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Reintentar" }).click();
  console.log("PASS daño, muerte y reintento");
  await seed(
    {
      room: 4,
      x: 0,
      z: -1.4,
      sanity: 20,
      seals: [0, 1, 2],
      defeated: ["enemy4"],
      elapsed: 21,
    },
    { reduced: true, volume: 0, quality: 1 },
  );
  await key("e");
  assert.match(await page.locator("#panel").innerText(), /final anticipado/i);
  await page
    .getByRole("button", { name: /Cerrar ahora · final anticipado/ })
    .click();
  assert.match(
    await page.locator("#panel").innerText(),
    /fotografía de la estación ya no tiene rostros/,
  );
  console.log("PASS segundo desenlace y ajustes reducidos");
  assert.deepEqual(errors, []);
  console.log("PASS sin errores JavaScript");
} catch (e) {
  await page
    .screenshot({ path: "/tmp/sanity404-systems-failure.png" })
    .catch(() => {});
  throw e;
} finally {
  await browser.close();
}
