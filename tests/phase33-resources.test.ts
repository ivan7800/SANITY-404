import { expect, it } from "vitest";
import * as T from "three";
import { textureBudget } from "../src/render/materials";
import { World } from "../src/world/scene";

it("libera una sola vez geometrías y materiales al reconstruir escenas", () => {
  for (const room of [0, 1, 8]) {
    const world = new World(room, [], [], [], [], 1);
    const geometries = new Set<T.BufferGeometry>();
    const materials = new Set<T.Material>();
    world.scene.traverse((object) => {
      if (!(object instanceof T.Mesh || object instanceof T.Points)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(material);
    });
    let releasedGeometry = 0;
    let releasedMaterials = 0;
    for (const geometry of geometries)
      geometry.addEventListener("dispose", () => releasedGeometry++);
    for (const material of materials)
      material.addEventListener("dispose", () => releasedMaterials++);
    world.dispose();
    expect(releasedGeometry).toBe(geometries.size);
    expect(releasedMaterials).toBe(materials.size);
  }
  // The six original surface families stay cached across rooms by design.
  expect(textureBudget().surfaces).toBeLessThanOrEqual(6);
  expect(textureBudget().bytes).toBeLessThan(2 * 1024 * 1024);
});
