import { expect, it } from "vitest";
import { fresh, parseSave } from "../src/systems/state";
import { mansionFloorHeight } from "../src/world/mansion";
import { mansionMove, upperWalkable } from "../src/world/mansion-navigation";
import { World } from "../src/world/scene";
import * as T from "three";
import { CinematicCamera } from "../src/engine/camera";

it("sube, visita ambas salas superiores y baja por la misma escalera", () => {
  const world = new World(0, [], [], []);
  let actor = { x: 5, z: -1.5, level: 0 as 0 | 1 };
  const walk = (targetX: number, targetZ: number) => {
    for (
      let i = 0;
      i < 300 && Math.hypot(actor.x - targetX, actor.z - targetZ) > 0.13;
      i++
    ) {
      const dx =
        Math.abs(targetX - actor.x) < 0.08
          ? 0
          : Math.sign(targetX - actor.x) * 0.08;
      const dz =
        Math.abs(targetZ - actor.z) < 0.08
          ? 0
          : Math.sign(targetZ - actor.z) * 0.08;
      const next = mansionMove(
        actor.x,
        actor.z,
        dx,
        dz,
        actor.level,
        world.obstacles,
        world.upperObstacles,
      );
      actor = next;
    }
    expect(Math.hypot(actor.x - targetX, actor.z - targetZ)).toBeLessThan(0.14);
  };
  walk(5, -5.8);
  expect(actor.level).toBe(1);
  expect(mansionFloorHeight(actor.x, actor.z, actor.level)).toBe(2.64);
  walk(-5, -5.8);
  walk(-5, -3);
  expect(upperWalkable(actor.x, actor.z)).toBe(true);
  expect(world.nearest(actor.x, actor.z, 1.9, 2.64)?.id).toBe(
    "upper-portraits",
  );
  walk(-5, -5.8);
  walk(-1.3, -5.8);
  walk(-1.3, -3);
  expect(world.nearest(actor.x, actor.z, 1.9, 2.64)?.id).toBe(
    "upper-observatory",
  );
  walk(-1.3, -5.8);
  walk(5, -5.8);
  walk(5, -1.5);
  expect(actor.level).toBe(0);
  expect(mansionFloorHeight(actor.x, actor.z, actor.level)).toBeLessThan(0.08);
  world.dispose();
});

it("eleva a Élise de forma continua sobre los peldaños", () => {
  const heights = Array.from({ length: 37 }, (_, index) =>
    mansionFloorHeight(5, -1.55 - index * 0.1),
  );
  expect(heights[0]).toBe(0);
  expect(heights.at(-1)).toBeCloseTo(2.64);
  for (let i = 1; i < heights.length; i++) {
    expect(heights[i]).toBeGreaterThanOrEqual(heights[i - 1]);
    expect(heights[i] - heights[i - 1]).toBeLessThan(0.09);
  }
});

it("aísla las interacciones por altura y migra guardados anteriores", () => {
  const world = new World(0, [], [], []);
  expect(world.nearest(-5, -3, 1.9, 0)?.id).not.toBe("upper-portraits");
  expect(world.nearest(-5, -3, 1.9, 2.64)?.id).toBe("upper-portraits");
  expect(world.nearest(2, -5.8, 1.9, 2.64)?.id).toBe("upper-save");
  expect(world.nearest(2, -5.8, 1.9, 0)?.id).not.toBe("upper-save");
  const old = fresh();
  old.x = 5;
  old.z = -5.8;
  delete (old as Partial<typeof old>).floor;
  expect(parseSave(JSON.stringify(old))?.floor).toBe(1);
  old.x = -5;
  old.z = -3;
  expect(parseSave(JSON.stringify(old))?.floor).toBe(0);
  const upper = fresh();
  upper.x = -5;
  upper.z = -3;
  upper.floor = 1;
  expect(parseSave(JSON.stringify(upper))?.floor).toBe(1);
  upper.z = 5;
  expect(parseSave(JSON.stringify(upper))).toBeNull();
  world.dispose();
});

it("encuadra las pistas de ambas salas superiores con colisiones de su altura", () => {
  const world = new World(0, [], [], []);
  for (const [x, z] of [
    [-5, -3],
    [-1.3, -3],
  ]) {
    const camera = new T.PerspectiveCamera(58, 16 / 9);
    const focus = new T.Vector3(x, 3.85, z);
    const director = new CinematicCamera();
    director.update(camera, x, z, 0, 0, false, world.upperObstacles, {
      height: 2.64,
      focus,
    });
    camera.updateMatrixWorld();
    const p = focus.project(camera);
    expect(Math.abs(p.x)).toBeLessThan(0.85);
    expect(Math.abs(p.y)).toBeLessThan(0.85);
    expect(director.zone.includes("superior")).toBe(true);
    expect(director.corrected).toBe(false);
  }
  world.dispose();
});
