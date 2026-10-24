import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const out = "docs/capturas/fase17/auditoria";
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
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const phases = new Set();
const attacks = [];
try {
  await page.addInitScript(() => {
    localStorage.setItem(
      "sanity404-save",
      JSON.stringify({
        version: 1,
        room: 0,
        x: -1.3,
        z: -2.85,
        floor: 1,
        health: 100,
        sanity: 100,
        items: ["Folio del rellano", "Carta de la raíz"],
        collected: [],
        read: [],
        defeated: [],
        seals: [],
        elapsed: 0,
        ended: false,
      }),
    );
    localStorage.setItem(
      "sanity404-settings",
      JSON.stringify({
        quality: 1,
        volume: 0,
        reduced: false,
        cameraMode: "classic",
      }),
    );
  });
  await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect?.().draw.frame > 30);
  const initial = await page.evaluate(() => window.sanityInspect());
  if (initial.combat.kind !== "nameRoot") throw new Error("La Raíz no aparece");
  await page.screenshot({ path: `${out}/jefe-combate-inicio.png` });
  const deadline = Date.now() + 90000;
  let guarding = false;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.sanityInspect());
    phases.add(state.combat.phase);
    if (!state.enemy.visible || state.state.health <= 0 || state.paused) break;
    const vulnerable = state.combat.vulnerable > 0.15;
    if (
      vulnerable &&
      state.combat.stamina >= 35 &&
      state.combat.enemyHealth > 0
    ) {
      if (guarding) {
        await page.keyboard.up("f");
        guarding = false;
      }
      const before = state.combat.enemyHealth;
      await page.keyboard.press("j");
      const after = await page.evaluate(() => window.sanityInspect());
      attacks.push({
        before,
        after: after.combat.enemyHealth,
        phase: after.combat.phase,
        health: after.state.health,
      });
      await page.waitForTimeout(350);
      continue;
    }
    const shouldGuard =
      state.combat.windup > 0 || state.combat.aiState === "windup";
    if (shouldGuard && !guarding) {
      await page.keyboard.down("f");
      guarding = true;
    }
    if (!shouldGuard && guarding) {
      await page.keyboard.up("f");
      guarding = false;
    }
    await page.waitForTimeout(60);
  }
  if (guarding) await page.keyboard.up("f");
  const final = await page.evaluate(() => window.sanityInspect());
  await page.screenshot({ path: `${out}/jefe-combate-final.png` });
  const report = {
    date: new Date().toISOString(),
    initial: { kind: initial.combat.kind, health: initial.state.health },
    phases: [...phases].sort(),
    attacks,
    final: {
      enemyHealth: final.combat.enemyHealth,
      enemyVisible: final.enemy.visible,
      playerHealth: final.state.health,
      defeated: final.state.defeated,
      paused: final.paused,
      phase: final.combat.phase,
    },
    errors,
  };
  writeFileSync(`${out}/jefe-combate.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (errors.length) throw new Error("Errores de consola");
  if (!final.state.defeated.includes("mansion-root"))
    throw new Error("Victoria del jefe no alcanzada");
} finally {
  await browser.close();
}
