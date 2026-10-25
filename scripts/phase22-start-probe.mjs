import { chromium, firefox } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const option = (name, fallback) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3) ?? fallback;
const url = option(
  "url",
  process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/",
);
const out = option("output-dir", "docs/capturas/fase22");
const headed = !process.argv.includes("--headless");
const through = option("through", "lucius");
if (!["lucius", "aurelia"].includes(through))
  throw new Error("--through debe ser lucius o aurelia");
const traceName =
  through === "aurelia" ? "lucius-aurelia-trace.json" : "lucius-trace.json";
const timeout = Number(option("timeout-ms", "30000"));
if (!Number.isFinite(timeout) || timeout < 1000)
  throw new Error("--timeout-ms debe ser >= 1000");
mkdirSync(out, { recursive: true });

const trace = {
  startedAt: new Date().toISOString(),
  url,
  headed,
  browser: process.env.SANITY_BROWSER || "chromium",
  preparedState: false,
  through,
  actions: [],
  checks: [],
  errors: [],
  chapters: [],
  completed: false,
};
const started = performance.now();
let browser;
let page;
const inspect = () => page.evaluate(() => window.sanityInspect());
const audit = () => page.evaluate(() => window.sanityRoomAudit());

function check(label, condition, details = {}) {
  const passed = Boolean(condition);
  trace.checks.push({ label, passed, details, at: new Date().toISOString() });
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  assert.ok(passed, `${label}: ${JSON.stringify(details)}`);
}

async function snapshot(label, extra = {}) {
  const s = await inspect();
  const entry = {
    label,
    at: new Date().toISOString(),
    wallMs: Math.round(performance.now() - started),
    room: s.state.room,
    x: s.state.x,
    z: s.state.z,
    health: s.state.health,
    sanity: s.state.sanity,
    items: s.state.items,
    read: s.state.read,
    defeated: s.state.defeated,
    campaign: s.state.campaign,
    enemy: s.enemy,
    combat: s.combat,
    prompt: await page.locator("#prompt").innerText(),
    memory: s.memory,
    ...extra,
  };
  trace.actions.push(entry);
  console.log(
    `ACTION ${label} room=${entry.room} x=${entry.x.toFixed(2)} z=${entry.z.toFixed(2)} health=${entry.health} enemyHP=${entry.combat.enemyHealth}`,
  );
  return s;
}

async function press(key) {
  const frame = (await inspect()).draw.frame;
  await page.keyboard.press(key);
  await page.waitForFunction(
    (before) => window.sanityInspect().draw.frame > before,
    frame,
    { timeout },
  );
}

async function waitForRoom(room, playing = false) {
  await page.waitForFunction(
    ({ expected, playing }) => {
      const current = window.sanityInspect?.();
      return current?.state.room === expected && (!playing || !current.paused);
    },
    { expected: room, playing },
    { timeout },
  );
}

async function capture(name) {
  const prefix = through === "lucius" ? "lucius" : "acumulativa";
  const path = join(out, `${prefix}-${name}.png`);
  await page.screenshot({ path });
  trace.actions.push({ label: "captura", path, at: new Date().toISOString() });
}

async function walk(key, ms) {
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(ms);
  } finally {
    await page.keyboard.up(key);
  }
}

async function defendCurrentAttack(context) {
  const before = await inspect();
  await page.keyboard.down("f");
  try {
    await page.waitForFunction(
      () => window.sanityInspect().combat.windup <= 0,
      null,
      { timeout: 2500 },
    );
  } finally {
    await page.keyboard.up("f");
  }
  const after = await inspect();
  trace.actions.push({
    label: "defensa",
    context,
    at: new Date().toISOString(),
    room: before.state.room,
    player: [before.state.x, before.state.z],
    enemyKind: before.combat.kind,
    enemyPosition: before.enemy.position,
    healthBefore: before.state.health,
    healthAfter: after.state.health,
    staminaAfter: after.combat.stamina,
  });
  if (after.state.health <= 0)
    check("Protagonista sobrevive a la defensa", false, {
      context,
      health: after.state.health,
    });
}

