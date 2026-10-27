import * as T from "three";
import { pbr } from "../render/materials";

/** The authored hall envelope. All parts are above the actor or inset into
 * existing walls; furniture and playable floor keep their original colliders. */
export function moreauHallArchitecture() {
  const hall = new T.Group();
  hall.name = "Moreau 1927 · bóveda y orden arquitectónico";
  const limestone = pbr("stone", 0x8c8b7b, { side: T.DoubleSide });
  const bone = pbr("plaster", 0xa9a493, { side: T.DoubleSide });
  const darkStone = pbr("stone", 0x434a45);
  const bronze = pbr("brass", 0x85704d, { roughness: 0.84 });
  const wood = pbr("wood", 0x42342c);
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
    hall.add(mesh);
    return mesh;
  };
  const block = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => add(new T.BoxGeometry(w, h, d), material, x, y, z);
  const vaultY = (x: number) =>
    4.71 + 0.78 * Math.sqrt(Math.max(0, 1 - (x / 7.46) ** 2));

  // One shallow barrel vault gives the whole 15 m hall a readable roofline.
  // Its ribs describe the structural bays instead of repeating ceiling boxes.
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const across = 32;
  const along = 24;
  for (let iz = 0; iz <= along; iz++) {
    const z = -7.46 + (14.92 * iz) / along;
    for (let ix = 0; ix <= across; ix++) {
      const x = -7.46 + (14.92 * ix) / across;
      vertices.push(x, vaultY(x), z);
      uvs.push(ix / 4, iz / 3);
    }
  }
  for (let iz = 0; iz < along; iz++)
    for (let ix = 0; ix < across; ix++) {
      const a = iz * (across + 1) + ix;
      const b = a + across + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const roof = new T.BufferGeometry();
  roof.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  roof.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  roof.setIndex(indices);
  roof.computeVertexNormals();
  add(roof, bone, 0, 0, 0);

  for (const z of [-7.25, -4.8, -2.35, 0.1, 2.55, 5, 7.25]) {
    const path: T.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const x = -7.4 + (14.8 * i) / 32;
      path.push(new T.Vector3(x, vaultY(x) - 0.055, z));
    }
    add(
      new T.TubeGeometry(new T.CatmullRomCurve3(path), 32, 0.073, 6, false),
      limestone,
      0,
      0,
      0,
    );
    for (const side of [-1, 1]) {
      block(side * 7.37, 4.63, z, 0.27, 0.22, 0.36, limestone);
      block(side * 7.36, 4.48, z, 0.34, 0.075, 0.47, bronze);
    }
  }
  // The longitudinal ridge and fine timber ribs make the vault legible from
  // the authored low cameras without extra lights or shadow passes.
  block(0, 5.47, 0, 0.2, 0.1, 14.75, wood);
  for (const x of [-4.8, -2.5, 2.5, 4.8]) {
    const y = vaultY(x) - 0.055;
    block(x, y, 0, 0.075, 0.075, 14.45, bronze);
  }

  // An inset arcade orders the tall side bays. Column shafts are nearly
  // flush with the existing wall plane (x=7.825); no walkable area is lost.
  for (const side of [-1, 1]) {
    for (const z of [-6.75, -4.5, -2.25, 0, 2.25, 4.5, 6.75]) {
      const x = side * 7.67;
      add(new T.CylinderGeometry(0.115, 0.15, 3.36, 10), limestone, x, 2.35, z);
      for (const y of [0.65, 4.08]) {
        add(new T.CylinderGeometry(0.22, 0.19, 0.15, 10), darkStone, x, y, z);
        block(x, y + 0.1, z, 0.42, 0.09, 0.4, limestone);
      }
      for (const y of [1.05, 3.63])
        add(
          new T.TorusGeometry(0.135, 0.017, 5, 12),
          bronze,
          x,
          y,
          z,
        ).rotation.x = Math.PI / 2;
    }
    for (const z of [-5.625, -3.375, -1.125, 1.125, 3.375, 5.625]) {
      const path: T.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = (Math.PI * i) / 12;
        path.push(
          new T.Vector3(
            side * 7.59,
            3.93 + Math.sin(t) * 0.47,
            z - 1.05 * Math.cos(t),
          ),
        );
      }
      add(
        new T.TubeGeometry(new T.CatmullRomCurve3(path), 16, 0.07, 6, false),
        limestone,
        0,
        0,
        0,
      );
      // Carved spandrel keystone, recessed behind the arch's front edge.
      block(side * 7.61, 4.42, z, 0.22, 0.16, 0.18, bronze);
    }
  }

  // A Moreau astronomical seal is cut into the floor, not placed as a prop.
  for (const radius of [1.57, 1.76]) {
    const ring = add(
      new T.TorusGeometry(radius, 0.019, 5, 48),
      bronze,
      0,
      0.053,
      0,
    );
    ring.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const stroke = block(
      Math.sin(angle) * 1.67,
      0.055,
      Math.cos(angle) * 1.67,
      0.034,
      0.008,
      0.25,
      bronze,
    );
    stroke.rotation.y = angle;
  }
  return hall;
}
