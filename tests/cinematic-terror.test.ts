import { expect, it, vi } from "vitest";
import * as T from "three";
import { isThreatOnCamera } from "../src/systems/mansion-threats";
import { animateEnemyStyle, createEnemy } from "../src/world/enemies";
import { World } from "../src/world/scene";
import { TerrorDirector } from "../src/systems/terror";
import { Combat } from "../src/systems/combat";
import { fresh } from "../src/systems/state";
import { character } from "../src/world/character";
import { CinematicCamera } from "../src/engine/camera";
import type { Audio } from "../src/systems/audio";
import type { Settings } from "../src/systems/config";

it("el Huésped distingue la imagen visible de una pared que lo oculta", () => {
  const camera = new T.PerspectiveCamera(65, 16 / 9, 0.1, 30);
  camera.position.set(0, 3.8, -3);
  camera.lookAt(0, 3.8, -6);
  const guest = createEnemy("guest");
  guest.position.set(0, 2.64, -6);
  expect(isThreatOnCamera(camera, guest, [])).toBe(true);
  expect(
    isThreatOnCamera(camera, guest, [
      { x: 0, z: -4.5, w: 2, d: 0.2, y: 2.64, height: 2.2 },
    ]),
  ).toBe(false);
  camera.lookAt(6, 3.8, -6);
  expect(isThreatOnCamera(camera, guest, [])).toBe(false);
});

it("cada criatura articula una pieza distintiva y la Raíz cambia de silueta por fase", () => {
  const guest = createEnemy("guest");
  animateEnemyStyle(guest, 1, "guest", "frozen", 1, 0, 0.8);
  expect(guest.userData.rig.head.rotation.y).toBeCloseTo(0.8);
  const widow = createEnemy("widow");
  animateEnemyStyle(widow, 1, "widow", "chase", 1);
  expect(widow.getObjectByName("widow-panel-0")?.rotation.z).not.toBe(0);
  const crawler = createEnemy("crawler");
  animateEnemyStyle(crawler, 1, "crawler", "chase", 1);
  expect(crawler.userData.rig.leftArm.rotation.x).not.toBe(
    crawler.userData.rig.rightArm.rotation.x,
  );
  const mirror = createEnemy("wrongReflection");
  animateEnemyStyle(mirror, 1, "wrongReflection", "chase", 1, 0, 0.4, 20);
  expect(
    (
      mirror.getObjectByName("reflection-face") as T.Mesh<
        T.BufferGeometry,
        T.MeshStandardMaterial
      >
    ).material.emissiveIntensity,
  ).toBeGreaterThan(0.5);
  const root = createEnemy("nameRoot");
  animateEnemyStyle(root, 1, "nameRoot", "chase", 1);
  const branch = root.getObjectByName("name-root-branch-0")!;
  const first = branch.scale.x;
  animateEnemyStyle(root, 1, "nameRoot", "chase", 3);
  expect(branch.scale.x).toBeGreaterThan(first);
});

it("el Reptante se retira tras saltar y vuelve a perseguir después de recuperarse", () => {
  const state = fresh();
  state.floor = 1;
  const player = character();
  player.position.set(-5, 2.64, -3);
  const enemy = createEnemy("crawler");
  enemy.position.set(-5, 2.64, -4.2);
  enemy.lookAt(player.position);
  const combat = new Combat(0, "crawler", "mansion-crawler");
  combat.enemyCooldown = 0;
  const noop = () => {};
  combat.update(0.01, state, player, enemy, [], false, noop, noop);
  expect(combat.aiState).toBe("windup");
  combat.update(0.4, state, player, enemy, [], false, noop, noop);
  expect(combat.aiState).toBe("retreat");
  const before = enemy.position.distanceTo(player.position);
  combat.update(0.2, state, player, enemy, [], false, noop, noop);
  expect(enemy.position.distanceTo(player.position)).toBeGreaterThan(before);
  combat.update(0.8, state, player, enemy, [], false, noop, noop);
  expect(combat.aiState).not.toBe("retreat");
});

it("un sonido tras una pared causa sospecha y búsqueda sin visión falsa", () => {
  const state = fresh();
  state.floor = 1;
  const player = character();
  player.position.set(-5, 2.64, -3);
  const enemy = createEnemy("guest");
  enemy.position.set(-5, 2.64, -6);
  const combat = new Combat(0, "guest");
  const wall = [{ x: -5, z: -4.5, w: 2, d: 0.2, y: 2.64, height: 2.2 }];
  const noop = () => {};
  const still = enemy.position.clone();
  combat.update(
    0.1,
    state,
    player,
    enemy,
    wall,
    false,
    noop,
    noop,
    false,
    false,
    1,
  );
  expect(combat.aiState).toBe("suspect");
  expect(enemy.position.distanceTo(still)).toBeLessThan(0.05);
  combat.update(0.5, state, player, enemy, wall, false, noop, noop);
  expect(combat.aiState).toBe("search");
});