async function go(x, z) {
  for (const [axis, target] of [
    ["x", x],
    ["z", z],
  ]) {
    const initial = await inspect();
    const diff = target - initial.state[axis];
    if (Math.abs(diff) < 0.2) continue;
    const positive = diff > 0;
    const key = axis === "x" ? (positive ? "d" : "a") : positive ? "s" : "w";
    let stalled = 0;
    let dangerLogged = false;
    const began = performance.now();
    while (true) {
      const before = await inspect();
      const remaining = target - before.state[axis];
      if (positive ? remaining <= 0.12 : remaining >= -0.12) break;
      if (before.state.health <= 0)
        check(`Movimiento ${axis} interrumpido por muerte`, false, {
          room: before.state.room,
          x: before.state.x,
          z: before.state.z,
          enemy: before.enemy,
          combat: before.combat,
        });
      if (performance.now() - began > timeout)
        check(`Movimiento ${axis} dentro del tiempo`, false, {
          target,
          x: before.state.x,
          z: before.state.z,
          enemy: before.enemy,
          combat: before.combat,
        });

      const enemyDistance = Math.hypot(
        before.enemy.position[0] - before.state.x,
        before.enemy.position[2] - before.state.z,
      );
      if (before.enemy.visible && enemyDistance < 2.5 && !dangerLogged) {
        dangerLogged = true;
        trace.actions.push({
          label: "amenaza durante navegación",
          at: new Date().toISOString(),
          room: before.state.room,
          x: before.state.x,
          z: before.state.z,
          health: before.state.health,
          enemyDistance,
          enemy: before.enemy,
          combat: before.combat,
        });
      }
      if (
        before.enemy.visible &&
        enemyDistance < 2.3 &&
        before.combat.windup > 0
      ) {
        await defendCurrentAttack(`navegación a ${axis}=${target}`);
        continue;
      }

      const stepMs = Math.max(
        45,
        Math.min(180, ((Math.abs(remaining) - 0.08) / 2.7) * 1000),
      );
      await walk(key, stepMs);
      const after = await inspect();
      if (after.state.health < before.state.health) {
        trace.actions.push({
          label: "daño durante navegación",
          at: new Date().toISOString(),
          room: after.state.room,
          x: after.state.x,
          z: after.state.z,
          healthBefore: before.state.health,
          healthAfter: after.state.health,
          enemy: after.enemy,
          combat: after.combat,
        });
      }
      if (after.state.health <= 0)
        check(`Movimiento ${axis} interrumpido por muerte`, false, {
          room: after.state.room,
          x: after.state.x,
          z: after.state.z,
          enemy: after.enemy,
          combat: after.combat,
        });
      stalled =
        Math.abs(after.state[axis] - before.state[axis]) < 0.025
          ? stalled + 1
          : 0;
      if (stalled >= 3)
        check(`Ruta libre hacia ${axis}=${target}`, false, {
          room: after.state.room,
          x: after.state.x,
          z: after.state.z,
          enemy: after.enemy,
          combat: after.combat,
        });
    }
    const after = await inspect();
    check(
      `Movimiento hasta ${axis}=${target}`,
      after.state.health > 0 &&
        (positive
          ? after.state[axis] >= target - 0.12
          : after.state[axis] <= target + 0.12),
    );
    trace.actions.push({
      label: "movimiento completado",
      at: new Date().toISOString(),
      room: after.state.room,
      axis,
      target,
      from: [initial.state.x, initial.state.z],
      to: [after.state.x, after.state.z],
      healthBefore: initial.state.health,
      healthAfter: after.state.health,
      enemy: after.enemy,
      combat: after.combat,
    });
  }
}

async function useObject(id, waypoint, panelButton, targetRoom) {
  const object = (await audit()).interactables.find((entry) => entry.id === id);
  check(`Objeto disponible: ${id}`, object !== undefined);
  await go(...waypoint);
  await page.waitForFunction(
    (name) => document.querySelector("#prompt")?.textContent?.includes(name),
    object.name,
    { timeout: 5000 },
  );
  await press("e");
  if (targetRoom !== undefined) await waitForRoom(targetRoom);
  if (panelButton)
    await page.getByRole("button", { name: panelButton }).click();
  await snapshot(`interacción ${id}`);
}

async function enterPortal(id, waypoint, room, hero) {
  await useObject(id, waypoint, undefined, room);
  const s = await inspect();
  check(`Transición legítima por ${id}`, s.state.room === room);
  check(
    `Protagonista de sala ${room}`,
    hero.test(await page.locator("#hero-name").innerText()),
  );
  const startButton = page.getByRole("button", {
    name: "Comenzar investigación",
  });
  check(`Introducción de sala ${room}`, await startButton.isVisible());
  await capture(`${id}-introduccion`);
  await startButton.click();
  await waitForRoom(room, true);
  return performance.now();
}

