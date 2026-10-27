import { expect, it } from "vitest";
import * as T from "three";
import { historicArchitecture } from "../src/world/historic-architecture";
import { World } from "../src/world/scene";
import { blocked } from "../src/systems/collision";

it("cada sala de 189 a 1217 recibe arquitectura alta sin invadir el suelo", () => {
  const styles = new Set<string>();
  for (let room = 8; room <= 20; room++) {
    const group = historicArchitecture(room);
    styles.add(group.name.split("-")[1]);
    const bounds = new T.Box3().setFromObject(group);
    expect(bounds.min.y, `sala ${room}`).toBeGreaterThan(3.4);
    expect(bounds.max.x, `sala ${room}`).toBeGreaterThan(7.4);
    expect(bounds.min.x, `sala ${room}`).toBeLessThan(-7.4);
    expect(group.children.length, `sala ${room}`).toBeLessThanOrEqual(3);
    let triangles = 0;
    group.traverse((object) => {
      if (!(object instanceof T.Mesh)) return;
      const geometry = object.geometry;
      triangles += geometry.index
        ? geometry.index.count / 3
        : geometry.getAttribute("position").count / 3;
    });
    expect(triangles, `presupuesto geométrico sala ${room}`).toBeLessThan(5000);
    if (room === 15) expect(group.children.length).toBe(2);
  }
  expect(styles).toEqual(
    new Set(["roman", "abbey", "coast", "observatory", "quarry", "hospital"]),
  );
});

it("las llegadas y objetos de las trece salas permanecen accesibles", () => {
  for (let room = 8; room <= 20; room++) {
    const world = new World(room, [], [], []);
    expect(
      world.scene.children.some(
        (object) =>
          object.name.startsWith("arquitectura-") &&
          object.name.endsWith(`-${room}`),
      ),
    ).toBe(true);
    expect(blocked(0, 5.2, world.obstacles), `llegada sala ${room}`).toBe(
      false,
    );
    expect(
      world.objects.some((object) => object.kind === "note"),
      `documento sala ${room}`,
    ).toBe(true);
    world.dispose();
  }
});
