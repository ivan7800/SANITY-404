import { expect, it, vi } from "vitest";
import * as T from "three";
import { Combat, canSeeTarget, inAttackArc } from "../src/systems/combat";
import { TerrorDirector } from "../src/systems/terror";
import { blocked, fresh } from "../src/systems/state";
import { character } from "../src/world/character";
import { World, enemySpawn } from "../src/world/scene";
import type { Audio } from "../src/systems/audio";
import type { Settings } from "../src/systems/config";

const noop = () => {};
it("las tres épocas conservan enemigos en puntos transitables", () => {
  for (const room of [0, 8, 9, 10]) {
    const world = new World(room, [], [], []);
    const spawn = enemySpawn(world.obstacles);
    expect(spawn.every(Number.isFinite)).toBe(true);
    expect(blocked(spawn[0], spawn[1], world.obstacles)).toBe(false);
    expect(blocked(spawn[0], -2, world.obstacles)).toBe(false);
    world.dispose();
  }
});
it("campo visual y obstáculos limitan la detección; un ruido provoca investigación", () => {
  const p = character(),
    e = character(true),
    c = new Combat(8),
    s = fresh();
  s.room = 8;
  e.position.z = 4;
  expect(canSeeTarget(e, p, [], 8)).toBe(false);
  c.update(0.1, s, p, e, [], false, noop, noop);
  expect(c.aiState).toBe("patrol");
  c.update(0.1, s, p, e, [], false, noop, noop, false, false, 1);
  expect(c.aiState).toBe("investigate");
  e.lookAt(p.position);
  expect(canSeeTarget(e, p, [], 8)).toBe(true);
  expect(inAttackArc(e, p)).toBe(true);
  e.rotation.set(0, 0, 0);
  expect(inAttackArc(e, p)).toBe(false);
  expect(canSeeTarget(e, p, [{ x: 0, z: 2, w: 1, d: 0.5, height: 2 }], 8)).toBe(
    false,
  );
  e.lookAt(p.position);
  c.update(0.1, s, p, e, [], false, noop, noop);
  expect(c.aiState).toBe("chase");
});

it("al perder el objetivo busca la última posición y vuelve a patrullar", () => {
  const p = character(),
    e = character(true),
    c = new Combat(9),
    s = fresh();
  s.room = 9;
  e.position.z = 3;
  e.lookAt(p.position);
  c.update(0.1, s, p, e, [], false, noop, noop);
  expect(c.aiState).toBe("chase");
  p.position.set(7, 0, 7);
  c.update(3.1, s, p, e, [], false, noop, noop);
  expect(c.aiState).toBe("investigate");
  e.position.set(0, 0, 0);
  c.update(3.1, s, p, e, [], false, noop, noop);
  expect(c.aiState).toBe("patrol");
});

it("un impacto interrumpe la anticipación y el ataque posterior conserva recuperación", () => {
  const p = character(),
    e = character(true),
    c = new Combat(0),
    s = fresh();
  e.position.z = 1;
  c.update(1.1, s, p, e, [], false, noop, noop);
  expect(c.windup).toBeGreaterThan(0);
  const raisedBefore = e.userData.rig.rightArm.rotation.x;
  c.update(0.2, s, p, e, [], false, noop, noop);
  expect(e.userData.rig.rightArm.rotation.x).toBeLessThan(raisedBefore);
  c.update(0.01, s, p, e, [], true, noop, noop);
  expect(c.windup).toBe(0);
  const hp = s.health;
  c.update(0.5, s, p, e, [], false, noop, noop);
  expect(s.health).toBe(hp);
});

it("los eventos de sala son únicos y respetan reducción de luz, movimiento y audio", () => {
  const light = new T.PointLight(0xffffff, 3);
  const door = new T.Group();
  const world = {
    room: 8,
    lights: [light],
    objects: [{ kind: "door", mesh: door }],
  } as unknown as World;
  const director = new TerrorDirector(world);
  const sound = { directional: vi.fn(), silence: vi.fn() } as unknown as Audio;
  const settings = {
    reduced: true,
    reduceFlashes: true,
    reduceAudio: true,
  } as Settings;
  const p = new T.Group(),
    e = new T.Group(),
    c = new Combat(8);
  e.position.z = 7;
  director.update(3, p, e, c, sound, settings, 3);
  c.aiState = "chase";
  director.update(0.1, p, e, c, sound, settings, 3.1);
  director.update(0.1, p, e, c, sound, settings, 3.2);
  expect(
    (sound.directional as ReturnType<typeof vi.fn>).mock.calls,
  ).toHaveLength(2);
  expect((sound.silence as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(
    1,
  );
  expect(light.intensity).toBe(3);
  expect(door.rotation.y).toBe(0);
  director.restore();
});
