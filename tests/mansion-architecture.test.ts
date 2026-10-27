import { expect, it } from "vitest";
import * as T from "three";
import { moreauHallArchitecture } from "../src/world/mansion-architecture";
import { World } from "../src/world/scene";
import { blocked } from "../src/systems/collision";
import { reachableFromEntrance } from "./room-navigation";

it("la bóveda Moreau cubre el vestíbulo sin invadir la altura de juego", () => {
  const architecture = moreauHallArchitecture();
  const roof = architecture.children[0] as T.Mesh;
  const positions = roof.geometry.getAttribute("position");
  const center = positions.getY(16);
  const edge = positions.getY(0);
  expect(center).toBeGreaterThan(edge + 0.7);
  expect(edge).toBeGreaterThan(4.6);
  const bounds = new T.Box3().setFromObject(architecture);
  expect(bounds.min.x).toBeLessThan(-7.4);
  expect(bounds.max.x).toBeGreaterThan(7.4);
  expect(bounds.min.z).toBeLessThan(-7.4);
  expect(bounds.max.z).toBeGreaterThan(7.4);
  let triangles = 0;
  architecture.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    const geometry = object.geometry;
    triangles += geometry.index
      ? geometry.index.count / 3
      : geometry.getAttribute("position").count / 3;
  });
  expect(triangles).toBeLessThan(15000);
});

it("el vestíbulo conserva acceso físico a sus conexiones tras el nuevo techo", () => {
  const world = new World(0, [], [], []);
  const arrival = { x: 0, z: 5.2 };
  expect(blocked(arrival.x, arrival.z, world.obstacles)).toBe(false);
  for (const point of [
    { x: 0, z: 0 },
    { x: 5.25, z: 3 },
  ])
    expect(
      blocked(point.x, point.z, world.obstacles),
      `vista ${point.x},${point.z}`,
    ).toBe(false);
  expect(world.nearest(5.25, 3)?.id).toBe("roman-portal");
  for (const [index, x] of [1.2, 3.8, 6.15].entries()) {
    expect(
      world.obstacles.find(
        (obstacle) => obstacle.id === `south-memory-pier-${index}`,
      ),
    ).toMatchObject({
      x,
      z: 7.16,
      w: 0.22,
      d: 0.94,
    });
    expect(blocked(x, 7.16, world.obstacles)).toBe(true);
  }
  for (const objectId of ["next", "roman-portal", "medieval-portal"]) {
    const object = world.objects.find((candidate) => candidate.id === objectId);
    expect(object, objectId).toBeDefined();
    expect(
      reachableFromEntrance(
        world.obstacles,
        { x: object!.x, z: object!.z },
        arrival,
      ),
      objectId,
    ).toBe(true);
  }
  world.dispose();
});
