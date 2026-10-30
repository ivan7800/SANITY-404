import { describe, expect, it } from "vitest";
import * as T from "three";
import { moreauHallArchitecture } from "../src/world/mansion-architecture";

describe("Mansion Veyr ceiling constellation art", () => {
  it("adds batched stars and lines without adding gameplay colliders or shadow casters", () => {
    const hall = moreauHallArchitecture();
    const chart = hall.getObjectByName("Veyr · carta astral de la bóveda");
    expect(chart).toBeDefined();
    expect(chart?.children).toHaveLength(2);
    const stars = chart?.getObjectByName("veyr-vault-constellation-stars");
    const lines = chart?.getObjectByName("veyr-vault-constellation-lines");
    expect(stars).toBeInstanceOf(T.InstancedMesh);
    expect(lines).toBeInstanceOf(T.InstancedMesh);
    const starInstances = stars as T.InstancedMesh;
    const lineInstances = lines as T.InstancedMesh;
    expect(starInstances.count).toBe(35);
    expect(lineInstances.count).toBe(28);
    expect(starInstances.castShadow).toBe(false);
    expect(lineInstances.castShadow).toBe(false);
    expect(starInstances.receiveShadow).toBe(false);
    expect(lineInstances.receiveShadow).toBe(false);
    const matrix = new T.Matrix4();
    for (let i = 0; i < starInstances.count; i++) {
      starInstances.getMatrixAt(i, matrix);
      const position = new T.Vector3().setFromMatrixPosition(matrix);
      expect(Math.abs(position.x)).toBeLessThan(2);
      expect(Math.abs(position.z)).toBeLessThan(7);
      expect(position.y).toBeGreaterThan(5);
    }
    const disposedGeometry = new Set<T.BufferGeometry>();
    const disposedMaterials = new Set<T.Material>();
    hall.traverse((item) => {
      if (!(item instanceof T.Mesh)) return;
      if (!disposedGeometry.has(item.geometry)) {
        item.geometry.dispose();
        disposedGeometry.add(item.geometry);
      }
      for (const material of Array.isArray(item.material)
        ? item.material
        : [item.material]) {
        if (!disposedMaterials.has(material)) {
          material.dispose();
          disposedMaterials.add(material);
        }
      }
    });
  });
});
