import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const bundledChrome = chromium.executablePath();

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (existsSync(bundledChrome) ? bundledChrome : "/usr/bin/google-chrome"),
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
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const faults = [];
page.on("pageerror", (error) => faults.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") faults.push(message.text());
});
const artifactDir = process.env.SANITY_ARTIFACT_DIR;
if (artifactDir) mkdirSync(artifactDir, { recursive: true });
async function capture(name) {
  if (artifactDir) await page.screenshot({ path: join(artifactDir, name) });
}
const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/";
const inspect = () => page.evaluate(() => window.sanityInspect());
const fresh = {
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
  phase2: {
    visited: [0],
    solved: [],
    steps: [0, 0, 0, 0],
    discoveries: [],
    shortcuts: [],
    ending: false,
  },
};
async function seed(patch) {
  await page.goto(url);
  await page.evaluate(
    (save) => localStorage.setItem("sanity404-save", JSON.stringify(save)),
    {
      ...structuredClone(fresh),
      ...patch,
    },
  );
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect().draw.frame > 4);
  await page.waitForFunction(() => window.sanityInspect().state.elapsed > 0.05);
  assert.equal((await inspect()).paused, false);
}
async function checkRoom(room, title, hero) {
  const current = await inspect();
  assert.equal(current.state.room, room);
  assert.equal(await page.locator("#location").innerText(), title);
  assert.match(await page.locator("#hero-name").innerText(), hero);
  assert.ok(current.draw.frame > 0);
  assert.ok(current.canvas.width > 0 && current.canvas.height > 0);
}
try {
  await seed({ room: 8, phase2: { ...fresh.phase2, visited: [0, 8] } });
  await checkRoom(8, "Santuario de los nombres", /LUCIUS/);
  await seed({ room: 9, phase2: { ...fresh.phase2, visited: [0, 9] } });
  await checkRoom(9, "Claustro de la ceniza", /ISABELLE/);
  await seed({ room: 10, phase2: { ...fresh.phase2, visited: [0, 9, 10] } });
  await checkRoom(10, "Scriptorium del silencio", /ISABELLE/);
  await seed({
    room: 5,
    x: 2.8,
    z: 3.2,
    phase2: { ...fresh.phase2, visited: [0, 5] },
    items: [
      "Tablilla del intervalo",
      "Códice de Montfort",
      "Memoria reconciliada",
    ],
  });
  await checkRoom(5, "Archivo familiar", /ÉLISE/);
  await page.keyboard.press("e");
  await page.getByRole("button", { name: /El juramento de Lucius/ }).click();
  let current = await inspect();
  assert.ok(current.state.items.includes("Juramento de Lucius"));
  assert.ok(!current.state.items.includes("Promesa de Isabelle"));
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.evaluate(
    (saved) => localStorage.setItem("sanity404-save", JSON.stringify(saved)),
    current.state,
  );
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(() => window.sanityInspect().draw.frame > 4);
  current = await inspect();
  assert.equal(current.state.room, 5);
  assert.ok(current.state.items.includes("Juramento de Lucius"));
  assert.ok(!current.state.items.includes("Promesa de Isabelle"));

  await seed({
    room: 0,
    x: 5.05,
    z: 3,
    phase2: { ...fresh.phase2, visited: [0] },
  });
  assert.match(await page.locator("#prompt").innerText(), /grieta romana/);
  current = await inspect();
  assert.equal(current.cinematicZone, "umbral romano");
  assert.equal(current.cameraCorrected, false);
  await capture("portal-romano.png");
  await page.keyboard.press("e");
  await page.waitForFunction(() => window.sanityInspect().state.room === 8);
  await checkRoom(8, "Santuario de los nombres", /LUCIUS/);
  await seed({
    room: 0,
    x: 5.8,
    z: -6,
    phase2: { ...fresh.phase2, visited: [0] },
  });
  assert.match(await page.locator("#prompt").innerText(), /carta astral/);
  current = await inspect();
  assert.equal(current.cinematicZone, "rellano superior");
  assert.equal(current.cameraCorrected, false);
  await capture("rellano-astral.png");
  await seed({
    room: 8,
    x: -2.9,
    z: -4.25,
    defeated: ["enemy8"],
    phase2: { ...fresh.phase2, visited: [0, 8] },
  });
  await page.keyboard.press("e");
  await page.locator("#roman-answer1").click();
  assert.ok((await inspect()).state.items.includes("Marca de Varro"));
  await seed({
    room: 8,
    x: 0,
    z: -4.1,
    items: ["Marca de Varro"],
    defeated: ["enemy8"],
    phase2: { ...fresh.phase2, visited: [0, 8] },
  });
  await page.keyboard.press("e");
  await page.getByRole("button", { name: "Continuar" }).click();
  assert.ok((await inspect()).state.items.includes("Tablilla del intervalo"));

  await seed({
    room: 0,
    x: -5.8,
    z: -6,
    phase2: { ...fresh.phase2, visited: [0] },
  });
  await page.keyboard.press("e");
  await page.waitForFunction(() => window.sanityInspect().state.room === 9);
  await checkRoom(9, "Claustro de la ceniza", /ISABELLE/);
  await seed({
    room: 10,
    x: -2.9,
    z: -4.7,
    defeated: ["enemy10"],
    phase2: { ...fresh.phase2, visited: [0, 9, 10] },
  });
  await page.keyboard.press("e");
  await page.locator("#med-answer1").click();
  assert.ok((await inspect()).state.items.includes("Sello de Montfort"));
  await seed({
    room: 10,
    x: 0,
    z: -4.1,
    items: ["Sello de Montfort"],
    defeated: ["enemy10"],
    phase2: { ...fresh.phase2, visited: [0, 9, 10] },
  });
  await page.keyboard.press("e");
  await page.getByRole("button", { name: "Continuar" }).click();
  current = await inspect();
  assert.ok(current.state.items.includes("Códice de Montfort"));
  await page.evaluate(
    (saved) => localStorage.setItem("sanity404-save", JSON.stringify(saved)),
    current.state,
  );
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  assert.ok((await inspect()).state.items.includes("Códice de Montfort"));
  assert.deepEqual(faults, []);
  console.log("PASS historical portals, puzzles, artifacts, save and choice");
} catch (error) {
  await capture("fallo-historico.png").catch(() => {});
  throw error;
} finally {
  if (artifactDir)
    writeFileSync(
      join(artifactDir, "diagnostico.json"),
      JSON.stringify(
        { url, faults, browserVersion: browser.version() },
        null,
        2,
      ),
    );
  await browser.close();
}
