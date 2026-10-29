import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { browserLaunchOptions } from "./browser-launch.mjs";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  ...browserLaunchOptions(),
});
const page = await browser.newPage({ viewport: { width: 480, height: 320 } }),
  errors = [],
  pending = new Set(),
  networkErrors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("crash", () => errors.push("El renderer se cerró inesperadamente"));
page.on("request", (request) => pending.add(request));
page.on("requestfinished", (request) => pending.delete(request));
page.on("requestfailed", (request) => {
  pending.delete(request);
  networkErrors.push(`${request.url()}: ${request.failure()}`);
});
page.on("response", (response) => {
  if (response.status() >= 400)
    networkErrors.push(`HTTP ${response.status()}: ${response.url()}`);
});
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
let stage = "inicio";
const evidence = resolve(
  process.env.SANITY_SYSTEMS_OUTPUT || "/tmp/sanity404-systems-failure",
);
async function snapshot() {
  return page.evaluate(() => ({
    url: location.href,
    visibility: document.visibilityState,
    focused: document.hasFocus(),
    overlayHidden: document.querySelector("#overlay")?.hidden,
    panel: document.querySelector("#panel")?.textContent,
    location: document.querySelector("#location")?.textContent,
    health: document.querySelector("#hptext")?.textContent,
    sanity: document.querySelector("#sptext")?.textContent,
    toast: document.querySelector("#toast")?.textContent,
    retryVisible: Boolean(
      document.querySelector("#retry")?.getClientRects().length,
    ),
    saveRaw: localStorage.getItem("sanity404-save"),
    save: (() => {
      try {
        return JSON.parse(localStorage.getItem("sanity404-save") || "null");
      } catch {
        return "invalid JSON";
      }
    })(),
    inspect:
      typeof window.sanityInspect === "function"
        ? window.sanityInspect()
        : null,
  }));
}
async function assertActiveDeathScenario() {
  const current = await snapshot();
  assert.equal(current.overlayHidden, true, "La partida debe estar activa");
  assert.equal(
    current.focused,
    true,
    "Chrome debe conservar el foco del juego",
  );
  assert.equal(current.health, "12", "La partida debe empezar con 12 de salud");
  assert.equal(current.location, "Mansión Veyr");
  assert.equal(current.save?.health, 12);
}
async function navigate(method, url) {
  try {
    if (method === "reload") {
      await page.reload({ waitUntil: "domcontentloaded" });
    } else {
      await page.goto(url, { waitUntil: "domcontentloaded" });
    }
    await page
      .getByRole("button", { name: "Nueva partida", exact: true })
      .waitFor({ state: "visible" });
  } catch (error) {
    const readyState = await page
      .evaluate(() => document.readyState)
      .catch(() => null);
    throw new Error(
      `Navegación ${method} fallida: ${JSON.stringify({ url, readyState, pending: [...pending].map((request) => request.url()), networkErrors, errors })}`,
      { cause: error },
    );
  }
}
async function seed(changes, settings = {}) {
  await navigate(
    "goto",
    process.env.SANITY_TEST_URL || "http://localhost:5173",
  );
  await page.evaluate(
    ({ state, settings }) => {
      localStorage.setItem("sanity404-save", JSON.stringify(state));
      localStorage.setItem("sanity404-settings", JSON.stringify(settings));
    },
    { state: { ...base, ...changes }, settings },
  );
  await navigate("reload");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForFunction(
    (roomName) =>
      document.querySelector("#overlay")?.hidden &&
      document.querySelector("#viewport canvas")?.width > 0 &&
      document.querySelector("#location")?.textContent === roomName,
    {
      0: "Mansión Veyr",
      1: "Biblioteca prohibida",
      3: "Capilla del silencio",
      4: "Ruinas del intervalo",
    }[changes.room ?? 0],
  );
}
async function key(k) {
  await page.keyboard.press(k);
}
try {
  await seed({ x: 0, z: -6 });
  await key("e");
  await page.waitForFunction(() =>
    document.querySelector("#toast")?.textContent?.includes("llave"),
  );
  assert.equal(await page.locator("#location").innerText(), "Mansión Veyr");
  assert.match(await page.locator("#toast").innerText(), /llave/);
  console.log("PASS puerta cerrada sin llave");
  await seed({ room: 1, x: 0, z: -3.2, defeated: ["enemy1"] });
  await key("e");
  await page.locator("#answer2").click();
  await page.waitForFunction(
    () => Number(document.querySelector("#sptext")?.textContent) < 90,
  );
  console.log("PASS respuesta incorrecta reduce cordura");
  await seed({ room: 3, x: 0, z: -6, defeated: ["enemy3"] });
  await key("e");
  await page.waitForFunction(() =>
    document.querySelector("#toast")?.textContent?.includes("tres sellos"),
  );
  assert.equal(
    await page.locator("#location").innerText(),
    "Capilla del silencio",
  );
  assert.match(await page.locator("#toast").innerText(), /tres sellos/);
  console.log("PASS ruinas bloqueadas sin sellos");
  stage = "derrota";
  await seed({ x: 3, z: -3, health: 12 });
  await page.bringToFront();
  await page.waitForFunction(
    () => document.querySelector("#hptext")?.textContent === "12",
  );
  await assertActiveDeathScenario();
  // The active encounter is lethal; the last saved memory is a safe checkpoint.
  const checkpoint = { ...base, x: 0, z: 5, health: 100 };
  await page.evaluate((save) => {
    localStorage.setItem("sanity404-save", JSON.stringify(save));
  }, checkpoint);
  await page.waitForFunction(
    () =>
      document.querySelector("#hptext")?.textContent === "0" ||
      !document.querySelector("#overlay")?.hidden,
  );
  assert.equal(
    await page.locator("#hptext").textContent(),
    "0",
    "El combate debe reducir la salud a cero sin una pausa intermedia",
  );
  await page
    .getByRole("button", { name: "Reintentar" })
    .waitFor({ state: "visible" });
  const beforeRetry = await snapshot();
  assert.equal(beforeRetry.overlayHidden, false);
  assert.deepEqual(beforeRetry.save, checkpoint);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector("#overlay")?.hidden &&
      document.querySelector("#hptext")?.textContent === "100" &&
      document.querySelector("#location")?.textContent === "Mansión Veyr",
  );
  const afterRetry = await snapshot();
  assert.deepEqual(afterRetry.save, checkpoint);
  console.log("PASS daño, muerte y reintento");
  stage = "desenlace";
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
  await page.waitForFunction(() =>
    document.querySelector("#panel")?.textContent?.includes("final anticipado"),
  );
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
  assert.deepEqual(networkErrors, []);
  console.log("PASS sin errores JavaScript");
} catch (e) {
  await mkdir(dirname(evidence), { recursive: true }).catch(() => {});
  const state = await snapshot().catch((error) => ({
    snapshotError: String(error),
  }));
  await writeFile(
    `${evidence}.json`,
    JSON.stringify(
      { stage, error: String(e), state, errors, networkErrors },
      null,
      2,
    ),
  ).catch(() => {});
  await page.screenshot({ path: `${evidence}.png` }).catch(() => {});
  console.error(`Evidencias game-systems: ${evidence}.json, ${evidence}.png`);
  throw e;
} finally {
  await browser.close();
}
