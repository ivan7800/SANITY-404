import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const server = JSON.parse(
  fs.readFileSync(
    new URL("../.sanity-launcher/server.json", import.meta.url),
    "utf8",
  ),
);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 800, height: 600 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const inspect = () => page.evaluate(() => window.game.inspect());
async function key(k) {
  const f = (await inspect()).draw.frame;
  await page.keyboard.press(k);
  await page.waitForFunction(
    (f) => window.game.inspect().draw.frame > f + 1,
    f,
  );
}
async function go(x, z) {
  for (const [axis, target] of [
    ["x", x],
    ["z", z],
  ]) {
    const diff = target - (await inspect()).state[axis];
    if (Math.abs(diff) < 0.15) continue;
    const k = axis === "x" ? (diff > 0 ? "d" : "a") : diff > 0 ? "s" : "w";
    await page.keyboard.down(k);
    await page.waitForFunction(
      ({ axis, target, positive }) =>
        positive
          ? window.game.inspect().state[axis] >= target - 0.12
          : window.game.inspect().state[axis] <= target + 0.12,
      { axis, target, positive: diff > 0 },
      { timeout: 60000 },
    );
    await page.keyboard.up(k);
  }
}
try {
  await page.goto(server.url);
  await page.evaluate(async () => {
    window.game = { inspect: window.sanityInspect };
  });
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.waitForFunction(() => window.game.inspect().draw.frame > 5);
  let s = await inspect();
  assert.ok(s.playerRig);
  assert.ok(s.draw.triangles > 1000);
  console.log("PASS humanoide articulado y geometría poligonal renderizada");
  await page.screenshot({ path: "/tmp/sanity404-phase1-entrance.png" });
  await page.keyboard.down("w");
  await page.waitForFunction(
    () => Math.abs(window.game.inspect().limbPose) > 0.1,
  );
  await page.keyboard.up("w");
  console.log("PASS animación de locomoción con teclado real");
  await go(0, 0);
  assert.equal((await inspect()).cinematicZone, "galería");
  console.log("PASS exploración y cambio de encuadre cinematográfico");
  await page.keyboard.down("f");
  await page.waitForFunction(
    () => window.game.inspect().combat.windup > 0,
    null,
    { timeout: 45000 },
  );
  await page.waitForFunction(() => window.game.inspect().state.health < 100);
  assert.equal((await inspect()).state.health, 97);
  await page.keyboard.up("f");
  console.log("PASS IA se aproxima, anuncia ataque y la defensa reduce daño");
  await key("Space");
  await page.waitForFunction(
    () => window.game.inspect().combat.enemyHealth === 30,
  );
  const firstStrike = (await inspect()).state.elapsed;
  await page.waitForFunction(
    (t) => window.game.inspect().state.elapsed > t + 0.7,
    firstStrike,
  );
  await key("Space");
  await page.waitForFunction(() => !window.game.inspect().enemy.visible);
  assert.ok((await inspect()).state.defeated.includes("enemy0"));
  console.log("PASS combate cuerpo a cuerpo y enemigo derrotado");
  // Circle the solid table before heading toward the document desk.
  await go(-2.2, 5);
  await go(-4.2, 5);
  await key("e");
  await page.getByRole("button", { name: "Guardar en el diario" }).click();
  assert.ok((await inspect()).state.read.includes("0"));
  console.log("PASS interacción y diario");
  await go(0, 4);
  await go(3, 4);
  await key("e");
  await page.locator("#answer0").click();
  assert.ok((await inspect()).state.items.includes("Medallón Veyr"));
  console.log("PASS puzle de la caja astronómica");
  await go(0, -6);
  assert.equal((await inspect()).cinematicZone, "umbral");
  await page.screenshot({ path: "/tmp/sanity404-phase1-gallery.png" });
  assert.deepEqual(errors, []);
  console.log("PASS sin errores JavaScript; sección jugable verificada");
} catch (e) {
  console.error(await inspect().catch(() => null));
  await page
    .screenshot({ path: "/tmp/sanity404-phase1-failure.png" })
    .catch(() => {});
  throw e;
} finally {
  await browser.close();
}
