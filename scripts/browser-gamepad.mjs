import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const { url } = JSON.parse(
  fs.readFileSync(
    new URL("../.sanity-launcher/server.json", import.meta.url),
    "utf8",
  ),
);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args:
    process.env.SANITY_HARDWARE === "1"
      ? [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--use-gl=angle",
          "--use-angle=gl",
          "--ignore-gpu-blocklist",
          "--enable-gpu",
        ]
      : [
          "--no-sandbox",
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
        ],
});
const page = await browser.newPage({ viewport: { width: 480, height: 320 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => {
  window.pad = {
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
  };
  Object.defineProperty(navigator, "getGamepads", {
    value: () => [window.pad],
  });
});
async function button(i) {
  const frame = await page.evaluate(() => window.game.inspect().draw.frame);
  await page.evaluate((i) => {
    window.pad.buttons[i].pressed = true;
  }, i);
  await page.waitForFunction(
    (f) => window.game.inspect().draw.frame > f + 1,
    frame,
  );
  await page.evaluate((i) => {
    window.pad.buttons[i].pressed = false;
  }, i);
}
try {
  await page.goto(url);
  await page.evaluate(async () => {
    window.game = { inspect: window.sanityInspect };
  });
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.evaluate(() => {
    window.pad.axes[0] = 1;
  });
  await page.waitForFunction(() => window.game.inspect().state.x > 7.4, null, {
    timeout: 60000,
  });
  await page.waitForTimeout(300);
  let s = await page.evaluate(() => window.game.inspect());
  assert.ok(s.state.x <= 7.5);
  await page.evaluate(() => {
    window.pad.axes[0] = 0;
  });
  console.log("PASS movimiento mediante Gamepad API y colisión real con pared");
  await page.evaluate(() => {
    window.pad.buttons[4].pressed = true;
  });
  await page.waitForFunction(() => window.game.inspect().combat.guarding);
  await page.evaluate(() => {
    window.pad.buttons[4].pressed = false;
  });
  console.log("PASS defensa con LB");
  await page.waitForFunction(
    () => {
      const combat = window.game.inspect().combat;
      return !combat.guarding && combat.hurt === 0;
    },
    null,
    { timeout: 30000 },
  );
  const beforeDodge = (await page.evaluate(() => window.game.inspect())).combat;
  await button(11);
  const afterDodge = (await page.evaluate(() => window.game.inspect())).combat;
  const dodgeStamina = afterDodge.stamina;
  assert.ok(
    dodgeStamina < beforeDodge.stamina - 15,
    `R3 did not spend stamina: ${JSON.stringify({ beforeDodge, afterDodge })}`,
  );
  await button(5);
  assert.ok(
    (await page.evaluate(() => window.game.inspect())).combat.stamina <
      dodgeStamina - 20,
  );
  console.log(
    "PASS R3 esquiva y RB ataque fuerte mediante Gamepad API simulada",
  );
  await button(3);
  assert.match(await page.locator("#panel").innerText(), /Inventario/);
  await button(1);
  assert.equal(await page.locator("#overlay").isHidden(), true);
  console.log("PASS Y inventario y B volver");
  await button(8);
  assert.match(
    await page.locator("#panel").innerText(),
    /La mansión y sus ecos/,
  );
  assert.match(
    await page.locator("#panel").innerText(),
    /8 · Zona no explorada/,
  );
  await button(9);
  assert.equal(await page.locator("#overlay").isHidden(), true);
  console.log("PASS Select mapa y Start volver");
  assert.deepEqual(errors, []);
  console.log(
    "PASS mando virtual en navegador sin errores JavaScript; hardware físico pendiente",
  );
} finally {
  await browser.close();
}
