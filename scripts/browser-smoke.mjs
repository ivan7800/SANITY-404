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
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const report = (message) => {
  results.push(message);
  console.log("PASS", message);
};
const inspect = () => page.evaluate(() => window.game.inspect());
const key = async (k) => {
  const before = (await inspect()).draw.frame;
  await page.keyboard.press(k);
  await page.waitForFunction(
    (frame) => window.game.inspect().draw.frame > frame + 1,
    before,
  );
};
async function go(x, z) {
  for (const [axis, target] of [
    ["x", x],
    ["z", z],
  ]) {
    let s = await inspect();
    let diff = target - s.state[axis];
    if (Math.abs(diff) < 0.12) continue;
    const direction =
      axis === "x" ? (diff > 0 ? "d" : "a") : diff > 0 ? "s" : "w";
    await page.keyboard.down(direction);
    await page.waitForFunction(
      ({ axis, target, positive }) =>
        positive
          ? window.game.inspect().state[axis] >= target - 0.1
          : window.game.inspect().state[axis] <= target + 0.1,
      { axis, target, positive: diff > 0 },
      { timeout: 45000 },
    );
    await page.keyboard.up(direction);
  }
}
try {
  await page.goto(process.env.SANITY_TEST_URL || "http://localhost:5173");
  await page.evaluate(async () => {
    window.game = { inspect: window.sanityInspect };
  });
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.waitForFunction(() => window.game.inspect().draw.frame > 5);
  assert.equal((await inspect()).paused, false);
  report("WebGL y nueva partida");
  await page.screenshot({ path: "/tmp/sanity404-game.png" });
  await go(-2, 5);
  await key("e");
  assert.ok(await page.evaluate(() => localStorage.getItem("sanity404-save")));
  const saved = JSON.parse(
    await page.evaluate(() => localStorage.getItem("sanity404-save")),
  );
  report("Movimiento e interacción de guardado");
  await key("Escape");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  assert.equal((await inspect()).state.x, saved.x);
  assert.equal((await inspect()).state.z, saved.z);
  report("Carga de partida");
  await key("Tab");
  assert.equal(await page.locator("#overlay").isVisible(), true);
  await page.keyboard.press("Tab");
  assert.equal(await page.locator("#overlay").isVisible(), true);
  await key("Escape");
  report("Inventario, foco de teclado y pausa");
  await go(-4.2, 5);
  await key("e");
  await page.getByRole("button", { name: "Guardar en el diario" }).click();
  assert.equal((await inspect()).state.read.length, 1);
  report("Documento y diario");
  await go(-4, 1);
  await key("e");
  assert.ok((await inspect()).state.items.includes("Llave de latón"));
  report("Llave e inventario");
  await go(0, 4);
  await go(3, 4);
  await key("e");
  await page.locator("#answer0").click();
  assert.ok((await inspect()).state.items.includes("Medallón Veyr"));
  report("Puzle de la mansión y medallón");
  await go(0, -6);
  await key("e");
  assert.equal((await inspect()).state.room, 1);
  report("Puerta y transición a biblioteca");
  for (let room = 1; room <= 3; room++) {
    await go(0, -3.2);
    await key("e");
    await page.locator("#answer" + (room - 1)).click();
    assert.ok((await inspect()).state.seals.includes(room - 1));
    await go(0, -6);
    await key("e");
    assert.equal((await inspect()).state.room, room + 1);
  }
  report("Tres puzles, cripta, capilla y acceso a ruinas");
  await go(0, -1.4);
  await key("e");
  await page
    .getByRole("button", { name: /Cerrar ahora · final anticipado/ })
    .click();
  await page.getByRole("button", { name: "Volver al título" }).waitFor();
  report("Ruta corta y final anticipado explícito");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: results, errors }, null, 2));
} catch (e) {
  console.error(
    JSON.stringify(
      { passed: results, state: await inspect().catch(() => null), errors },
      null,
      2,
    ),
  );
  await page.screenshot({ path: "/tmp/sanity404-failure.png" }).catch(() => {});
  throw e;
} finally {
  await browser.close();
}
