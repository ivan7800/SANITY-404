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
  expect(enemy.position.z).toBeCloseTo(-4.7);
  expect(combat.enemyCooldown).toBeGreaterThan(0);
  expect(messages.some((text) => text.includes("reflejo"))).toBe(true);
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
