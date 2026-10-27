import { expect, it } from "vitest";
import * as T from "three";
import { lateArchitecture } from "../src/world/late-architecture";
import { World } from "../src/world/scene";
import { blocked } from "../src/systems/collision";
import { reachableFromEntrance } from "./room-navigation";

it.each([1491, 1610, 1786, 1899] as const)(
  "%i tiene una cubierta propia, dentro del presupuesto geométrico",
  (year) => {
    const architecture = lateArchitecture(year, false, false);
    expect(architecture.name).toBe(`architecture-${year}-outer`);
    const roof = architecture.children[0] as T.Mesh;
    const vertices = roof.geometry.getAttribute("position");
    const heights = new Set<number>();
    for (let index = 0; index < vertices.count; index++)
      heights.add(Math.round(vertices.getY(index) * 100));
    expect(heights.size).toBeGreaterThan(2);
    expect(Math.min(...heights)).toBeGreaterThan(400);
    let triangles = 0;
    architecture.traverse((object) => {
      if (!(object instanceof T.Mesh)) return;
      triangles += object.geometry.index
        ? object.geometry.index.count / 3
        : object.geometry.getAttribute("position").count / 3;
    });
    expect(triangles).toBeLessThan(12000);
  },
);

it("las ocho salas conservan acceso a las pruebas y el proscenio es físico", () => {
  for (const room of [21, 22, 23, 24, 25, 26, 27, 28]) {
    const world = new World(room, [], [], []);
    const year = room < 23 ? 1491 : room < 25 ? 1610 : room < 27 ? 1786 : 1899;
    expect(
      world.scene.getObjectByName(
        `architecture-${year}-${room % 2 === 1 ? "outer" : "inner"}`,
      ),
    ).toBeDefined();
    for (const object of world.objects)
      expect(reachableFromEntrance(world.obstacles, object), object.id).toBe(
        true,
      );
    if (year === 1786) {
      expect(
        world.obstacles.some((item) => item.id === "theatre-proscenium-east"),
      ).toBe(true);
      expect(blocked(6.8, -4.65, world.obstacles)).toBe(true);
    }
    world.dispose();
  }
});
