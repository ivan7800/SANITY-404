import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || chromium.executablePath(),
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const faults = [];
page.on("pageerror", (error) => faults.push(error.message));
const url = process.env.SANITY_TEST_URL || "http://localhost:5173";
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
  assert.deepEqual(faults, []);
  console.log("PASS 3 historical rooms, selectable consequence and HUD");
} finally {
  await browser.close();
}
