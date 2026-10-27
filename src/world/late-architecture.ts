import * as T from "three";
import { pbr } from "../render/materials";

type LateYear = 1491 | 1610 | 1786 | 1899;

/** Architectural envelope for the eight late-campaign rooms. The geometry
 * occupies the roof or the existing boundary walls, so the authored gameplay
 * footprint and its collision model remain unchanged. */
export function lateArchitecture(year: LateYear, inner: boolean, low: boolean) {
  const group = new T.Group();
  group.name = `architecture-${year}-${inner ? "inner" : "outer"}`;
  const stone = pbr("stone", year === 1491 ? 0x8b8069 : 0x69665c, {
    side: T.DoubleSide,
  });
  const timber = pbr("wood", year === 1786 ? 0x513335 : 0x584837);
  const pale = pbr("plaster", year === 1899 ? 0x82908e : 0x918675, {
    side: T.DoubleSide,
  });
  const metal = pbr("brass", year === 1899 ? 0x627d7b : 0x9c8155, {
    roughness: 0.78,
  });
  const dark = pbr("fabric", year === 1786 ? 0x462c36 : 0x323638);
  const mesh = (
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    group.add(object);
    return object;
  };
  const block = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => mesh(new T.BoxGeometry(w, h, d), material, x, y, z);
  const line = (points: T.Vector3[], radius: number, material: T.Material) =>
    mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points),
        Math.max(8, points.length * 2),
        radius,
        5,
        false,
      ),
      material,
      0,
      0,
      0,
    );
  const roof = (
    height: (x: number, z: number) => number,
    material: T.Material,
  ) => {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const nx = 20;
    const nz = 20;
    for (let iz = 0; iz <= nz; iz++)
      for (let ix = 0; ix <= nx; ix++) {
        const x = -7.45 + (ix * 14.9) / nx;
        const z = -7.45 + (iz * 14.9) / nz;
        positions.push(x, height(x, z), z);
        uv.push(ix / 3, iz / 3);
      }
    for (let iz = 0; iz < nz; iz++)
      for (let ix = 0; ix < nx; ix++) {
        const a = iz * (nx + 1) + ix;
        const b = a + nx + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    mesh(geometry, material, 0, 0, 0);
  };

  if (year === 1491) {
    // Frontier printshop: two pitched roof planes, exposed tie beams and
    // drying rails. The central aisle remains visually legible end to end.
    const height = (x: number) => 4.22 + 1.04 * (1 - Math.abs(x) / 7.45);
    roof((x) => height(x), pale);
    for (const z of [-6.9, -3.45, 0, 3.45, 6.9]) {
      line(
        [
          new T.Vector3(-7.4, height(-7.4), z),
          new T.Vector3(0, height(0), z),
          new T.Vector3(7.4, height(7.4), z),
        ],
        0.095,
        timber,
      );
      block(0, 3.63, z, 14.4, 0.1, 0.11, timber);
      for (const x of [-5.6, 5.6]) {
        block(x, 3.89, z, 0.09, 0.58, 0.1, timber);
        block(x, 3.52, z, 1.45, 0.07, 0.08, timber);
      }
    }
    for (const side of [-1, 1])
      for (const z of [-5.3, -1.8, 1.7, 5.2]) {
        block(side * 7.54, 3, z, 0.12, 1.75, 0.1, timber);
        block(side * 7.48, 3.77, z, 0.11, 0.08, 1.68, timber);
        // High slatted shutters suggest exterior openings without opening
        // a false passage in the original collision wall.
        for (const y of [2.67, 2.95, 3.23])
          block(side * 7.47, y, z, 0.055, 0.055, 1.38, dark);
      }
  } else if (year === 1610) {
    // Domestic gallery: shallow plaster barrel vault, ceiling coffers and
    // framed portrait niches. The empty frame remains the room's narrative axis.
    const height = (x: number) =>
      4.55 + 0.63 * Math.sqrt(Math.max(0, 1 - (x / 7.45) ** 2));
    roof((x) => height(x), pale);
    for (const z of [-6.8, -4.5, -2.2, 0.1, 2.4, 4.7, 6.8]) {
      const points: T.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const x = -7.4 + (14.8 * i) / 12;
        points.push(new T.Vector3(x, height(x) - 0.05, z));
      }
      line(points, 0.065, timber);
    }
    for (const side of [-1, 1])
      for (const z of [-5.5, -2.7, 0.1, 2.9, 5.7]) {
        block(side * 7.52, 3.2, z, 0.1, 1.55, 1.83, timber);
        block(side * 7.46, 3.2, z, 0.04, 1.3, 1.55, dark);
        block(side * 7.44, 4.03, z, 0.09, 0.1, 2.05, metal);
      }
    for (const x of [-3.5, 0, 3.5]) block(x, 5.1, 0, 0.1, 0.09, 14.1, timber);
  } else if (year === 1786) {
    // Theatre: a broad proscenium, shallow canopy, fly bars and pulleys. The
    // stage silhouette differs from the house before any puzzle prop is seen.
    roof(
      (x, z) => 4.65 + 0.32 * (1 - Math.abs(x) / 7.45) + (z < -3 ? 0.22 : 0),
      dark,
    );
    for (const x of [-6.8, 6.8]) {
      block(x, 2.93, -4.65, 0.35, 3.45, 0.5, timber);
      block(x, 4.56, -4.65, 0.6, 0.23, 0.73, metal);
    }
    const arch: T.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const x = -6.8 + (13.6 * i) / 16;
      arch.push(new T.Vector3(x, 4.4 + 0.5 * (1 - (x / 6.8) ** 2), -4.65));
    }
    line(arch, 0.14, metal);
    for (const z of low ? [-5.9, -1, 3.7] : [-5.9, -3.45, -1, 1.35, 3.7]) {
      block(0, 4.58, z, 13.6, 0.09, 0.12, timber);
      for (const x of [-5.1, 5.1]) {
        const pulley = mesh(
          new T.TorusGeometry(0.23, 0.035, 5, 16),
          metal,
          x,
          4.15,
          z,
        );
        pulley.rotation.y = Math.PI / 2;
        block(x, 3.68, z, 0.025, 0.7, 0.025, metal);
      }
    }
    for (const side of [-1, 1])
      for (const z of [-5, -2.5, 0, 2.5, 5])
        block(side * 7.48, 3.55, z, 0.07, 1.55, 0.1, timber);
  } else {
    // 1899: north-light sawtooth roof, narrow iron trusses and darkroom
    // baffles. Alternating roof heights produce a photographic skyline.
    const height = (x: number) => 4.55 + 0.58 * (((x + 7.45) / 3.72) % 1);
    roof((x) => height(x), pale);
    for (const x of [-7.42, -3.7, 0.02, 3.74, 7.42]) {
      block(x, 4.59, 0, 0.11, 0.14, 14.7, metal);
      for (const z of low ? [-6, 0, 6] : [-6, -3, 0, 3, 6]) {
        block(x, 3.96, z, 0.07, 1.17, 0.07, metal);
        block(x, 3.4, z, 0.5, 0.08, 0.07, metal);
      }
    }
    for (const side of [-1, 1])
      for (const z of [-5.5, -2.7, 0.1, 2.9, 5.7]) {
        block(side * 7.52, 3.18, z, 0.1, 1.65, 1.65, metal);
        block(side * 7.47, 3.18, z, 0.04, 1.36, 1.34, dark);
        for (const y of [2.72, 3.18, 3.64])
          block(side * 7.42, y, z, 0.025, 0.035, 1.31, metal);
      }
    for (const z of [-4.5, 4.5]) block(0, 4.54, z, 14.5, 0.08, 0.08, timber);
  }
  // A continuous wall rail ties the era-specific roof into the existing
  // masonry core. Its lowest point stays above the actor's head.
  for (const side of [-1, 1])
    block(side * 7.55, 4.22, 0, 0.12, 0.14, 14.9, stone);
  return group;
}
