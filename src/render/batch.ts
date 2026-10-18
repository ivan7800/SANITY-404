import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
/** Combine only rigid direct children; interactive roots and skeleton pivots retain identity. */
export function batchRigid(group: T.Group) {
  const groups = new Map<T.Material, T.Mesh[]>();
  for (const child of group.children)
    if (
      child instanceof T.Mesh &&
      child.visible &&
      !Array.isArray(child.material)
    ) {
      const entries = groups.get(child.material) ?? [];
      entries.push(child);
      groups.set(child.material, entries);
    }
  for (const [material, meshes] of groups) {
    if (meshes.length < 2) continue;
    const parts = meshes.map((mesh) => {
      mesh.updateMatrix();
      return mesh.geometry.clone().applyMatrix4(mesh.matrix);
    });
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry) continue;
    for (const mesh of meshes) {
      group.remove(mesh);
      mesh.geometry.dispose();
    }
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = meshes.some((m) => m.castShadow);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
