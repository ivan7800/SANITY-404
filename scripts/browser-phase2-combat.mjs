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
const state = {
  version: 1,
  room: 7,
  x: 1.5,
  z: -1.5,
  health: 100,
  sanity: 100,
  items: ["Llave de latón", "Medallón Veyr"],
  collected: [],
  read: [],
  defeated: [],
  seals: [],
  elapsed: 0,
  ended: false,
  phase2: {
    visited: [0, 1, 5, 6, 3, 7],
    solved: ["manuscripts", "genealogy", "astronomy", "basement"],
    steps: [3, 3, 3, 3],
    discoveries: ["adrien"],
    shortcuts: ["library-chapel"],
    ending: false,
  },
};
const history = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript((save) => {
    localStorage.setItem("sanity404-save", JSON.stringify(save));
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
  }, state);
  const inspect = () => page.evaluate(() => window.sanityInspect());
  await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  assert.equal((await inspect()).combat.kind, "guardian");
  await page.keyboard.down("w");
  await page.waitForTimeout(180);
  await page.keyboard.up("w");
  await page.keyboard.down("f");
  await page.waitForFunction(
    () => window.sanityInspect().combat.windup > 0,
    null,
    { timeout: 20000 },
  );
  await page.screenshot({ path: `${output}/combate-guardian.png` });
  for (const expected of [100, 50, 0]) {
    await page.waitForFunction(
      () => window.sanityInspect().combat.vulnerable > 0,
      null,
      { timeout: 30000 },
    );
    const before = await inspect();
    const distance = Math.hypot(
      before.enemy.position[0] - before.state.x,
      before.enemy.position[2] - before.state.z,
    );
    if (distance > 1.85) {
      const dx = before.enemy.position[0] - before.state.x;
      const dz = before.enemy.position[2] - before.state.z;
      const key =
        Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? "d" : "a") : dz > 0 ? "s" : "w";
      await page.keyboard.down(key);
      await page.waitForTimeout(250);
      await page.keyboard.up(key);
    }
    await page.keyboard.up("f");
    await page.keyboard.press("j");
    await page.waitForFunction(
      (health) => window.sanityInspect().combat.enemyHealth <= health,
      expected,
      { timeout: 5000 },
    );
    const result = await inspect();
    history.push({
      health: result.combat.enemyHealth,
      phase: result.combat.phase,
      playerHealth: result.state.health,
      stamina: result.combat.stamina,
    });
    if (expected !== 0) await page.keyboard.down("f");
  }
  const result = await inspect();
  assert.equal(result.enemy.visible, false);
  assert.ok(result.state.defeated.includes("enemy7"));
  assert.equal(result.combat.phase, 2);
  assert.ok(result.state.health > 0);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: `${output}/guardian-derrotado.png` });
  fs.writeFileSync(
    `${output}/combate.json`,
    JSON.stringify({ history, errors, final: result }, null, 2),
  );
  console.log(
    "PASS guardián 3 ventanas, fase 2, defensa y golpes fuertes",
    history,
  );
  await context.close();
} finally {
  await browser.close();
}
