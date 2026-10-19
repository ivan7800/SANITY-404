import { it, expect, vi } from "vitest";
import * as T from "three";
import { fresh, parseSave, blocked } from "../src/systems/state";
import {
  advancePuzzle,
  newPhase2,
  phase2DoorLocked,
  puzzleIds,
  puzzles,
} from "../src/systems/phase2";
import { World, enemySpawn } from "../src/world/scene";
import { Combat } from "../src/systems/combat";
import { createEnemy } from "../src/world/enemies";
import { eligibleSanityEvents, sanityEvents } from "../src/systems/sanity";

it("migra partidas anteriores sin perder el recorrido original y valida progreso nuevo", () => {
  const old = fresh() as unknown as Record<string, unknown>;
  delete old.phase2;
  old.room = 3;
  const loaded = parseSave(JSON.stringify(old));
  expect(loaded?.room).toBe(3);
  expect(loaded?.phase2.visited).toContain(3);
  expect(
    parseSave(JSON.stringify({ ...loaded, phase2: { solved: ["<script>"] } })),
  ).toBeNull();
});

it("los cuatro mecanismos conservan pasos, no se bloquean por errores y abren rutas", () => {
  const progress = newPhase2();
  for (const id of puzzleIds) {
    expect(advancePuzzle(progress, id, (puzzles[id].order[0] + 1) % 3)).toBe(
      "wrong",
    );
    expect(progress.steps[puzzleIds.indexOf(id)]).toBe(0);
    for (const choice of puzzles[id].order) advancePuzzle(progress, id, choice);
    expect(progress.solved).toContain(id);
    expect(advancePuzzle(progress, id, 0)).toBe("already");
  }
  expect(progress.shortcuts).toContain("library-chapel");
  for (const id of [
    "archive-door",
    "greenhouse-door",
    "chapel-side",
    "basement-door",
    "library-shortcut",
  ])
    expect(phase2DoorLocked(id, progress)).toBeNull();
});

it("cada área tiene arquitectura transitable, documento y puerta conectada", () => {
  for (const room of [1, 5, 6, 3, 7]) {
    const world = new World(room, [], [], [], [], 1);
    expect(world.scene.children.length).toBeGreaterThan(10);
    expect(world.objects.some((object) => object.kind === "note")).toBe(true);
    expect(world.objects.some((object) => object.kind === "door")).toBe(true);
    expect(blocked(0, 0, world.obstacles)).toBe(false);
    const [enemyX, enemyZ] = enemySpawn(world.obstacles);
    expect(blocked(enemyX, enemyZ, world.obstacles, 0.45)).toBe(false);
    expect(world.lights.length).toBeLessThanOrEqual(3);
    if (room === 6) expect(world.lights).toHaveLength(1);
    world.dispose();
  }
});

it("acechador investiga ruido, criatura ritual y guardián tienen fases y vulnerabilidad", () => {
  const state = fresh();
  state.room = 5;
  const player = new T.Group();
  player.position.set(6, 0, 0);
  const enemy = createEnemy("stalker");
  const stalker = new Combat(5);
  stalker.update(
    0.1,
    state,
    player,
    enemy,
    [],
    false,
    vi.fn(),
    vi.fn(),
    false,
    false,
    1,
  );
  expect(stalker.aiState).toBe("investigate");
  expect(enemy.position.x).toBeGreaterThan(0);
  expect(new Combat(3).kind).toBe("ritual");
  const guardian = new Combat(7);
  expect(guardian.health).toBe(150);
  guardian.health = 70;
  const boss = createEnemy("guardian");
  boss.position.z = 1;
  state.room = 7;
  guardian.update(1, state, player, boss, [], false, vi.fn(), vi.fn());
  expect(guardian.phase).toBe(2);
});

it("el golpe fuerte explota la vulnerabilidad ritual; esquiva y coraza limitan el daño", () => {
  const player = new T.Group();
  const enemy = createEnemy("ritual");
  enemy.position.z = 1;
  const state = fresh();
  state.room = 3;
  const light = new Combat(3);
  light.update(0.016, state, player, enemy, [], true, vi.fn(), vi.fn());
  expect(light.health).toBe(87);
  const heavy = new Combat(3);
  heavy.update(
    0.016,
    state,
    player,
    enemy,
    [],
    false,
    vi.fn(),
    vi.fn(),
    false,
    true,
  );
  expect(heavy.health).toBe(55);
  expect(heavy.stamina).toBeLessThan(70);
  expect(heavy.startDodge()).toBe(false);
  heavy.update(0.31, state, player, enemy, [], false, vi.fn(), vi.fn());
  expect(heavy.startDodge()).toBe(true);
  expect(heavy.stamina).toBeLessThan(50);

  const guardian = new Combat(7);
  const boss = createEnemy("guardian");
  boss.position.z = 1;
  state.room = 7;
  guardian.update(
    0.016,
    state,
    player,
    boss,
    [],
    false,
    vi.fn(),
    vi.fn(),
    false,
    true,
  );
  expect(guardian.health).toBe(150);
  guardian.attackCooldown = 0;
  guardian.vulnerable = 1;
  guardian.update(
    0.016,
    state,
    player,
    boss,
    [],
    false,
    vi.fn(),
    vi.fn(),
    false,
    true,
  );
  expect(guardian.health).toBe(100);
});

it("doce eventos de cordura tienen condiciones narrativas y zonas, sin alterar puertas", () => {
  expect(sanityEvents.length).toBeGreaterThanOrEqual(10);
  const state = fresh();
  state.room = 6;
  state.sanity = 35;
  expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
    "rain-upwards",
  );
  expect(eligibleSanityEvents(state).map((event) => event.id)).not.toContain(
    "glass-double",
  );
  state.phase2.discoveries.push("adrien");
  expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
    "glass-double",
  );
});
