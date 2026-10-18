import { it, expect } from "vitest";
import * as T from "three";
import { World } from "../src/world/scene";
import {
  pbr,
  simplifyLowMaterials,
  surfaceTextures,
} from "../src/render/materials";
it("Bajo reduce las luces locales y conserva la iluminación completa en Media", () => {
  const low = new World(0, [], [], [], [], 1);
  const medium = new World(0, [], [], [], [], 1.3);
  expect(low.lights).toHaveLength(2);
  expect(medium.lights).toHaveLength(4);
  low.dispose();
  medium.dispose();
});
it("Bajo evita mapas normales sin perder color ni rugosidad PBR", () => {
  const material = pbr("wood", 0x654321);
  const root = new T.Group();
  root.add(new T.Mesh(new T.BoxGeometry(1, 1, 1), material));
  const originalColor = material.color.getHex();
  const maps = surfaceTextures("wood");
  expect(material.normalMap).toBe(maps.normalMap);
  simplifyLowMaterials(root);
  expect(material.normalMap).toBeNull();
  expect(material.map).toBe(maps.map);
  expect(material.roughnessMap).toBe(maps.roughnessMap);
  expect(material.color.getHex()).toBe(originalColor);
  root.children[0].traverse((o) => {
    if (o instanceof T.Mesh) o.geometry.dispose();
  });
  material.dispose();
});