async function readDocument(room, waypoint) {
  await useObject(`note${room}`, waypoint, "Guardar en el diario");
  check(
    `Documento ${room} leído`,
    (await inspect()).state.read.includes(String(room)),
  );
}

async function collectItem(id, waypoint, item, panelButton) {
  await useObject(id, waypoint, panelButton);
  await page.waitForFunction(
    (value) => window.sanityInspect().state.items.includes(value),
    item,
    { timeout },
  );
  const s = await inspect();
  check(
    `${item} obtenido por interacción`,
    s.state.items.includes(item) && s.state.collected.includes(item),
  );
}

async function solveSingleChoice(id, waypoint, answer, solution) {
  await useObject(id, waypoint);
  check(
    `Puzle ${id} presenta respuesta`,
    await page.locator(answer).isVisible(),
  );
  await page.locator(answer).click();
  await page.waitForFunction(
    (item) => window.sanityInspect().state.items.includes(item),
    solution,
    { timeout },
  );
  await snapshot(`puzle ${id} resuelto`);
  check(
    `Puzle ${id} completado`,
    (await inspect()).state.items.includes(solution),
  );
}

async function finishChapter({
  id,
  exitId,
  waypoint,
  button,
  artifact,
  enemyId,
  startedAt,
}) {
  await useObject(exitId, waypoint);
  const exitButton = page.getByRole("button", { name: button });
  await exitButton.waitFor({ timeout });
  check(
    `Epílogo de ${id}`,
    (await page.locator("#panel").innerText()).includes("CONCLUIDO"),
  );
  await exitButton.click();
  await waitForRoom(0, true);
  const s = await snapshot(`regreso de ${id} a 1927`);
  check(
    `${id} completado al regresar`,
    s.state.campaign.completed.includes(id) &&
      s.state.items.includes(artifact) &&
      s.state.defeated.includes(enemyId),
  );
  const durationMs = Math.round(performance.now() - startedAt);
  trace.chapters.push({
    id,
    durationMs,
    artifact,
    enemyId,
    health: s.state.health,
    completedAfterReturn: [...s.state.campaign.completed],
  });
  await capture(`${id}-regreso`);
  return s;
}

async function saveAndReload(ids, artifacts, nextPortal, nextRoom) {
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sanity404-save") || "null"),
  );
  check(
    `Guardado tras ${ids.at(-1)}`,
    saved &&
      ids.every((id) => saved.campaign.completed.includes(id)) &&
      artifacts.every((item) => saved.items.includes(item)),
  );
  trace.actions.push({
    label: "guardado verificado",
    at: new Date().toISOString(),
    completed: saved.campaign.completed,
    items: saved.items,
  });
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await waitForRoom(0, true);
  const s = await snapshot(`recarga tras ${ids.at(-1)}`);
  check(
    `Recarga mantiene ${ids.join(" y ")}`,
    ids.every((id) => s.state.campaign.completed.includes(id)) &&
      artifacts.every((item) => s.state.items.includes(item)),
  );
  check(
    `Portal ${nextPortal} desbloqueado`,
    (await audit()).interactables.some(
      (entry) => entry.id === nextPortal && entry.target === nextRoom,
    ),
  );
  trace.actions.push({
    label: "recarga verificada",
    at: new Date().toISOString(),
    completed: s.state.campaign.completed,
    items: s.state.items,
    nextPortal,
  });
}

function directionToEnemy(s) {
  const dx = s.enemy.position[0] - s.state.x;
  const dz = s.enemy.position[2] - s.state.z;
  return Math.abs(dx) > Math.abs(dz)
    ? dx > 0
      ? "d"
      : "a"
    : dz > 0
      ? "s"
      : "w";
}

