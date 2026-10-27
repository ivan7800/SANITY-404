import { expect, it } from "vitest";
import * as T from "three";
import { Combat } from "../src/systems/combat";
import {
  isObserved,
  mansionThreatAt,
  mansionThreats,
} from "../src/systems/mansion-threats";
import { fresh, parseSave } from "../src/systems/state";
import { character } from "../src/world/character";
import { createEnemy } from "../src/world/enemies";
import { World } from "../src/world/scene";
import { upperWalkable } from "../src/world/mansion-navigation";
import { blocked } from "../src/systems/state";

it("sitúa a la Viuda en suelo libre y fuera de la primera huella superior", () => {
  const world = new World(0, [], [], []);
  const [x, y, z] = mansionThreats.widow.spawn;
  expect(y).toBe(2.64);
  expect(upperWalkable(x, z)).toBe(true);
  expect(blocked(x, z, world.upperObstacles)).toBe(false);
  expect(Math.hypot(x - 5, z - -5.11)).toBeGreaterThan(1.2);
  world.dispose();
});

it("la Viuda persigue sin ocupar el cuerpo de Élise en el rellano", () => {
  const state = fresh();
  state.floor = 1;
  const player = character();
  player.position.set(5, 2.64, -5.11);
  const enemy = createEnemy("widow");
  enemy.position.set(...mansionThreats.widow.spawn);
  const combat = new Combat(0, "widow", "mansion-widow");
  combat.enemyCooldown = 10;
  const noop = () => {};
  for (let frame = 0; frame < 180; frame++) {
    combat.update(1 / 60, state, player, enemy, [], false, noop, noop);
    expect(
      Math.hypot(
        enemy.position.x - player.position.x,
        enemy.position.z - player.position.z,
      ),
    ).toBeGreaterThanOrEqual(1.049);
  }
  expect(enemy.position.distanceTo(player.position)).toBeLessThan(1.8);
});

it("elige enemigos por posición, cordura y pruebas persistentes", () => {
  const state = fresh();
  expect(mansionThreatAt(state)).toBe("shade");
  state.floor = 1;
  state.x = 2;
  state.z = -5.8;
  expect(mansionThreatAt(state)).toBe("guest");
  state.x = 5;
  expect(mansionThreatAt(state)).toBe("widow");
  state.x = -5;
  state.z = -3;
  expect(mansionThreatAt(state)).toBe("crawler");
  state.x = -1.3;
  expect(mansionThreatAt(state)).toBe("guest");
  state.sanity = 40;
  expect(mansionThreatAt(state)).toBe("wrongReflection");
  state.items.push("Folio del rellano", "Carta de la raíz");
  expect(mansionThreatAt(state)).toBe("nameRoot");
  state.defeated.push(
    ...Object.values(mansionThreats).map((entry) => entry.id),
  );
  expect(parseSave(JSON.stringify(state))?.defeated).toHaveLength(5);
});

it("conserva siluetas, anticipaciones y núcleo de varias fases", () => {
  const names = new Set<string>();
  for (const kind of Object.keys(
    mansionThreats,
  ) as (keyof typeof mansionThreats)[]) {
    const actor = createEnemy(kind);
    names.add(actor.name);
    const meshes: T.Mesh[] = [];
    actor.traverse((child) => {
      if (child instanceof T.Mesh) meshes.push(child);
    });
    expect(meshes.length).toBeGreaterThan(8);
  }
  expect(names.size).toBe(5);
  expect(
    createEnemy("nameRoot").getObjectByName("name-root-heart"),
  ).toBeDefined();
});

it("el Huésped se congela bajo la mirada y avanza cuando Élise se gira", () => {
  const state = fresh();
  state.floor = 1;
  const player = character();
  player.position.set(0, 2.64, -4);
  const enemy = createEnemy("guest");
  enemy.position.set(0, 2.64, -5.8);
  enemy.lookAt(player.position);
  const combat = new Combat(0, "guest", "mansion-guest");
  const noop = () => {};
  expect(isObserved(0, -4, Math.PI, 0, -5.8)).toBe(true);
  combat.update(
    1.1,
    state,
    player,
    enemy,
    [],
    false,
    noop,
    noop,
    false,
    false,
    0,
    "torso",
    true,
  );
  expect(enemy.position.z).toBe(-5.8);
  combat.update(
    0.2,
    state,
    player,
    enemy,
    [],
    false,
    noop,
    noop,
    false,
    false,
    0,
    "torso",
    false,
  );
  expect(enemy.position.z).toBeGreaterThan(-5.8);
});

it("la Viuda baja físicamente y la Raíz cambia de fase según su salud", () => {
  const state = fresh();
  const player = character();
  player.position.set(5, 1.2, -3.2);
  const widow = createEnemy("widow");
  widow.position.set(5, 2.64, -5.7);
  widow.lookAt(player.position);
  const noop = () => {};
  const combat = new Combat(0, "widow", "mansion-widow");
  combat.update(1.1, state, player, widow, [], false, noop, noop);
  expect(widow.position.z).toBeGreaterThan(-5.7);
  expect(widow.position.y).toBeLessThan(2.64);
  const root = new Combat(0, "nameRoot", "mansion-root");
  const boss = createEnemy("nameRoot");
  boss.position.set(-1.3, 2.64, -3);
  root.health = 100;
  root.update(0.01, state, player, boss, [], false, noop, noop);
  expect(root.phase).toBe(2);
  root.health = 40;
  root.update(0.01, state, player, boss, [], false, noop, noop);
  expect(root.phase).toBe(3);
});

