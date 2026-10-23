import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { portrait } from "../render/portrait";
import { pbr } from "../render/materials";
import { furnishings } from "./furnishings";
import type { Obstacle } from "../systems/state";
/** The stair and landing share a height field, so old saves need no Y value. */
export function mansionFloorHeight(x: number, z: number) {
  if (x < 3.72 || x > 6.28 || z > -1.55 || z < -6.48) return 0;
  return z <= -5.11 ? 2.64 : ((-z - 1.55) / 3.56) * 2.64;
}
export function mansion(obstacles: Obstacle[]) {
  const group = new T.Group();
  group.name = "Vestíbulo Veyr · arquitectura original";
  const wood = pbr("wood", 0x684632);
  const trim = pbr("brass", 0xb59a62);
  const plaster = pbr("stone", 0x969c91);
  const marble = pbr("stone", 0xb1ae98, { roughness: 0.8 });
  const black = pbr("stone", 0x34424a, { roughness: 0.8 });
  const damp = pbr("plaster", 0x54605b, { roughness: 1 });
  const soot = pbr("stone", 0x282e2c, { roughness: 1 });
  const wornGold = pbr("brass", 0x806a49, { roughness: 0.8 });
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
      const romanBay = side === 1 && (z === 2 || z === 4);
      box(side * 7.58, 0.92, z, 0.18, 1.35, 1.65, wood);
      box(side * 7.44, 0.92, z - 0.73, 0.04, 1.14, 0.035, trim);
      box(side * 7.44, 0.92, z + 0.73, 0.04, 1.14, 0.035, trim);
      if (romanBay) {
        // Two former window bays form one stone alcove behind the fissure.
        box(side * 7.48, 3.15, z, 0.15, 2.5, 1.45, soot);
        box(side * 7.35, 3.15, z, 0.08, 2.26, 1.24, marble);
        box(side * 7.3, 3.15, z, 0.025, 2.1, 1.08, damp);
      } else {
        box(side * 7.6, 3.15, z, 0.15, 2.5, 1.45, black);
        box(side * 7.48, 3.15, z, 0.045, 2.25, 1.2, glass);
        // Uneven damp marks sit behind the mullions rather than across the view.
        box(side * 7.425, 1.04, z, 0.035, 0.84, 1.38, damp);
        box(side * 7.398, 0.63, z - 0.33, 0.018, 0.31, 0.28, soot);
        box(side * 7.398, 0.73, z + 0.38, 0.018, 0.46, 0.16, soot);
        box(side * 7.4, 3.15, z, 0.08, 2.3, 0.06, trim);
        box(side * 7.4, 3.15, z, 0.08, 0.07, 1.3, trim);
      }
      for (const e of [-1, 1])
        box(side * 7.39, 3.15 + e * 1.18, z, 0.12, 0.1, 1.5, marble);
      box(side * 7.35, 2.45, z + 1, 0.3, 4.6, 0.22, wood);
      box(side * 7.31, 1.75, z + 1, 0.045, 0.54, 0.08, wornGold);
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
  // A walkable grand stair rises into the north gallery. The stone stringers,
  // carved risers and individual treads keep the sixth-generation silhouette.
  for (let i = 0; i < 12; i++) {
    const z = -1.72 - i * 0.31;
    const h = 0.22 * (i + 1);
    box(5, h / 2, z, 2.55, h, 0.34, wood);
    box(5, h + 0.025, z, 2.62, 0.05, 0.34, marble);
    box(5, h * 0.58, z + 0.18, 2.35, 0.065, 0.035, wornGold);
  }
  box(5, 1.32, -5.83, 2.66, 2.64, 1.42, wood);
  box(5, 2.67, -5.83, 2.7, 0.055, 1.43, marble);
  for (const x of [3.51, 6.49]) {
    obstacles.push({ x, z: -3.96, w: 0.16, d: 5.25, height: 3.8 });
    for (let i = 0; i < 12; i++) {
      const z = -1.6 - i * 0.31;
      const h = 0.22 * i;
      box(x, h + 0.74, z, 0.1, 1.2, 0.1, wood);
      mesh(new T.SphereGeometry(0.095, 8, 6), trim, x, h + 1.39, z);
    }
    const rail = box(x, 1.93, -3.35, 0.15, 0.13, 4.1, wood);
    rail.rotation.x = 0.38;
    box(x, 3.59, -5.83, 0.17, 0.14, 1.48, wood);
  }
  obstacles.push({ x: 5, z: -6.66, w: 2.95, d: 0.16, height: 3.7 });
  for (let x = 3.72; x <= 6.28; x += 0.32) {
    box(x, 3.2, -6.58, 0.085, 1.04, 0.085, wood);
    mesh(new T.SphereGeometry(0.07, 8, 6), trim, x, 3.73, -6.58);
  }
  box(5, 3.75, -6.58, 3.05, 0.13, 0.16, wood);
  // The landing has an authored focal point: a framed astronomical chart,
  // layered glass sectors and brass calibration marks above a reading desk.
  const chartX = 4.35;
  box(chartX, 3.56, -7.54, 2.5, 1.76, 0.14, wood);
  box(chartX, 3.56, -7.44, 2.18, 1.48, 0.06, wornGold);
  const chart = new T.MeshStandardMaterial({
    color: 0x485e6a,
    emissive: 0x244153,
    emissiveIntensity: 0.48,
    roughness: 0.7,
  });
  box(chartX, 3.56, -7.395, 1.91, 1.27, 0.025, chart);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    mesh(
      new T.SphereGeometry(i % 4 === 0 ? 0.04 : 0.022, 6, 4),
      i % 4 === 0 ? trim : wornGold,
      chartX + Math.cos(a) * 0.76,
      3.56 + Math.sin(a) * 0.48,
      -7.35,
    );
  }
  const dial = mesh(
    new T.TorusGeometry(0.52, 0.018, 6, 32),
    trim,
    chartX,
    3.56,
    -7.34,
  );
  dial.scale.y = 0.78;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const mark = box(
      chartX + Math.cos(a) * 0.36,
      3.56 + Math.sin(a) * 0.29,
      -7.313,
      0.26,
      0.022,
      0.018,
      i % 2 ? trim : wornGold,
    );
    mark.rotation.z = a;
  }
  box(chartX, 2.94, -6.12, 1.35, 0.08, 0.48, wood);
  for (const x of [chartX - 0.53, chartX + 0.53])
    box(x, 2.78, -6.12, 0.075, 0.34, 0.37, trim);
  // The Roman fissure opens in a ground-floor bay, clear of the stair. The
  // carved stone surround stands in front of the east pilaster so it reads
  // from the room rather than disappearing behind that structural column.
  for (const z of [2.02, 3.98]) {
    box(6.48, 1.35, z, 0.22, 2.7, 0.26, marble);
    box(6.4, 0.24, z, 0.38, 0.48, 0.36, plaster);
    box(6.4, 2.66, z, 0.35, 0.16, 0.38, trim);
  }
  box(6.48, 2.82, 3, 0.25, 0.18, 2.1, marble);
  box(6.42, 3.04, 3, 0.2, 0.3, 0.55, plaster);
  for (const z of [2.38, 2.69, 3, 3.31, 3.62])
    box(6.39, 0.06, z, 0.82, 0.11, 0.025, wornGold);
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
  // Aged stone has fine fractures; these marks are flush with the existing
  // collision floor and therefore cannot trap the player.
  for (const x of [-6, -4, 3, 6])
    for (const z of [-5, -2, 2, 5]) {
      const crack = box(x + 0.13, 0.032, z - 0.11, 0.016, 0.006, 0.49, soot);
      crack.rotation.y = ((x + z) % 3) * 0.24;
    }
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
    const tarnish = box(x + 0.32, 3.21, -7.245, 0.1, 1.28, 0.014, damp);
    tarnish.rotation.z = x < 0 ? 0.08 : -0.06;
  }
  // A warped clock face and scattered lintel fractures keep the entrance
  // recognisably domestic, while the finishes read as neglected.
  box(0, 3.87, -7.27, 0.92, 0.92, 0.06, wornGold);
  box(0, 3.87, -7.19, 0.7, 0.7, 0.025, black);
  for (const x of [-0.23, 0.23]) box(x, 3.89, -7.17, 0.035, 0.42, 0.014, trim);
  for (const x of [-2.15, 2.15]) {
    const fracture = box(x, 3.37, -7.17, 0.035, 0.83, 0.017, soot);
    fracture.rotation.z = x < 0 ? -0.19 : 0.13;
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
  const batches = new Map<T.Material, Map<string, T.BufferGeometry[]>>();
  for (const child of [...group.children])
    if (child instanceof T.Mesh) {
      const g = child.geometry.clone().applyMatrix4(child.matrixWorld);
      const signature = `${g.index ? "indexed" : "plain"}:${Object.entries(
        g.attributes,
      )
        .map(
          ([name, attribute]) =>
            `${name}-${(attribute as T.BufferAttribute).itemSize}`,
        )
        .sort()
        .join(",")}`;
      const byShape =
        batches.get(child.material) ?? new Map<string, T.BufferGeometry[]>();
      const entries = byShape.get(signature) ?? [];
      entries.push(g);
      byShape.set(signature, entries);
      batches.set(child.material, byShape);
      child.geometry.dispose();
      group.remove(child);
    }
  for (const [material, byShape] of batches) {
    for (const geometries of byShape.values()) {
      const merged = mergeGeometries(geometries, false);
      const output = merged ? [merged] : geometries;
      if (merged) for (const part of geometries) part.dispose();
      for (const geometry of output) {
        const m = new T.Mesh(geometry, material);
        m.receiveShadow = true;
        m.castShadow = true;
        group.add(m);
      }
    }
  }
  return group;
}
