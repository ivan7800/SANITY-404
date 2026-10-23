import * as T from "three";
import { pbr } from "../render/materials";
/** All meshes are folded cloth, turned furniture, fixtures or carved details. */
export function furnishings() {
  const group = new T.Group();
  const wood = pbr("wood", 0x674432),
    gold = pbr("brass", 0xb49a61),
    velvet = pbr("fabric", 0x65383c),
    upholstery = pbr("fabric", 0x354d49),
    ivory = pbr("fabric", 0xd4c8ae),
    shade = new T.MeshStandardMaterial({
      color: 0xf3d8ab,
      emissive: 0x714322,
      emissiveIntensity: 0.4,
      roughness: 0.8,
    });
  const add = (
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => add(new T.BoxGeometry(w, h, d), m, x, y, z);
  // Pleated curtains have depth, normals, textured folds and scalloped hems.
  for (const side of [-1, 1])
    for (let z = -6; z <= 6; z += 2) {
      for (const edge of [-1, 1]) {
        // The two inner folds of the east bay hid the Roman doorway. The
        // outer folds remain as tied-back drapes on either side of the arch.
        if (side === 1 && ((z === 2 && edge === 1) || (z === 4 && edge === -1)))
          continue;
        const vertices: number[] = [],
          uv: number[] = [],
          indices: number[] = [];
        const cols = 20,
          rows = 8;
        for (let j = 0; j <= rows; j++)
          for (let i = 0; i <= cols; i++) {
            const u = i / cols,
              v = j / rows;
            vertices.push(
              side * (7.12 - Math.sin(u * Math.PI * 8) * 0.07),
              1.78 + v * 2.7 + (1 - v) * Math.sin(u * Math.PI * 4) * 0.06,
              z + edge * 0.56 + (u - 0.5) * 0.38,
            );
            uv.push(u * 2, v * 3);
          }
        for (let j = 0; j < rows; j++)
          for (let i = 0; i < cols; i++) {
            const a = j * (cols + 1) + i,
              b = a + cols + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        const geo = new T.BufferGeometry();
        geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
        geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        const curtain = new T.Mesh(geo, velvet);
        group.add(curtain);
        const tie = add(
          new T.TorusGeometry(0.09, 0.016, 6, 12),
          gold,
          side * 7.1,
          2.45,
          z + edge * 0.56,
        );
        tie.rotation.z = Math.PI / 2;
      }
      const rod = add(
        new T.CylinderGeometry(0.027, 0.027, 1.65, 8),
        gold,
        side * 7.08,
        4.55,
        z,
      );
      rod.rotation.x = Math.PI / 2;
    }
  velvet.side = T.DoubleSide;
  // Carved writing desk replacing the solid prototype block, with drawers and turned legs.
  box(-4, 1.27, -2, 3, 0.14, 1.6, wood);
  box(-4, 1.36, -2, 2.7, 0.035, 1.33, upholstery);
  for (const x of [-5.24, -2.76])
    for (const z of [-2.58, -1.42]) {
      add(new T.CylinderGeometry(0.065, 0.095, 1.15, 12), wood, x, 0.65, z);
      add(new T.SphereGeometry(0.11, 10, 8), wood, x, 0.15, z);
    }
  for (const x of [-5.02, -2.98]) {
    box(x, 0.96, -2, 0.7, 0.45, 1.35, wood);
    for (const y of [0.86, 1.08]) {
      box(x, y, -1.3, 0.6, 0.18, 0.035, wood);
      const handle = add(
        new T.TorusGeometry(0.055, 0.01, 6, 12),
        gold,
        x,
        y,
        -1.27,
      );
      void handle;
    }
  }
  for (let i = 0; i < 3; i++) {
    const book = box(
      -4.5 + i * 0.35,
      1.45,
      -2.3,
      0.25,
      0.08,
      0.39,
      i % 2 ? velvet : ivory,
    );
    book.rotation.y = i * 0.12;
  }
  // Chesterfield-like chaise with carved feet, padded back, buttons and rolled arms.
  box(4, 0.48, 1, 1.8, 0.3, 2.8, wood);
  box(4, 0.7, 1, 1.58, 0.26, 2.65, upholstery);
  box(4.8, 1.04, 1, 0.25, 0.8, 2.9, upholstery);
  for (const z of [-0.4, 2.4]) {
    const arm = add(
      new T.CylinderGeometry(0.16, 0.16, 1.8, 12),
      upholstery,
      4,
      0.98,
      z,
    );
    arm.rotation.z = Math.PI / 2;
  }
  for (const z of [-0.2, 0.45, 1.1, 1.75, 2.2])
    for (const y of [0.9, 1.18])
      add(new T.SphereGeometry(0.025, 8, 6), gold, 4.64, y, z);
  for (const x of [3.25, 4.75])
    for (const z of [-0.2, 2.2]) {
      const leg = add(
        new T.CylinderGeometry(0.05, 0.085, 0.3, 10),
        wood,
        x,
        0.2,
        z,
      );
      leg.rotation.z = (x - 4) * 0.12;
    }
  // Brass sconces and fabric shades co-located with the actual warm interior lights.
  for (const x of [-6.8, 6.8])
    for (const z of [-5, 3]) {
      box(x, 2.75, z, 0.16, 0.45, 0.18, gold);
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(x, 2.65, z),
        new T.Vector3(x + (x < 0 ? 0.22 : -0.22), 2.7, z),
        new T.Vector3(x + (x < 0 ? 0.25 : -0.25), 3, z),
      ]);
      add(new T.TubeGeometry(curve, 10, 0.025, 6, false), gold, 0, 0, 0);
      add(
        new T.CylinderGeometry(0.16, 0.24, 0.28, 16, 1, true),
        shade,
        x,
        3.09,
        z,
      );
      add(new T.SphereGeometry(0.07, 10, 8), shade, x, 3.05, z);
    }
  // Runner embroidery and woven borders create a material change, not only more props.
  for (const x of [-1.48, 1.48])
    for (let z = -5.7; z < 6; z += 0.34) {
      const motif = box(x, 0.056, z, 0.11, 0.013, 0.11, gold);
      motif.rotation.y = Math.PI / 4;
    }
  return group;
}
