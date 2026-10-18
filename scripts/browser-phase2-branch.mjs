import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

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
const results = [];
try {
  for (const remembered of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript((discovered) => {
      localStorage.setItem(
        "sanity404-save",
        JSON.stringify({
          version: 1,
          room: 7,
          x: 0,
          z: -5.8,
          health: 100,
          sanity: 80,
          items: [],
          collected: [],
          read: [],
          defeated: ["enemy7"],
          seals: [],
          elapsed: 0,
          ended: false,
          phase2: {
            visited: [0, 7],
            solved: ["basement"],
            steps: [0, 0, 0, 3],
            discoveries: discovered ? ["adrien"] : [],
            shortcuts: [],
            ending: false,
          },
        }),
      );
      localStorage.setItem(
        "sanity404-settings",
        JSON.stringify({ quality: 1, volume: 0, reduced: true }),
      );
    }, remembered);
    await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.keyboard.press("e");
    const title = remembered
      ? "Una puerta puede elegir a quién deja salir."
      : "El nombre que faltaba.";
    await page.getByRole("heading", { name: title }).waitFor();
    const snapshot = await page.evaluate(() => window.sanityInspect());
    assert.equal(snapshot.state.phase2.ending, true);
    assert.deepEqual(errors, []);
    results.push({ remembered, title, errors });
    await context.close();
  }
  fs.mkdirSync("docs/capturas/fase2", { recursive: true });
  fs.writeFileSync(
    "docs/capturas/fase2/desenlaces.json",
    JSON.stringify(results, null, 2),
  );
  console.log(
    "PASS desenlaces opcionales",
    results.map((r) => r.title),
  );
} finally {
  await browser.close();
}