it("las puertas superiores y el lamento reaccionan sin bloquear el paso", () => {
  const world = new World(0, [], [], []);
  const door = world.scene.getObjectByName("upper-door-portraits")!;
  const director = new TerrorDirector(world);
  const player = character();
  player.position.set(-5, 2.64, -5.8);
  const enemy = createEnemy("widow");
  enemy.position.set(-5, 2.64, -5.8);
  const combat = new Combat(0, "widow");
  combat.aiState = "chase";
  const audio = {
    directional: vi.fn(),
    silence: vi.fn(),
    lament: vi.fn(),
  } as unknown as Audio;
  const settings = { reduced: false, reduceFlashes: false } as Settings;
  director.update(0.3, player, enemy, combat, audio, settings, 3);
  expect(door.rotation.y).not.toBe(-0.8);
  expect(audio.lament).toHaveBeenCalledOnce();
  expect(
    world.upperObstacles.some(
      (o) => Math.abs(o.x + 5) < 0.1 && Math.abs(o.z + 5) < 0.1,
    ),
  ).toBe(false);
  director.restore();
  expect(door.rotation.y).toBe(-0.8);
  world.dispose();
});

it("la cámara encuadra un encuentro en la planta superior a su altura real", () => {
  const world = new World(0, [], [], []);
  const camera = new T.PerspectiveCamera(58, 16 / 9);
  const director = new CinematicCamera();
  const enemy = new T.Vector3(-1.1, 2.64, -3.8);
  director.update(camera, -1.3, -3, 0, 0, true, world.upperObstacles, {
    height: 2.64,
    enemy,
    enemyKind: "nameRoot",
    combat: true,
  });
  camera.updateMatrixWorld();
  const projected = enemy
    .clone()
    .add(new T.Vector3(0, 1.5, 0))
    .project(camera);
  expect(Math.abs(projected.x)).toBeLessThan(0.9);
  expect(Math.abs(projected.y)).toBeLessThan(0.9);
  expect(director.corrected).toBe(false);
  expect(camera.position.z).toBeLessThan(-6);
  expect(camera.fov).toBe(68);
  world.dispose();
});

it("los golpes espaciales son finitos y la aparición se borra al acercarse", () => {
  const world = new World(0, [], [], []);
  const director = new TerrorDirector(world);
  const player = character();
  player.position.set(2, 2.64, -5.8);
  const enemy = createEnemy("guest");
  enemy.visible = false;
  const combat = new Combat(0, "guest");
  const audio = {
    directional: vi.fn(),
    silence: vi.fn(),
    lament: vi.fn(),
  } as unknown as Audio;
  const settings = { reduced: false, reduceFlashes: true } as Settings;
  director.update(6, player, enemy, combat, audio, settings, 6);
  const shadow = world.scene.getObjectByName("gallery-false-shadow") as T.Mesh<
    T.BufferGeometry,
    T.MeshBasicMaterial
  >;
  expect(shadow.material.opacity).toBeGreaterThan(0);
  player.position.set(-2.6, 2.64, -5.5);
  director.update(0.1, player, enemy, combat, audio, settings, 6.1);
  expect(shadow.material.opacity).toBe(0);
  player.position.set(2, 2.64, -5.8);
  for (let i = 0; i < 8; i++)
    director.update(30, player, enemy, combat, audio, settings, 36 + i * 30);
  expect(shadow.material.opacity).toBe(0);
  expect(
    (audio.directional as ReturnType<typeof vi.fn>).mock.calls.length,
  ).toBeLessThanOrEqual(12);
  const cues = (audio.directional as ReturnType<typeof vi.fn>).mock.calls
    .length;
  const light = world.lights[0].intensity;
  director.update(0.1, player, enemy, combat, audio, settings, 300, 20);
  director.update(0.1, player, enemy, combat, audio, settings, 300.1, 20);
  expect(
    (audio.directional as ReturnType<typeof vi.fn>).mock.calls.length,
  ).toBe(cues + 1);
  expect(world.lights[0].intensity).toBeLessThan(light);
  director.restore();
  world.dispose();
});
