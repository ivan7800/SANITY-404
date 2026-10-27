/** Development-only browser audit. Never used as campaign certification. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { blocked, ACTOR_RADIUS } from "../src/systems/collision.ts";
import { browserLaunchOptions } from "./browser-launch.mjs";
import { planRoute } from "./phase22-navigation.mjs";

const base = process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/";
const output = new URL("../docs/capturas/rescate/", import.meta.url);
const runId = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");
await mkdir(output, { recursive: true });
const evidence = {
  at: new Date().toISOString(),
  base,
  mode: "QA aislado",
  rooms: [],
  collisions: [],
  errors: [],
};
let browser;

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    ...browserLaunchOptions(),
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  await page.goto(new URL("?qa=1", base).toString());
  await page.waitForFunction(() => Boolean(window.sanityQa));
  for (let room = 0; room < 29; room++) {
    const result = await page.evaluate((index) => {
      const state = window.sanityQa.openRoom(index);
      const colliders = window.sanityQa.showColliders();
      window.sanityQa.clear();
      return {
        room: state.state.room,
        position: [state.state.x, state.state.z],
        colliders,
        objects: window.sanityQa.objects().length,
        memory: state.memory,
        draw: state.draw,
      };
    }, room);
    assert.equal(result.room, room);
    assert.ok(result.colliders > 0, `Sala ${room} sin colisionadores`);
    evidence.rooms.push(result);
    if ([0, 4, 10, 20, 28].includes(room))
      await page.screenshot({
        path: new URL(`sala-${room}.png`, output).pathname,
      });
  }

  for (const room of [0, 4, 8, 10, 20, 28]) {
    const setup = await page.evaluate((index) => {
      window.sanityQa.openRoom(index);
      return {
        objects: window.sanityQa.objects(),
        obstacles: window.sanityQa.obstacles(),
      };
    }, room);
    const target = setup.objects.find((object) =>
      setup.obstacles.some((obstacle) => obstacle.id === object.id),
    );
    assert.ok(target, `Sala ${room}: falta sólido interactivo`);
    const solid = setup.obstacles.find((obstacle) => obstacle.id === target.id);
    const sides = [
      { x: solid.x - solid.w / 2 - ACTOR_RADIUS - 0.14, z: solid.z, key: "d" },
      { x: solid.x + solid.w / 2 + ACTOR_RADIUS + 0.14, z: solid.z, key: "a" },
      { x: solid.x, z: solid.z - solid.d / 2 - ACTOR_RADIUS - 0.14, key: "s" },
      { x: solid.x, z: solid.z + solid.d / 2 + ACTOR_RADIUS + 0.14, key: "w" },
    ];
    const start = sides.find(
      (point) => !blocked(point.x, point.z, setup.obstacles),
    );
    assert.ok(start, `Sala ${room}: no hay lado libre junto a ${target.id}`);
    const before = await page.evaluate(
      ({ x, z }) => window.sanityQa.position(x, z),
      start,
    );
    await page.keyboard.down(start.key);
    await page.waitForTimeout(900);
    await page.keyboard.up(start.key);
    const after = await page.evaluate(() => window.sanityQa.inspect());
    assert.equal(after.state.room, room);
    assert.equal(
      blocked(after.state.x, after.state.z, setup.obstacles),
      false,
      `${room}:${target.id}`,
    );
    evidence.collisions.push({
      room,
      object: target.id,
      from: [before.state.x, before.state.z],
      to: [after.state.x, after.state.z],
      blocked: false,
    });
  }
  const vestibule = await page.evaluate(() => {
    window.sanityQa.openRoom(0);
    window.sanityQa.position(-1.1475, 4.46);
    return {
      start: window.sanityQa.inspect().state,
      obstacles: window.sanityQa.obstacles(),
    };
  });
  assert.equal(blocked(-1.5, 4.46, vestibule.obstacles), true);
  await page.keyboard.down("w");
  try {
    await page.waitForFunction(() => window.sanityQa.inspect().state.z <= 4.0);
  } finally {
    await page.keyboard.up("w");
  }
  await page.keyboard.down("a");
  try {
    await page.waitForFunction(() => window.sanityQa.inspect().state.x <= -3.5);
  } finally {
    await page.keyboard.up("a");
  }
  const vestibuleAfter = await page.evaluate(() => window.sanityQa.inspect());
  assert.equal(
    blocked(
      vestibuleAfter.state.x,
      vestibuleAfter.state.z,
      vestibule.obstacles,
    ),
    false,
  );
  evidence.vestibuleRoute = {
    from: [vestibule.start.x, vestibule.start.z],
    to: [vestibuleAfter.state.x, vestibuleAfter.state.z],
    health: vestibuleAfter.state.health,
    performance: vestibuleAfter.performance,
  };
  await page.screenshot({
    path: new URL("vestibulo-save0-desvio.png", output).pathname,
  });
  const library = await page.evaluate(() => {
    window.sanityQa.openRoom(1);
    window.sanityQa.position(-0.81, -3.78149);
    return {
      start: window.sanityQa.inspect().state,
      obstacles: window.sanityQa.obstacles(),
    };
  });
  const seal = library.obstacles.find((obstacle) => obstacle.id === "seal1");
  assert.ok(seal, "seal1 debe conservar su colisionador");
  assert.equal(blocked(-0.81, -3.9, library.obstacles), true);
  await page.keyboard.down("w");
  try {
    const frame = await page.evaluate(
      () => window.sanityQa.inspect().draw.frame,
    );
    await page.waitForFunction(
      (before) => window.sanityQa.inspect().draw.frame >= before + 8,
      frame,
    );
  } finally {
    await page.keyboard.up("w");
  }
  const blockedBySeal = await page.evaluate(
    () => window.sanityQa.inspect().state,
  );
  assert.ok(
    blockedBySeal.z > -3.81,
    `El sello dejó atravesar al jugador: ${blockedBySeal.z}`,
  );
  await page.keyboard.down("a");
  try {
    await page.waitForFunction(() => window.sanityQa.inspect().state.x <= -0.9);
  } finally {
    await page.keyboard.up("a");
  }
  await page.keyboard.down("w");
  try {
    await page.waitForFunction(() => window.sanityQa.inspect().state.z <= -5.3);
  } finally {
    await page.keyboard.up("w");
  }
  await page.keyboard.down("d");
  try {
    await page.waitForFunction(() => window.sanityQa.inspect().state.x >= 0);
  } finally {
    await page.keyboard.up("d");
  }
  await page.keyboard.down("w");
  try {
    await page.waitForFunction(() => window.sanityQa.inspect().state.z <= -6);
  } finally {
    await page.keyboard.up("w");
  }
  await page.waitForFunction(
    () => window.sanityQa.inspect().interaction?.id === "next",
  );
  const libraryAfter = await page.evaluate(() => window.sanityQa.inspect());
  assert.equal(
    blocked(libraryAfter.state.x, libraryAfter.state.z, library.obstacles),
    false,
  );
  evidence.libraryRoute = {
    from: [library.start.x, library.start.z],
    blockedAt: [blockedBySeal.x, blockedBySeal.z],
    to: [libraryAfter.state.x, libraryAfter.state.z],
    selected: libraryAfter.interaction?.id,
    seal,
    performance: libraryAfter.performance,
  };
  await page.screenshot({
    path: new URL("biblioteca-seal1-desvio.png", output).pathname,
  });
  const roman = await page.evaluate(() => {
    window.sanityQa.openRoom(8);
    window.sanityQa.position(-4.27383, 4.93027);
    return {
      start: window.sanityQa.inspect().state,
      obstacles: window.sanityQa.obstacles(),
    };
  });
  const combatTarget = { x: 0, z: 1.4 };
  const romanRoute = planRoute(
    { x: roman.start.x, z: roman.start.z },
    combatTarget,
    roman.obstacles,
    { goalRadius: 0.2 },
  );
  const walked = [];
  for (const waypoint of romanRoute.waypoints) {
    for (const axis of ["x", "z"]) {
      const before = await page.evaluate(() => window.sanityQa.inspect().state);
      const difference = waypoint[axis] - before[axis];
      if (Math.abs(difference) < 1e-6) continue;
      const positive = difference > 0;
      const key = axis === "x" ? (positive ? "d" : "a") : positive ? "s" : "w";
      await page.keyboard.down(key);
      try {
        await page.waitForFunction(
          ({ axis: direction, target, positive: forward }) => {
            const state = window.sanityQa.inspect().state;
            return (
              state.health <= 0 ||
              (forward
                ? state[direction] >= target
                : state[direction] <= target)
            );
          },
          { axis, target: waypoint[axis], positive },
          { timeout: 6000 },
        );
      } finally {
        await page.keyboard.up(key);
      }
      const after = await page.evaluate(() => window.sanityQa.inspect().state);
      assert.ok(after.health > 0, "Lucius murió durante la ruta QA");
      assert.equal(blocked(after.x, after.z, roman.obstacles), false);
      walked.push({ axis, target: waypoint[axis], at: [after.x, after.z] });
    }
  }
  const romanAfter = await page.evaluate(() => window.sanityQa.inspect());
  assert.ok(Math.hypot(romanAfter.state.x, romanAfter.state.z - 1.4) <= 0.35);
  evidence.romanCombatRoute = {
    from: [roman.start.x, roman.start.z],
    to: [romanAfter.state.x, romanAfter.state.z],
    waypoints: romanRoute.waypoints,
    walked,
    health: romanAfter.state.health,
    selected: romanAfter.interaction?.id,
  };
  await page.screenshot({
    path: new URL("lucius-note8-centro-combate.png", output).pathname,
  });
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sanity404-save")),
    null,
  );
  assert.deepEqual(evidence.errors, []);
  evidence.completed = true;
} catch (error) {
  evidence.completed = false;
  evidence.failure = String(error);
  throw error;
} finally {
  const record = `${JSON.stringify(evidence, null, 2)}\n`;
  await writeFile(new URL(`navegador-${runId}.json`, output), record);
  if (evidence.completed)
    await writeFile(new URL("navegador.json", output), record);
  await browser?.close();
}
console.log(
  `PASS QA navegador: ${evidence.rooms.length} salas, ${evidence.collisions.length} choques físicos, 0 errores JS`,
);
