import { expect, it } from "vitest";
import { ACTOR_RADIUS } from "../src/systems/collision";
import { newCampaign } from "../src/systems/campaign";
import { mansionMove } from "../src/world/mansion-navigation";
import { World } from "../src/world/scene";
import type { Obstacle } from "../src/systems/state";

const distanceToBox = (point: { x: number; z: number }, box: Obstacle) =>
  Math.hypot(
    Math.max(0, Math.abs(point.x - box.x) - box.w / 2),
    Math.max(0, Math.abs(point.z - box.z) - box.d / 2),
  );

it("deja pasar al actor desde el salón hasta los dos desembarcos de la escalera", () => {
  const world = new World(0, [], [], []);
  try {
    const seat = world.obstacles.find((entry) => entry.id === "hall-armchair")!;
    expect(distanceToBox({ x: 5, z: -1.55 }, seat)).toBeGreaterThan(
      ACTOR_RADIUS * 2 + 0.45,
    );
    let actor = { x: 3, z: -0.5, level: 0 as 0 | 1 };
    for (let i = 0; i < 29; i++) {
      actor = mansionMove(
        actor.x,
        actor.z,
        0.08,
        0,
        actor.level,
        world.obstacles,
        world.upperObstacles,
      );
      expect(distanceToBox(actor, seat)).toBeGreaterThan(ACTOR_RADIUS);
    }
    expect(actor.x).toBeCloseTo(5.32);
    for (let i = 0; i < 67; i++) {
      actor = mansionMove(
        actor.x,
        actor.z,
        0,
        -0.08,
        actor.level,
        world.obstacles,
        world.upperObstacles,
      );
      expect(distanceToBox(actor, seat)).toBeGreaterThan(ACTOR_RADIUS);
    }
    expect(actor.z).toBeLessThan(-5.7);
    expect(actor.level).toBe(1);
  } finally {
    world.dispose();
  }
});

it("separa estanterías y pilares de los accesos de biblioteca, capilla, archivo y sótano", () => {
  for (const [room, doorIds, w, d] of [
    [1, ["archive-door", "library-shortcut"], 1, 3.4],
    [3, ["chapel-side", "basement-door", "chapel-shortcut"], 0.34, 0.32],
    [5, ["archive-back", "greenhouse-door"], 1.25, 1.1],
    [7, ["basement-back"], 0.9, 1],
  ] as const) {
    const world = new World(room, ["Memoria reconciliada"], [], []);
    try {
      const furniture = world.obstacles.filter(
        (entry) => Math.abs(entry.w - w) < 0.01 && Math.abs(entry.d - d) < 0.01,
      );
      expect(furniture.length).toBeGreaterThan(0);
      for (const id of doorIds) {
        const door = world.objects.find((entry) => entry.id === id)!;
        expect(door).toBeDefined();
        expect(
          Math.min(...furniture.map((entry) => distanceToBox(door, entry))),
          `${room}:${id}`,
        ).toBeGreaterThan(1.2);
      }
    } finally {
      world.dispose();
    }
  }
});

it("separa los dos portales de 1899 y 1348 sin ocultar el acceso de 1899", () => {
  const campaign = newCampaign();
  campaign.completed = [
    "roman-189",
    "mosaic-312",
    "coast-537",
    "stars-783",
    "quarry-1092",
    "hospital-1217",
    "abbey-1348",
    "press-1491",
    "veyr-1610",
    "theatre-1786",
  ];
  const unlocked = new World(0, [], [], [], [], 1.3, undefined, campaign);
  try {
    const photo = unlocked.objects.find(
      (entry) => entry.id === "photo-1899-portal",
    )!;
    const medieval = unlocked.objects.find(
      (entry) => entry.id === "medieval-portal",
    )!;
    expect(photo).toBeDefined();
    expect(medieval).toBeDefined();
    expect(distanceToBox(photo, medieval.collider!)).toBeGreaterThan(1.2);
    expect(unlocked.nearest(-3.2, -5.1, 1.9)?.id).toBe(photo.id);
  } finally {
    unlocked.dispose();
  }
});
