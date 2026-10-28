import { expect, it } from "vitest";
import * as T from "three";
import { Combat } from "../src/systems/combat";
import { CinematicCamera } from "../src/engine/camera";
import { blocked } from "../src/systems/collision";
import { fresh } from "../src/systems/state";
import { World } from "../src/world/scene";
import { createEnemy } from "../src/world/enemies";
import { MANSION_GALLERY_Y } from "../src/world/mansion-topology";
import { mansionFloorHeight } from "../src/world/mansion";
import { upperWalkable } from "../src/world/mansion-navigation";

it("la Viuda rodea el atril y alcanza la galería sin cruzar sus sólidos", () => {
  const world = new World(0, ["Folio del rellano"], [], []);
  const state = fresh();
  state.floor = 1;
  const player = new T.Group();
  player.position.set(2.4, MANSION_GALLERY_Y, -5.8);
  const widow = createEnemy("widow");
  widow.position.set(5.9, MANSION_GALLERY_Y, -6.2);
  widow.lookAt(player.position);
  const combat = new Combat(0, "widow", "mansion-widow");
  const positions: [number, number][] = [];
  let routedFrames = 0;
  for (let frame = 0; frame < 240; frame++) {
    state.elapsed += 1 / 30;
    combat.update(
      1 / 30,
      state,
      player,
      widow,
      world.upperObstacles,
      false,
      () => {},
      () => {},
      false,
      false,
      0,
      "torso",
      false,
      { ground: world.obstacles, upper: world.upperObstacles },
    );
    positions.push([widow.position.x, widow.position.z]);
    if (combat.routeDiagnostic.waypoint) routedFrames++;
    expect(
      blocked(widow.position.x, widow.position.z, world.upperObstacles),
    ).toBe(false);
    expect(upperWalkable(widow.position.x, widow.position.z)).toBe(true);
    expect(widow.position.y).toBeCloseTo(MANSION_GALLERY_Y, 3);
  }
  expect(
    Math.min(...positions.map(([x]) => x)),
    JSON.stringify({ position: widow.position.toArray(), ai: combat.aiState }),
  ).toBeLessThan(4);
  expect(routedFrames).toBeGreaterThan(0);
  expect(
    Math.hypot(widow.position.x - 2.4, widow.position.z + 5.8),
  ).toBeLessThan(1.6);
  world.dispose();
});

it("la Viuda baja por la escalera sin cruzar la barandilla ni caer de la galería", () => {
  const world = new World(0, ["Folio del rellano"], [], []);
  const state = fresh();
  const player = new T.Group();
  player.position.set(5.3, mansionFloorHeight(5.3, -3), -3);
  const widow = createEnemy("widow");
  widow.position.set(5.3, MANSION_GALLERY_Y, -5.8);
  widow.lookAt(player.position);
  const combat = new Combat(0, "widow", "mansion-widow");
  for (let frame = 0; frame < 180; frame++) {
    state.elapsed += 1 / 30;
    combat.update(
      1 / 30,
      state,
      player,
      widow,
      world.obstacles,
      false,
      () => {},
      () => {},
      false,
      false,
      0,
      "torso",
      false,
      { ground: world.obstacles, upper: world.upperObstacles },
    );
    const level = widow.position.y >= MANSION_GALLERY_Y - 0.01 ? 1 : 0;
    expect(
      blocked(
        widow.position.x,
        widow.position.z,
        level ? world.upperObstacles : world.obstacles,
      ),
    ).toBe(false);
    expect(widow.position.x).toBeGreaterThan(3.72);
    expect(widow.position.x).toBeLessThan(6.28);
  }
  expect(widow.position.z).toBeGreaterThan(-5.11);
  expect(widow.position.y).toBeGreaterThan(0);
  expect(widow.position.y).toBeLessThan(MANSION_GALLERY_Y);
  world.dispose();
});

it("la Viuda mantiene el combate en su zona real sin atravesar el atril", () => {
  const world = new World(0, [], [], []);
  const state = fresh();
  state.floor = 1;
  const player = new T.Group();
  player.position.set(3.8, MANSION_GALLERY_Y, -5.2);
  const widow = createEnemy("widow");
  widow.position.set(5.9, MANSION_GALLERY_Y, -6.2);
  widow.lookAt(player.position);
  const combat = new Combat(0, "widow", "mansion-widow");
  for (let frame = 0; frame < 180; frame++) {
    state.elapsed += 1 / 30;
    combat.update(
      1 / 30,
      state,
      player,
      widow,
      world.upperObstacles,
      false,
      () => {},
      () => {},
      false,
      false,
      0,
      "torso",
      false,
      { ground: world.obstacles, upper: world.upperObstacles },
    );
    expect(
      blocked(widow.position.x, widow.position.z, world.upperObstacles),
    ).toBe(false);
    expect(widow.position.y).toBeCloseTo(MANSION_GALLERY_Y, 3);
  }
  expect(widow.position.x).toBeLessThan(5.2);
  expect(
    Math.hypot(widow.position.x - 3.8, widow.position.z + 5.2),
  ).toBeLessThan(1.75);
  expect(state.health).toBeLessThan(100);
  world.dispose();
});

it("el retroceso de un golpe no arroja a la Viuda al suelo bajo la galería", () => {
  const world = new World(0, ["Folio del rellano"], [], []);
  const state = fresh();
  state.floor = 1;
  const player = new T.Group();
  player.position.set(4.8, MANSION_GALLERY_Y, -5.42);
  player.rotation.y = -Math.PI / 2;
  const widow = createEnemy("widow");
  widow.position.set(3.8, MANSION_GALLERY_Y, -5.42);
  const combat = new Combat(0, "widow", "mansion-widow");
  combat.update(
    0.01,
    state,
    player,
    widow,
    world.upperObstacles,
    true,
    () => {},
    () => {},
    false,
    false,
    0,
    "torso",
    false,
    { ground: world.obstacles, upper: world.upperObstacles },
  );
  expect(combat.health).toBeLessThan(100);
  expect(widow.position.x).toBeLessThan(3.72);
  expect(widow.position.y).toBeCloseTo(MANSION_GALLERY_Y, 3);
  expect(upperWalkable(widow.position.x, widow.position.z)).toBe(true);
  expect(
    blocked(widow.position.x, widow.position.z, world.upperObstacles),
  ).toBe(false);
  world.dispose();
});

it("la cámara de combate mantiene a Élise y la Viuda dentro del encuadre del rellano", () => {
  const world = new World(0, [], [], []);
  const camera = new T.PerspectiveCamera(58, 16 / 9);
  const director = new CinematicCamera();
  const player = new T.Vector3(3.8, MANSION_GALLERY_Y, -5.2);
  const enemy = new T.Vector3(5.05, MANSION_GALLERY_Y, -5.43);
  director.update(
    camera,
    player.x,
    player.z,
    0,
    0,
    false,
    world.upperObstacles,
    { height: player.y, enemy, combat: true, enemyKind: "widow" },
  );
  camera.updateMatrixWorld();
  const actorScreen = player
    .clone()
    .add(new T.Vector3(0, 1.3, 0))
    .project(camera);
  const enemyScreen = enemy
    .clone()
    .add(new T.Vector3(0, 1.3, 0))
    .project(camera);
  for (const screen of [actorScreen, enemyScreen]) {
    expect(Math.abs(screen.x)).toBeLessThan(0.95);
    expect(Math.abs(screen.y)).toBeLessThan(0.95);
    expect(screen.z).toBeLessThan(1);
  }
  world.dispose();
});