it("el Reflejo reaparece detrás de Élise con una ventana de reacción", () => {
  const state = fresh();
  state.floor = 1;
  state.sanity = 20;
  const player = character();
  player.position.set(-1.3, 2.64, -3);
  player.rotation.y = 0;
  const enemy = createEnemy("wrongReflection");
  enemy.position.set(-1.3, 2.64, -6);
  enemy.lookAt(player.position);
  const messages: string[] = [];
  const combat = new Combat(0, "wrongReflection", "mansion-reflection");
  combat.update(
    3.6,
    state,
    player,
    enemy,
    [],
    false,
    () => {},
    (text) => messages.push(text),
  );
  expect(enemy.position.z).toBeCloseTo(-5.5);
  expect(combat.enemyCooldown).toBeGreaterThanOrEqual(1.6);
  expect(messages.some((text) => text.includes("reflejo"))).toBe(true);
});

it("el Reflejo mantiene separación corporal durante persecución y aviso", () => {
  const state = fresh();
  state.floor = 1;
  state.sanity = 70;
  const player = character();
  player.position.set(-1.3, 2.64, -3.2);
  const enemy = createEnemy("wrongReflection");
  enemy.position.copy(player.position);
  const combat = new Combat(0, "wrongReflection", "mansion-reflection");
  combat.enemyCooldown = 5;
  const obstacle = [
    { x: 0.05, z: -3.2, w: 0.5, d: 0.5, y: 2.64, height: 2.18 },
  ];
  const noop = () => {};
  combat.update(0.016, state, player, enemy, obstacle, false, noop, noop);
  expect(
    Math.hypot(
      enemy.position.x - player.position.x,
      enemy.position.z - player.position.z,
    ),
  ).toBeGreaterThanOrEqual(1.349);
  expect(state.sanity).toBeCloseTo(70 - 0.016 * 0.6);
  expect(state.health).toBe(100);
  enemy.position.copy(player.position);
  combat.windup = 0.4;
  combat.update(0.016, state, player, enemy, obstacle, false, noop, noop);
  expect(
    Math.hypot(
      enemy.position.x - player.position.x,
      enemy.position.z - player.position.z,
    ),
  ).toBeGreaterThanOrEqual(1.349);
  expect(combat.windup).toBeGreaterThan(0);
});

it("el Reflejo conserva distancia en las zonas transitables del observatorio", () => {
  const world = new World(0, [], [], []);
  const state = fresh();
  state.floor = 1;
  state.sanity = 20;
  const player = character();
  const enemy = createEnemy("wrongReflection");
  const combat = new Combat(0, "wrongReflection", "mansion-reflection");
  const noop = () => {};
  let checked = 0;
  for (let x = -3.1; x <= 0.3; x += 0.4)
    for (let z = -4.4; z <= -1.6; z += 0.4) {
      if (!upperWalkable(x, z) || blocked(x, z, world.upperObstacles)) continue;
      player.position.set(x, 2.64, z);
      enemy.position.copy(player.position);
      combat.enemyCooldown = 99;
      combat.windup = 0;
      combat.update(
        0.016,
        state,
        player,
        enemy,
        world.upperObstacles,
        false,
        noop,
        noop,
      );
      expect(
        Math.hypot(enemy.position.x - x, enemy.position.z - z),
        `posición ${x.toFixed(1)},${z.toFixed(1)}`,
      ).toBeGreaterThanOrEqual(1.349);
      checked++;
    }
  expect(checked).toBeGreaterThan(30);
  world.dispose();
});

it("el Reptante acelera al perder la mirada del jugador", () => {
  const advance = (observed: boolean) => {
    const state = fresh();
    state.floor = 1;
    const player = character();
    player.position.set(-5, 2.64, -4.2);
    const enemy = createEnemy("crawler");
    enemy.position.set(-5, 2.64, -2.2);
    enemy.lookAt(player.position);
    new Combat(0, "crawler", "mansion-crawler").update(
      0.1,
      state,
      player,
      enemy,
      [],
      false,
      () => {},
      () => {},
      false,
      false,
      0,
      "torso",
      observed,
    );
    return Math.abs(enemy.position.z + 2.2);
  };
  expect(advance(false)).toBeGreaterThan(advance(true));
});

it("la Raíz solo expone el corazón después de su barrida anunciada", () => {
  const state = fresh();
  const player = character();
  const enemy = createEnemy("nameRoot");
  enemy.position.z = 1.4;
  enemy.lookAt(player.position);
  const combat = new Combat(0, "nameRoot", "mansion-root");
  const messages: string[] = [];
  const notify = (text: string) => messages.push(text);
  const noop = () => {};
  combat.update(0.01, state, player, enemy, [], true, noop, notify);
  expect(combat.health).toBe(165);
  expect(messages.some((text) => text.includes("corteza"))).toBe(true);
  combat.enemyCooldown = 0;
  combat.update(0.01, state, player, enemy, [], false, noop, notify);
  expect(combat.windup).toBeGreaterThan(0);
  combat.update(1.01, state, player, enemy, [], false, noop, notify);
  expect(combat.vulnerable).toBeGreaterThan(0);
  enemy.position.z = 1.4;
  combat.update(0.01, state, player, enemy, [], true, noop, notify);
  expect(combat.health).toBeLessThan(165);
});