async function fightEnemy({ room, kind, health, defeatedId }) {
  const initial = await inspect();
  check(
    `Enemigo de sala ${room} vivo con ${health} puntos`,
    initial.state.room === room &&
      initial.enemy.visible &&
      initial.combat.kind === kind &&
      initial.combat.enemyHealth === health,
  );
  const fightStart = performance.now();
  const attacks = [];
  let guards = 0;
  while (performance.now() - fightStart < 90000) {
    const s = await inspect();
    if (s.state.defeated.includes(defeatedId)) break;
    if (s.state.health <= 0)
      check("Protagonista continúa con vida", false, {
        health: s.state.health,
      });
    const distance = Math.hypot(
      s.enemy.position[0] - s.state.x,
      s.enemy.position[2] - s.state.z,
    );
    if (s.combat.windup > 0 && distance < 2.3) {
      await defendCurrentAttack(`combate en sala ${room}`);
      guards++;
      continue;
    }
    if (distance > 1.7) {
      await walk(directionToEnemy(s), 280);
      continue;
    }
    await walk(directionToEnemy(s), 90);
    const before = await inspect();
    if (before.combat.windup > 0) continue;
    const kind = before.combat.stamina >= 35 ? "fuerte" : "ligero";
    await press(kind === "fuerte" ? "j" : "Space");
    await page.waitForTimeout(220);
    const after = await inspect();
    const attack = {
      kind,
      enemyHealthBefore: before.combat.enemyHealth,
      enemyHealthAfter: after.combat.enemyHealth,
      playerHealthAfter: after.state.health,
      staminaBefore: before.combat.stamina,
      staminaAfter: after.combat.stamina,
    };
    attacks.push(attack);
    trace.actions.push({
      label: "ataque",
      at: new Date().toISOString(),
      ...attack,
    });
    await page.waitForTimeout(450);
  }
  const after = await snapshot(`combate de sala ${room} terminado`, {
    attacks,
    guards,
  });
  check(
    "Ataques efectivos registrados",
    attacks.some((a) => a.enemyHealthAfter < a.enemyHealthBefore),
    { attacks },
  );
  check(
    `Enemigo ${defeatedId} derrotado de verdad`,
    after.state.defeated.includes(defeatedId) &&
      !after.enemy.visible &&
      after.combat.aiState === "dead" &&
      after.combat.enemyHealth <= 0,
    {
      defeated: after.state.defeated,
      visible: after.enemy.visible,
      combat: after.combat,
    },
  );
}

async function runLucius() {
  await go(5.2, 3);
  await snapshot("portal romano próximo");
  const startedAt = await enterPortal("roman-portal", [5.2, 3], 8, /LUCIUS/);
  let s = await inspect();
  check(
    "Centurión inicializado en 189",
    s.combat.kind === "centurion" &&
      s.combat.enemyHealth === 115 &&
      s.state.campaign.visited.includes("roman-189"),
  );

  await readDocument(8, [-4.3, 5]);
  check(
    "Formación imposible presenciada",
    (await inspect()).state.campaign.witnessed.includes("roman-formation"),
  );
  await go(0, 1.4);
  await fightEnemy({
    room: 8,
    kind: "centurion",
    health: 115,
    defeatedId: "enemy8",
  });

  for (const [id, waypoint] of [
    ["roman-echo-ash", [-4.15, 3.8]],
    ["roman-echo-tide", [4.15, 3.8]],
    ["roman-echo-threshold", [0, 1.35]],
  ]) {
    await useObject(id, waypoint, "Conservar el testimonio");
    check(
      `Testimonio persistente: ${id}`,
      (await inspect()).state.campaign.witnessed.includes(id),
    );
  }
  await solveSingleChoice(
    "roman-inscription",
    [-2.9, -3.25],
    "#roman-answer1",
    "Marca de Varro",
  );
  await collectItem(
    "roman-tablet",
    [0, -3.2],
    "Tablilla del intervalo",
    "Continuar",
  );
  await capture("tablilla");

  s = await finishChapter({
    id: "roman-189",
    exitId: "roman-return",
    waypoint: [0, 5.1],
    button: "Regresar a la mansión",
    artifact: "Tablilla del intervalo",
    enemyId: "enemy8",
    startedAt,
  });
  check(
    "Lucius sigue completado en 1927",
    s.state.room === 0 && s.state.campaign.completed.includes("roman-189"),
  );
  await saveAndReload(
    ["roman-189"],
    ["Tablilla del intervalo"],
    "mosaic-portal",
    11,
  );
  console.log(
    `PASS Lucius 189 certificado en ${trace.chapters.at(-1).durationMs} ms`,
  );
}

