import { it, expect } from "vitest";
import { World, names } from "../src/world/scene";
import { blocked, fresh } from "../src/systems/state";
import { safeSpawn } from "../src/systems/collision";
import { reachableFromEntrance } from "./room-navigation";
import { drinkTonic } from "../src/systems/inventory";
import * as T from "three";
import { vi } from "vitest";
it("los escenarios tienen puntos de llegada y caminos transitables", () => {
  for (let room = 0; room < names.length; room++) {
    const w = new World(room, [], [], []);
    const arrival = safeSpawn({ x: 0, z: 5.2 }, w.obstacles);
    expect(arrival, `sala ${room}`).toBeDefined();
    expect(blocked(arrival!.x, arrival!.z, w.obstacles), `sala ${room}`).toBe(
      false,
    );
    expect(
      reachableFromEntrance(w.obstacles, { x: 0, z: -5.8 }, arrival),
      `sala ${room}`,
    ).toBe(true);
    if (room === 0) {
      expect(blocked(5.8, -6, w.obstacles)).toBe(false);
      expect(blocked(-5.8, -6, w.obstacles)).toBe(false);
    }
    expect(w.objects.some((o) => o.kind === "note")).toBe(true);
    expect(w.objects.some((o) => o.kind === "save")).toBe(true);
    w.dispose();
  }
});
it("un tónico consumido no reaparece al reconstruir la habitación", () => {
  const s = fresh();
  s.items = ["Tónico 0"];
  s.collected = ["Tónico 0"];
  s.health = 20;
  drinkTonic(s);
  const w = new World(0, s.items, [], [], s.collected);
  expect(w.objects.some((o) => o.value === "Tónico 0")).toBe(false);
  w.dispose();
});
it("los sellos tienen índice único y las ruinas incluyen la resolución", () => {
  for (let room = 1; room <= 3; room++) {
    const w = new World(room, [], [], []);
    expect(w.objects.find((o) => o.kind === "seal")?.target).toBe(room - 1);
    w.dispose();
  }
  const ruins = new World(4, [], [0, 1, 2], []);
  expect(ruins.objects.some((o) => o.kind === "end")).toBe(true);
  expect(ruins.objects.some((o) => o.id === "next")).toBe(false);
  ruins.dispose();
});
it("libera los recursos de un objeto recogido sin destruir texturas compartidas", () => {
  const world = new World(0, [], [], []);
  const key = world.objects.find((o) => o.id === "key")!;
  const mesh = key.mesh!;
  const part = mesh.children.find(
    (child) =>
      child instanceof T.Mesh &&
      child.material instanceof T.MeshStandardMaterial &&
      Boolean(child.material.map),
  ) as T.Mesh;
  const material = part.material as T.MeshStandardMaterial;
  const map = material.map!;
  const geometryDispose = vi.spyOn(part.geometry, "dispose");
  const materialDispose = vi.spyOn(material, "dispose");
  const textureDispose = vi.spyOn(map, "dispose");
  world.remove(key);
  expect(world.objects).not.toContain(key);
  expect(mesh.parent).toBeNull();
  expect(geometryDispose).toHaveBeenCalledOnce();
  expect(materialDispose).toHaveBeenCalledOnce();
  expect(textureDispose).not.toHaveBeenCalled();
  world.dispose();
});
it("elige el interactuable más próximo y deja de ofrecerlo fuera de alcance", () => {
  const world = new World(0, [], [], []);
  const key = world.objects.find((o) => o.id === "key")!;
  expect(world.nearest(key.x, key.z)).toBe(key);
  expect(world.nearest(20, 20)).toBeUndefined();
  world.remove(key);
  expect(world.nearest(key.x, key.z)).not.toBe(key);
  world.dispose();
});
