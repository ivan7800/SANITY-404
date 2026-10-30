import * as T from "three";
import { pbr } from "../render/materials";
import { MANSION_VAULT_EAVE_Y, MANSION_VAULT_RISE } from "./mansion-topology";

/** The authored hall envelope. All parts are above the actor or inset into
 * existing walls; furniture and playable floor keep their original colliders. */
export function moreauHallArchitecture() {
  const hall = new T.Group();
  hall.name = "Moreau 1927 · bóveda y orden arquitectónico";
  const limestone = pbr("stone", 0x7f887e, {
    side: T.DoubleSide,
    roughness: 0.94,
  });
  const bone = pbr("plaster", 0x89938d, {
    side: T.DoubleSide,
    roughness: 0.98,
  });
  const darkStone = pbr("stone", 0x404d4a);
  const bronze = pbr("brass", 0x776747, { roughness: 0.88 });
  const wood = pbr("wood", 0x3e332c, { roughness: 0.95 });
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
    MANSION_VAULT_EAVE_Y +
    MANSION_VAULT_RISE * Math.sqrt(Math.max(0, 1 - (x / 7.46) ** 2));

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
  add(roof, bone, 0, 0, 0).name = "mansion-vault-shell";

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
      block(
        side * 7.37,
        MANSION_VAULT_EAVE_Y - 0.08,
        z,
        0.27,
        0.22,
        0.36,
        limestone,
      );
      block(
        side * 7.36,
        MANSION_VAULT_EAVE_Y - 0.23,
        z,
        0.34,
        0.075,
        0.47,
        bronze,
      );
    }
  }
  // The longitudinal ridge and fine timber ribs make the vault legible from
  // the authored low cameras without extra lights or shadow passes.
  block(0, vaultY(0) - 0.03, 0, 0.14, 0.08, 14.75, wood);
  for (const x of [-4.8, -2.5, 2.5, 4.8]) {
    const y = vaultY(x) - 0.055;
    block(x, y, 0, 0.075, 0.075, 14.45, bronze);
  }

  // An inset arcade orders the tall side bays. Column shafts are nearly
  // flush with the existing wall plane (x=7.825); no walkable area is lost.
  for (const side of [-1, 1]) {
    // A plaster frieze makes the raised vault read as part of the wall.
    block(side * 7.58, 5.31, 0, 0.19, 0.72, 14.7, bone);
    block(side * 7.47, 5.08, 0, 0.08, 0.07, 14.7, bronze);
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
  // Original Veyr star-chart relief beneath the barrel vault. This is purely
  // decorative: no new collisions, interactions, lights or shadow casters.
  // Both stars and their connecting inlays are instanced (two draw calls).
  const chart = new T.Group();
  chart.name = "Veyr · carta astral de la bóveda";
  const starMaterial = new T.MeshStandardMaterial({
    color: 0x968469,
    emissive: 0x4c3320,
    emissiveIntensity: 0.14,
    metalness: 0.55,
    roughness: 0.73,
  });
  const lineMaterial = new T.MeshStandardMaterial({
    color: 0x655b4a,
    metalness: 0.48,
    roughness: 0.9,
  });
  const starPoints: T.Vector3[] = [];
  const chartEdges: Array<[T.Vector3, T.Vector3]> = [];
  const starPattern = [
    [-1.5, -0.55],
    [-0.72, 0.37],
    [0.05, -0.1],
    [0.88, 0.65],
    [1.58, -0.4],
  ] as const;
  for (const bayZ of [-5.9, -3.95, -2, -0.05, 1.9, 3.85, 5.8]) {
    const stars = starPattern.map(([x, offsetZ]) =>
      new T.Vector3(x, vaultY(x) - 0.12, bayZ + offsetZ),
    );
    starPoints.push(...stars);
    for (let i = 1; i < stars.length; i++) {
      chartEdges.push([stars[i - 1], stars[i]]);
    }
  }
  const pointGeometry = new T.OctahedronGeometry(0.042, 0);
  const points = new T.InstancedMesh(pointGeometry, starMaterial, starPoints.length);
  points.name = "veyr-vault-constellation-stars";
  points.castShadow = false;
  points.receiveShadow = false;
  const transform = new T.Object3D();
  for (let i = 0; i < starPoints.length; i++) {
    transform.position.copy(starPoints[i]);
    transform.quaternion.identity();
    transform.scale.setScalar(1);
    transform.updateMatrix();
    points.setMatrixAt(i, transform.matrix);
  }
  points.instanceMatrix.needsUpdate = true;
  chart.add(points);

  const segmentGeometry = new T.CylinderGeometry(0.009, 0.009, 1, 5);
  const inlays = new T.InstancedMesh(segmentGeometry, lineMaterial, chartEdges.length);
  inlays.name = "veyr-vault-constellation-lines";
  inlays.castShadow = false;
  inlays.receiveShadow = false;
  const axis = new T.Vector3(0, 1, 0);
  for (let i = 0; i < chartEdges.length; i++) {
    const [start, end] = chartEdges[i];
    const direction = new T.Vector3().subVectors(end, start);
    transform.position.copy(start).add(end).multiplyScalar(0.5);
    transform.quaternion.setFromUnitVectors(axis, direction.clone().normalize());
    transform.scale.set(1, direction.length(), 1);
    transform.updateMatrix();
    inlays.setMatrixAt(i, transform.matrix);
  }
  inlays.instanceMatrix.needsUpdate = true;
  chart.add(inlays);
  hall.add(chart);
  return hall;
}