async function runAurelia() {
  // The saved mansion still contains its shade. Defeat it with normal combat
  // before crossing the right-hand corridor; standing against the central
  // table at z=-0.6 lets it attack indefinitely.
  const mansion = await inspect();
  check(
    "Amenaza de la mansión identificada",
    mansion.state.room === 0 &&
      mansion.combat.kind === "shade" &&
      mansion.enemy.visible,
  );
  await fightEnemy({
    room: 0,
    kind: "shade",
    health: 60,
    defeatedId: "enemy0",
  });
  check(
    "Sombra de la mansión derrotada legítimamente",
    (await inspect()).state.defeated.includes("enemy0"),
  );
  await go(0, 3.1);
  await go(6.2, 3.1);
  const startedAt = await enterPortal(
    "mosaic-portal",
    [6.2, -0.6],
    11,
    /AURELIA/,
  );
  check(
    "Lucius persiste al entrar en 312",
    (await inspect()).state.campaign.completed.includes("roman-189"),
  );
  await readDocument(11, [-3.3, 5]);
  await collectItem("mosaic-pigment", [-4.2, 1.6], "Pigmento de cinabrio");
  await useObject("mosaic-kiln", [0, -5.1], undefined, 12);
  check("Horno de teselas alcanzado", (await inspect()).state.room === 12);
  await readDocument(12, [-3.3, 5]);

  await go(0, 1.4);
  await fightEnemy({
    room: 12,
    kind: "mosaic",
    health: 95,
    defeatedId: "enemy12",
  });
  await solveSingleChoice(
    "mosaic-pattern",
    [-2.7, -3.8],
    "#mosaic-answer1",
    "Boceto recompuesto",
  );
  await collectItem("mosaic-mold", [0, -3.2], "Molde de Aurelia", "Continuar");
  await capture("molde-aurelia");

  await useObject("mosaic-back", [0, 5.1], undefined, 11);
  check(
    "Regreso legítimo del horno a la galería",
    (await inspect()).state.room === 11,
  );
  await finishChapter({
    id: "mosaic-312",
    exitId: "mosaic-return",
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: "Molde de Aurelia",
    enemyId: "enemy12",
    startedAt,
  });
  await saveAndReload(
    ["roman-189", "mosaic-312"],
    ["Tablilla del intervalo", "Molde de Aurelia"],
    "coast-portal",
    13,
  );
  console.log(
    `PASS Aurelia 312 certificada en ${trace.chapters.at(-1).durationMs} ms`,
  );
}

try {
  const useFirefox = process.env.SANITY_BROWSER === "firefox";
  browser = useFirefox
    ? await firefox.launch({
        executablePath: "/usr/bin/firefox",
        headless: true,
      })
    : await chromium.launch({
        executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
        headless: !headed,
        chromiumSandbox: true,
        ignoreDefaultArgs: ["--enable-unsafe-swiftshader"],
      });
  trace.browserVersion = browser.version();
  page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  page.setDefaultTimeout(timeout);
  page.on("pageerror", (error) =>
    trace.errors.push({ type: "pageerror", message: error.message }),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      trace.errors.push({ type: "console", message: message.text() });
  });

  await page.goto(url);
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.waitForFunction(() => window.sanityInspect().draw.frame > 5);
  let s = await snapshot("Nueva partida");
  check(
    "Nueva partida limpia en 1927",
    s.state.room === 0 &&
      s.state.campaign.completed.length === 0 &&
      !s.state.defeated.includes("enemy8"),
  );

  await runLucius();
  if (through === "aurelia") await runAurelia();
  check(
    "Todos los capítulos solicitados están completos",
    trace.chapters.length === (through === "aurelia" ? 2 : 1) &&
      trace.chapters.every((chapter) =>
        chapter.completedAfterReturn.includes(chapter.id),
      ),
  );
  check("Sin errores JavaScript", trace.errors.length === 0, {
    errors: trace.errors,
  });
  trace.completed = true;
  console.log(
    `PASS ${through === "aurelia" ? "Lucius 189 y Aurelia 312" : "Lucius 189"} en ${Math.round((performance.now() - started) / 1000)} s`,
  );
} catch (error) {
  trace.errors.push({
    type: "failure",
    message: String(error),
    stack: error.stack,
  });
  console.error(`FAIL campaña hasta ${through}: ${error.message}`);
  if (page) {
    await snapshot("estado del fallo").catch(() => {});
    await page
      .screenshot({ path: join(out, `${through}-fallo.png`) })
      .catch(() => {});
  }
  process.exitCode = 1;
} finally {
  trace.finishedAt = new Date().toISOString();
  trace.wallMs = Math.round(performance.now() - started);
  writeFileSync(join(out, traceName), JSON.stringify(trace, null, 2));
  if (browser) await browser.close().catch(() => {});
}
