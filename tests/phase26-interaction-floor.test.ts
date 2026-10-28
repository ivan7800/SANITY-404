import { expect, it } from "vitest";
import { fresh, parseSave } from "../src/systems/state";
import { World } from "../src/world/scene";
import { mansionFloorHeight } from "../src/world/mansion";

it("no permite seleccionar la carta del rellano desde el tramo aún inferior de la escalera", () => {
  const world = new World(0, [], [], []);
  const x = 5.3;
  const z = -4.95;
  const height = mansionFloorHeight(x, z, 0);
  expect(height).toBeGreaterThan(1.4);
  expect(world.nearest(x, z, 1.9, height, 0)?.id).not.toBe("gallery-chart");
  const save = fresh();
  save.x = x;
  save.z = z;
  const restored = parseSave(JSON.stringify(save));
  expect(restored?.floor).toBe(0);
  expect(world.nearest(x, z, 1.9, height, restored?.floor)?.id).not.toBe(
    "gallery-chart",
  );
  expect(world.nearest(5.3, -5.8, 1.9, 2.64, 1)?.id).toBe("gallery-chart");
  world.dispose();
});
