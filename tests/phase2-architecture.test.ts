import { expect, it } from "vitest";
import * as T from "three";
import { World } from "../src/world/scene";
import { blocked } from "../src/systems/collision";

it("la cripta y las ruinas tienen cubiertas distintas sin ocupar sus rutas", () => {
  const crypt = new World(2, [], [], []);
  const ruins = new World(4, [], [], []);
  const vault = crypt.scene.getObjectByName("crypt-vault") as T.Mesh;
  const fragments = ruins.scene.children.filter(
    (object) => object.name === "ruin-oculus",
  );
  expect(vault).toBeInstanceOf(T.Mesh);
  expect(fragments).toHaveLength(4);
  const roofBounds = new T.Box3().setFromObject(vault);
  expect(roofBounds.min.y).toBeGreaterThan(4.4);
  for (const world of [crypt, ruins]) {
    expect(blocked(0, 5.2, world.obstacles)).toBe(false);
    expect(blocked(0, 0, world.obstacles)).toBe(false);
    world.dispose();
  }
});
