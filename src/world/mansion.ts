import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { portrait } from "../render/portrait";
import { pbr } from "../render/materials";
import { furnishings } from "./furnishings";
import type { Obstacle } from "../systems/state";
export function mansion(obstacles: Obstacle[]) {
  const group = new T.Group();
  group.name = "Vestíbulo Veyr · arquitectura original";
  const wood = pbr("wood", 0x684632);
  const trim = pbr("brass", 0xb59a62);
  const plaster = pbr("stone", 0x969c91);
  const marble = pbr("stone", 0xb1ae98, { roughness: 0.8 });
  const black = pbr("stone", 0x34424a, { roughness: 0.8 });
  const glass = new T.MeshStandardMaterial({
    color: 0x334f70,
    emissive: 0x1b3046,
    emissiveIntensity: 0.35,
    metalness: 0.25,
    roughness: 0.3,
  });
  const mesh = (
    g: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    group.add(o);
    return o;
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => mesh(new T.BoxGeometry(w, h, d), m, x, y, z);
  // Recessed wall panels with skirting, cornices, pilasters and brass mouldings.
  for (const side of [-1, 1]) {
    box(0, 0.22, side * 7.65, 15.5, 0.38, 0.22, wood);
    box(0, 1.65, side * 7.64, 15.5, 0.12, 0.22, trim);
    box(0, 4.65, side * 7.62, 15.5, 0.2, 0.32, trim);
    box(side * 7.65, 0.22, 0, 0.22, 0.38, 15.5, wood);
    box(side * 7.64, 1.65, 0, 0.22, 0.12, 15.5, trim);
    box(side * 7.62, 4.65, 0, 0.32, 0.2, 15.5, trim);
    for (let z = -6; z <= 6; z += 2) {
      box(side * 7.58, 0.92, z, 0.18, 1.35, 1.65, wood);
      box(side * 7.44, 0.92, z - 0.73, 0.04, 1.14, 0.035, trim);
      box(side * 7.44, 0.92, z + 0.73, 0.04, 1.14, 0.035, trim);
      box(side * 7.6, 3.15, z, 0.15, 2.5, 1.45, black);
      box(side * 7.48, 3.15, z, 0.045, 2.25, 1.2, glass);
      box(side * 7.4, 3.15, z, 0.08, 2.3, 0.06, trim);
      box(side * 7.4, 3.15, z, 0.08, 0.07, 1.3, trim);
      for (const e of [-1, 1])
        box(side * 7.39, 3.15 + e * 1.18, z, 0.12, 0.1, 1.5, marble);
      box(side * 7.35, 2.45, z + 1, 0.3, 4.6, 0.22, wood);
    }
  }
  // North arch and entrance pediment: a real polygonal arch assembled from wedge voussoirs.
  for (const x of [-1.5, 1.5]) {
    box(x, 1.65, -7.35, 0.35, 3.3, 0.4, marble);
    box(x, 0.2, -7.35, 0.55, 0.35, 0.55, marble);
  }
  for (let i = 0; i < 13; i++) {
    const a = (i / 12) * Math.PI;
    const stone = box(
      Math.cos(a) * 1.5,
      3.2 + Math.sin(a) * 1.3,
      -7.35,
      0.34,
      0.42,
      0.4,
      marble,
    );
    stone.rotation.z = a - Math.PI / 2;
  }
  // Grand staircase in the eastern alcove; the volume is solid and cannot be walked through.
  for (let i = 0; i < 11; i++)
    box(5, 0.12 * (i + 1), -1.7 - i * 0.33, 2.6, 0.24 * (i + 1), 0.35, wood);
  obstacles.push({ x: 5, z: -3.35, w: 2.7, d: 3.9 });
  for (const x of [3.55, 6.45])
    for (let i = 0; i < 12; i++) {
      const z = -1.55 - i * 0.33;
      box(x, 0.8 + i * 0.12, z, 0.075, 1.2, 0.075, trim);
    }
  for (const x of [3.55, 6.45]) {
    const rail = box(x, 2, -3.35, 0.12, 0.12, 4.2, wood);
    rail.rotation.x = -0.35;
  }
  box(5, 2.7, -5.8, 3.6, 0.2, 1.2, wood);
  // Coffered ceiling beams stay high enough to preserve the authored camera views.
  for (const x of [-5, 0, 5]) box(x, 4.98, 0, 0.25, 0.18, 16, wood);
  for (const z of [-5, 0, 5]) box(0, 4.98, z, 16, 0.18, 0.25, wood);
  // Checkered stone threshold and runner edging.
  for (let x = -7; x < 8; x++)
    for (let z = -7; z < 8; z++) {
      if (Math.abs(x) < 2) continue;
      box(x, 0.016, z, 0.97, 0.025, 0.97, (x + z) % 2 === 0 ? plaster : black);
    }
  for (const x of [-1.72, 1.72]) box(x, 0.047, 0, 0.055, 0.02, 12, trim);
  // Fireplace, mantel and three framed paintings, plus furniture with carved legs.
  box(-5.7, 0.9, -5.8, 2.8, 1.8, 0.8, wood);
  box(-5.7, 1, -5.31, 1.6, 1.45, 0.04, black);
  box(-5.7, 1.9, -5.7, 3.15, 0.22, 1.15, marble);
  const embers = new T.MeshStandardMaterial({
    color: 0x8d4225,
    emissive: 0xd56a2b,
    emissiveIntensity: 1,
  });
  for (let i = 0; i < 7; i++)
    mesh(
      new T.IcosahedronGeometry(0.12, 0),
      embers,
      -6.3 + i * 0.2,
      0.3,
      -5.23,
    );
  for (const x of [-4, 4]) {
    box(x, 3.2, -7.48, 1.45, 1.9, 0.12, trim);
    box(x, 3.2, -7.37, 1.2, 1.65, 0.07, black);
    box(
      x,
      3.2,
      -7.29,
      1.16,
      1.6,
      0.025,
      new T.MeshStandardMaterial({ map: portrait(x), roughness: 1 }),
    );
    for (const y of [2.3, 4.1]) box(x, y, -7.27, 1.5, 0.08, 0.1, trim);
  }
  // Original chandelier with solid candles and polygonal rings.
  mesh(new T.CylinderGeometry(0.04, 0.04, 1, 8), trim, 0, 4.5, 0);
  const ring = mesh(new T.TorusGeometry(0.85, 0.045, 6, 24), trim, 0, 3.95, 0);
  ring.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    mesh(
      new T.CylinderGeometry(0.05, 0.05, 0.3, 6),
      marble,
      Math.cos(a) * 0.85,
      4.13,
      Math.sin(a) * 0.85,
    );
  }
  for (const object of [...furnishings().children]) group.add(object);
  // Batch static geometry by material, keeping the character and interactables independent.
  group.updateMatrixWorld(true);
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  for (const child of [...group.children])
    if (child instanceof T.Mesh) {
      const g = child.geometry.clone().applyMatrix4(child.matrixWorld);
      const entries = batches.get(child.material) ?? [];
      entries.push(g);
      batches.set(child.material, entries);
      child.geometry.dispose();
      group.remove(child);
    }
  for (const [material, geometries] of batches) {
    const g = mergeGeometries(geometries, false);
    for (const part of geometries) part.dispose();
    if (g) {
      const m = new T.Mesh(g, material);
      m.receiveShadow = true;
      m.castShadow = true;
      group.add(m);
    }
  }
  return group;
}
