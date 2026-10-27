import { describe, expect, it } from "vitest";
import {
  blocked,
  clearInteractionLine,
  move,
  safeSpawn,
} from "../src/systems/collision";
import { World, names } from "../src/world/scene";
import { mansionMove } from "../src/world/mansion-navigation";
import { simulationDeltaSeconds } from "../src/engine/time";

describe("colisiones del motor real", () => {
  it("impide cruzar muebles y hojas de puerta incluso con pasos rápidos o diagonales", () => {
    for (const room of [0, 5, 8, 10, 12, 20, 28]) {
      const world = new World(room, [], [], []);
      for (const object of world.objects.filter((entry) => entry.collider)) {
        const collider = object.collider!;
        const start = safeSpawn(
          { x: collider.x - collider.w / 2 - 0.8, z: collider.z },
          world.obstacles,
        );
        if (!start) continue;
        const next = move(start.x, start.z, 2.4, 0, world.obstacles);
        expect(
          blocked(next.x, next.z, world.obstacles),
          `${room}: ${object.id}`,
        ).toBe(false);
        const diagonal = move(start.x, start.z, 2.4, 0.9, world.obstacles);
        expect(
          blocked(diagonal.x, diagonal.z, world.obstacles),
          `${room}: ${object.id}`,
        ).toBe(false);
      }
      world.dispose();
    }
  });

  it("bloquea la interacción a través de una pared alta y permite alcanzar el objeto propio", () => {
    const wall = { x: 0, z: 0, w: 0.2, d: 4, height: 3 };
    const target = { id: "door", x: 1, z: 0 };
    expect(clearInteractionLine({ x: -1, z: 0 }, target, [wall])).toBe(false);
    expect(clearInteractionLine({ x: 0.8, z: 0 }, target, [wall])).toBe(true);
    const leaf = { ...target, w: 0.2, d: 1.8, height: 2.8 };
    expect(clearInteractionLine({ x: 0.8, z: 0 }, target, [leaf])).toBe(true);
    const upperWall = { ...wall, y: 2.64 };
    expect(
      clearInteractionLine({ x: -1, z: 0 }, target, [upperWall], 3.69),
    ).toBe(false);
  });

  it("el movimiento real recorre el primer desvío del escritorio del vestíbulo", () => {
    const world = new World(0, [], [], []);
    let actor = { x: -1.1475, z: 5, level: 0 as 0 | 1 };
    for (let step = 0; step < 30; step++)
      actor = mansionMove(
        actor.x,
        actor.z,
        0,
        -0.03,
        actor.level,
        world.obstacles,
        world.upperObstacles,
      );
    expect(actor.z).toBeCloseTo(4.1, 2);
    expect(actor.level).toBe(0);
    world.dispose();
  });

  it("avanza con deltaTime a 3,53 FPS sin atravesar save0", () => {
    const world = new World(0, [], [], []);
    let actor = { x: -1.1475, z: 4.46, level: 0 as 0 | 1 };
    const frameSeconds = simulationDeltaSeconds(1000 / 3.53);
    actor = mansionMove(
      actor.x,
      actor.z,
      0,
      -2.7 * frameSeconds,
      actor.level,
      world.obstacles,
      world.upperObstacles,
    );
    expect(actor.z).toBeLessThan(4.2);
    expect(blocked(actor.x, actor.z, world.obstacles)).toBe(false);
    actor = mansionMove(
      actor.x,
      actor.z,
      -2.7 * frameSeconds,
      0,
      actor.level,
      world.obstacles,
      world.upperObstacles,
    );
    expect(actor.x).toBeLessThan(-1.5);
    expect(blocked(actor.x, actor.z, world.obstacles)).toBe(false);
    world.dispose();
  });

  it("permite guardar desde el perímetro de save0 sin exigir atravesar el escritorio", () => {
    const world = new World(0, [], [], []);
    let actor = { x: 0, z: 5, level: 0 as 0 | 1 };
    for (let step = 0; step < 120; step++) {
      actor = mansionMove(
        actor.x,
        actor.z,
        -0.03,
        0,
        actor.level,
        world.obstacles,
        world.upperObstacles,
      );
    }
    expect(actor.x).toBeLessThan(-0.1);
    expect(actor.x).toBeGreaterThan(-1.85);
    expect(blocked(actor.x, actor.z, world.obstacles)).toBe(false);
    expect(world.nearest(actor.x, actor.z, 1.9)?.id).toBe("save0");
    world.dispose();
  });

  it("mantiene un punto de aparición libre en las 29 salas", () => {
    expect(names).toHaveLength(29);
    for (let room = 0; room < names.length; room++) {
      const world = new World(room, [], [], []);
      const arrival = safeSpawn({ x: 0, z: 5.2 }, world.obstacles);
      expect(arrival, names[room]).toBeDefined();
      expect(
        blocked(arrival!.x, arrival!.z, world.obstacles),
        names[room],
      ).toBe(false);
      world.dispose();
    }
  });

  it("ninguna hoja de puerta ni objeto interactivo sólido de las 29 salas se atraviesa de lado a lado", () => {
    expect(names).toHaveLength(29);
    for (let room = 0; room < names.length; room++) {
      const world = new World(room, [], [], []);
      for (const object of world.objects.filter((entry) => entry.collider)) {
        const solid = object.collider!;
        const obstacles =
          object.level === 1 || object.kind === "galleryClue"
            ? world.upperObstacles
            : world.obstacles;
        const clearance = 0.45;
        let exercised = 0;
        for (const [x, z, dx, dz, limit, compare] of [
          [
            solid.x - solid.w / 2 - clearance,
            solid.z,
            4,
            0,
            solid.x - solid.w / 2,
            "maxX",
          ],
          [
            solid.x + solid.w / 2 + clearance,
            solid.z,
            -4,
            0,
            solid.x + solid.w / 2,
            "minX",
          ],
          [
            solid.x,
            solid.z - solid.d / 2 - clearance,
            0,
            4,
            solid.z - solid.d / 2,
            "maxZ",
          ],
          [
            solid.x,
            solid.z + solid.d / 2 + clearance,
            0,
            -4,
            solid.z + solid.d / 2,
            "minZ",
          ],
        ] as const) {
          if (blocked(x, z, obstacles)) continue;
          const result = move(x, z, dx, dz, obstacles);
          exercised++;
          expect(
            blocked(result.x, result.z, obstacles),
            `${room}:${object.id}`,
          ).toBe(false);
          const coordinate = compare.endsWith("X") ? result.x : result.z;
          if (compare.startsWith("max"))
            expect(coordinate, `${room}:${object.id}:${compare}`).toBeLessThan(
              limit,
            );
          else
            expect(
              coordinate,
              `${room}:${object.id}:${compare}`,
            ).toBeGreaterThan(limit);
        }
        expect(exercised, `${room}:${object.id}`).toBeGreaterThan(0);
      }
      world.dispose();
    }
  });
});
