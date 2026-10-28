import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import type { Obstacle } from "../systems/collision";

const centers = [
  [-5, -2.2],
  [-5, 2.8],
  [5, -2.2],
  [5, 2.8],
] as const;

/** The authored cabinet envelopes also define the player's solid footprint. */
export const libraryCabinetFootprints: Obstacle[] = centers.map(
  ([x, z], index) => ({
    id: `library-cabinet-${index + 1}`,
    x,
    z,
    w: 1,
    d: 3.4,
    y: 0,
    height: 3.4,
  }),
);

/** Four period cabinets, one combined carcass and four instanced spine finishes. */
export function libraryCabinetry() {
  const root = new T.Group();
  root.name = "Biblioteca Veyr · cuatro armarios de archivo";
  const carcass = new T.Group();
  const oak = pbr("wood", 0x413020, { roughness: 0.92 });
  const recess = pbr("wood", 0x241d19, { roughness: 0.98 });
  const edge = pbr("brass", 0x786749, { roughness: 0.88 });
  const block = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    carcass.add(mesh);
  };
  for (const [x, z] of centers) {
    const outward = x < 0 ? 1 : -1;
    block(x - outward * 0.44, 1.7, z, 0.12, 3.4, 3.4, recess);
    for (const side of [-1, 1]) {
      block(x, 1.7, z + side * 1.64, 0.98, 3.4, 0.1, oak);
      block(x + outward * 0.475, 1.7, z + side * 1.64, 0.035, 3.24, 0.08, edge);
    }
    for (const y of [0.12, 0.72, 1.36, 2, 2.64, 3.31]) {
      block(x, y, z, 0.98, y === 3.31 ? 0.18 : 0.1, 3.3, oak);
      block(x + outward * 0.47, y + 0.04, z, 0.045, 0.045, 3.2, edge);
    }
    block(x + outward * 0.42, 0.24, z, 0.13, 0.38, 3.2, oak);
    block(x + outward * 0.465, 3.23, z, 0.06, 0.1, 3.3, edge);
  }
  root.add(batchRigid(carcass));

  const colors = [0x604839, 0x5b5645, 0x3e534b, 0x67423c];
  const positions: {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
  }[][] = colors.map(() => []);
  for (const [x, z] of centers) {
    const outward = x < 0 ? 1 : -1;
    for (let shelf = 0; shelf < 5; shelf++)
      for (let book = 0; book < 19; book++) {
        const variety = (book * 7 + shelf * 11 + Math.round(z * 10)) & 15;
        if ((book + shelf * 3) % 23 === 0) continue; // a few missing volumes
        const w = 0.12 + (variety % 3) * 0.018;
        const h = 0.38 + (variety % 5) * 0.031;
        positions[(book + shelf * 2 + Math.round(x)) & 3].push({
          x: x + outward * 0.28,
          y: 0.18 + shelf * 0.64 + h / 2,
          z: z - 1.45 + book * 0.16,
          w,
          h,
        });
      }
  }
  const unit = new T.BoxGeometry(0.35, 1, 1);
  const dummy = new T.Object3D();
  for (let index = 0; index < colors.length; index++) {
    const instances = new T.InstancedMesh(
      unit,
      pbr("leather", colors[index], { roughness: 0.95 }),
      positions[index].length,
    );
    instances.name = `library-book-spines-${index}`;
    positions[index].forEach((position, instance) => {
      dummy.position.set(position.x, position.y, position.z);
      dummy.scale.set(1, position.h, position.w);
      dummy.updateMatrix();
      instances.setMatrixAt(instance, dummy.matrix);
    });
    instances.instanceMatrix.needsUpdate = true;
    instances.castShadow = false;
    instances.receiveShadow = true;
    root.add(instances);
  }
  return root;
}
