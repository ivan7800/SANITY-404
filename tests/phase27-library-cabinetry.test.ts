import { expect, it } from "vitest";
import * as T from "three";
import { blocked } from "../src/systems/collision";
import { libraryCabinetFootprints } from "../src/world/library-cabinetry";
import { World } from "../src/world/scene";

it("sustituye los bloques de biblioteca por armarios visibles sin cambiar huellas ni accesos", () => {
  const world = new World(1, [], [], []);
  try {
    const cabinets = world.obstacles.filter((entry) =>
      entry.id?.startsWith("library-cabinet-"),
    );
    expect(cabinets).toEqual(libraryCabinetFootprints);
    const group = world.scene.getObjectByName(
      "Biblioteca Veyr · cuatro armarios de archivo",
    ) as T.Group;
    expect(group).toBeDefined();
    const books: T.InstancedMesh[] = [];
    group.traverse((object) => {
      if (object instanceof T.InstancedMesh) books.push(object);
    });
    expect(books).toHaveLength(4);
    expect(
      books.reduce((count, mesh) => count + mesh.count, 0),
    ).toBeGreaterThan(300);
    for (const mesh of books) {
      const matrix = new T.Matrix4();
      const position = new T.Vector3();
      for (let index = 0; index < mesh.count; index++) {
        mesh.getMatrixAt(index, matrix);
        position.setFromMatrixPosition(matrix);
        expect(
          cabinets.some(
            (cabinet) =>
              Math.abs(position.x - cabinet.x) < cabinet.w / 2 &&
              Math.abs(position.z - cabinet.z) < cabinet.d / 2 &&
              position.y > 0 &&
              position.y < cabinet.height!,
          ),
        ).toBe(true);
      }
    }
    expect(blocked(-5, -2.2, world.obstacles)).toBe(true);
    expect(blocked(0, 2, world.obstacles)).toBe(false);
    for (const id of ["archive-door", "library-shortcut", "manuscripts"])
      expect(world.objects.some((object) => object.id === id)).toBe(true);
  } finally {
    world.dispose();
  }
});
