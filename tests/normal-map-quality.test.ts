import { describe, expect, it } from "vitest";
import * as T from "three";
import { setNormalMapQuality, simplifyLowMaterials } from "../src/render/materials";

describe("quality profile normal-map restoration", () => {
  it("restores the exact normal texture after Low -> High", () => {
    const normal = new T.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
    const material = new T.MeshStandardMaterial({ normalMap: normal });
    const scene = new T.Group();
    const mesh = new T.Mesh(new T.BoxGeometry(), material);
    scene.add(mesh);

    setNormalMapQuality(scene, false);
    expect(material.normalMap).toBeNull();

    setNormalMapQuality(scene, true);
    expect(material.normalMap).toBe(normal);

    mesh.geometry.dispose();
    material.dispose();
    normal.dispose();
  });

  it("handles shared materials and repeated profile changes", () => {
    const normal = new T.Texture();
    const material = new T.MeshStandardMaterial({ normalMap: normal });
    const scene = new T.Group();
    for (let i = 0; i < 3; i++) {
      const mesh = new T.Mesh(new T.BoxGeometry(), material);
      scene.add(mesh);
    }
    simplifyLowMaterials(scene);
    simplifyLowMaterials(scene);
    expect(material.normalMap).toBeNull();
    setNormalMapQuality(scene, true);
    setNormalMapQuality(scene, true);
    expect(material.normalMap).toBe(normal);
    for (const mesh of scene.children) (mesh as T.Mesh).geometry.dispose();
    material.dispose();
    normal.dispose();
  });

  it("keeps intentionally untextured materials unchanged", () => {
    const material = new T.MeshStandardMaterial();
    const scene = new T.Group();
    const mesh = new T.Mesh(new T.BoxGeometry(), material);
    scene.add(mesh);
    setNormalMapQuality(scene, false);
    setNormalMapQuality(scene, true);
    expect(material.normalMap).toBeNull();
    mesh.geometry.dispose();
    material.dispose();
  });
});
