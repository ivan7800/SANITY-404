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
  room: 1,
  x: 0,
  z: 5,
  health: 100,
  sanity: 85,
  items: ["Llave de latón", "Medallón Veyr"],
  collected: [],
  read: [],
  defeated: ["enemy1", "enemy3", "enemy5", "enemy6", "enemy7"],
  seals: [],
  elapsed: 0,
  ended: false,
  phase2: {
    visited: [0, 1],
    solved: [],
    steps: [0, 0, 0, 0],
    discoveries: [],
    shortcuts: [],
    ending: false,
  },
};
const orders = {
  manuscripts: [2, 0, 1],
  genealogy: [0, 1, 2],
  astronomy: [2, 1, 0],
  basement: [2, 0, 1],
};
const logs = [];
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
    if (!sessionStorage.getItem("phase2-seeded")) {
      localStorage.setItem("sanity404-save", JSON.stringify(save));
      sessionStorage.setItem("phase2-seeded", "1");
    }
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
  const go = async (axis, target) => {
    const current = (await inspect()).state[axis];
    if (Math.abs(target - current) < 0.12) return;
    const key =
      axis === "x"
        ? target > current
          ? "d"
          : "a"
        : target > current
          ? "s"
          : "w";
    await page.keyboard.down(key);
    try {
      await page.waitForFunction(
        ({ axis, target, positive }) =>
          positive
            ? window.sanityInspect().state[axis] >= target - 0.11
            : window.sanityInspect().state[axis] <= target + 0.11,
        { axis, target, positive: target > current },
        { timeout: 16000 },
      );
    } catch (error) {
      throw new Error(
        `Ruta bloqueada: sala ${(await inspect()).state.room}, ${axis} ${current.toFixed(2)} → ${target}, posición ${JSON.stringify((await inspect()).state)}`,
        { cause: error },
      );
    } finally {
      await page.keyboard.up(key);
    }
  };
  const at = async (x, z) => {
    await go("z", z);
    await go("x", x);
  };
  const press = async () => {
    await page.keyboard.press("e");
    await page.waitForTimeout(100);
  };
  const note = async () => {
    await press();
    await page.getByRole("button", { name: "Guardar en el diario" }).click();
  };
  const puzzle = async (id) => {
    await press();
    for (const choice of orders[id])
      await page.locator(`#phase2-answer${choice}`).click();
    assert.ok((await inspect()).state.phase2.solved.includes(id));
    logs.push(`puzzle ${id}`);
  };
  const door = async (room) => {
    await press();
    await page.waitForFunction(
      (value) => window.sanityInspect().state.room === value,
      room,
    );
    logs.push(`sala ${room}`);
  };
  const shot = async (name) => {
    await page.screenshot({ path: `${output}/${name}.png` });
  };
  await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await go("x", -5.5);
  await note();
  await go("x", 0);
  await go("z", 0.5);
  await shot("biblioteca");
  await go("z", -1);
  await go("x", 2.4);
  await puzzle("manuscripts");
  await go("z", -0.5);
  await go("x", 6.2);
  await door(5);
  await go("x", 0);
  await go("z", 5);
  await go("x", -5.5);
  await note();
  await go("x", 0);
  await go("z", 2);
  await shot("archivo");
  await go("z", -3);
  await puzzle("genealogy");
  await go("z", 0);
  await go("x", 6.2);
  await door(6);
  await go("x", 0);
  await go("z", 5);
  await go("x", -5.5);
  await note();
  await go("x", 0);
  await go("z", 1.8);
  await shot("invernadero");
  await go("z", 4);
  await go("x", 3);
  await press();
  await page.getByRole("button", { name: "Conservar en el diario" }).click();
  assert.ok((await inspect()).state.phase2.discoveries.includes("adrien"));
  await go("x", 0);
  await go("z", 0);
  await go("x", 6.2);
  await door(3);
  await go("z", 1.4);
  await go("x", 0);
  await go("z", 5);
  await go("x", -5.5);
  await note();
  await go("x", 0);
  await go("z", 1.4);
  await shot("capilla");
  await go("z", -3.5);
  await go("x", -2.1);
  await puzzle("astronomy");
  assert.ok(
    (await inspect()).state.phase2.shortcuts.includes("library-chapel"),
  );
  await go("x", 0);
  await go("z", 1.4);
  await go("x", 6.2);
  await door(7);
  await go("x", 0);
  await go("z", 5);
  await go("x", -5.5);
  await note();
  await go("x", 0);
  await go("z", 1.8);
  await shot("sotanos");
  await go("z", -4.3);
  await puzzle("basement");
  await shot("sello-sotano");
  await go("z", 5);
  await go("x", -2);
  await press();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sanity404-save")),
  );
  assert.equal(saved.room, 7);
  assert.equal(saved.phase2.solved.length, 4);
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  assert.equal((await inspect()).state.phase2.solved.length, 4);
  logs.push("guardado y carga");
  await go("x", 0);
  await go("z", -5.8);
  await press();
  await page.getByRole("button", { name: "Volver al título" }).waitFor();
  assert.equal((await inspect()).state.phase2.ending, true);
  assert.deepEqual(errors, []);
  logs.push("desenlace fase 2");
  fs.writeFileSync(
    `${output}/recorrido.json`,
    JSON.stringify({ logs, errors, state: (await inspect()).state }, null, 2),
  );
  console.log("PASS", logs.join(" · "));
  await context.close();
} finally {
  await browser.close();
}
