import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import type { World } from "./scene";

function vaultedRoomRoof(
  world: World,
  id: string,
  edgeHeight: number,
  rise: number,
  color: number,
  ribColor: number,
) {
  const shell = pbr("stone", color, { side: T.DoubleSide });
  const rib = pbr("wood", ribColor);
  const vertices: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  const height = (x: number) =>
    edgeHeight + rise * Math.sqrt(Math.max(0, 1 - (x / 7.45) ** 2));
  for (let j = 0; j <= 16; j++)
    for (let i = 0; i <= 24; i++) {
      const x = -7.45 + (14.9 * i) / 24;
      vertices.push(x, height(x), -7.45 + (14.9 * j) / 16);
      uv.push(i / 3, j / 2);
    }
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 24; i++) {
      const a = j * 25 + i;
      indices.push(a, a + 25, a + 1, a + 1, a + 25, a + 26);
    }
  const roof = new T.BufferGeometry();
  roof.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  roof.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  roof.setIndex(indices);
  roof.computeVertexNormals();
  const mesh = new T.Mesh(roof, shell);
  mesh.name = `${id}-vault`;
  mesh.receiveShadow = true;
  world.scene.add(mesh);
  const ribs = new T.Group();
  for (const z of [-6, -3, 0, 3, 6]) {
    const points: T.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const x = -7.4 + (14.8 * i) / 16;
      points.push(new T.Vector3(x, height(x) - 0.045, z));
    }
    ribs.add(
      new T.Mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(points), 20, 0.065, 5),
        rib,
      ),
    );
  }
  world.scene.add(batchRigid(ribs));
}

/** Original architectural details. Broad center lanes remain clear for combat and camera. */
export function decoratePhase2Room(world: World) {
  const b = world.box.bind(world);
  const room = world.room;
  if (room === 1) {
    vaultedRoomRoof(world, "library", 4.58, 0.69, 0x615443, 0x8b7854);
    // Upper gallery, brass ladder and catalog drawers give the library a readable silhouette.
    for (const x of [-6.55, 6.55]) {
      b(x, 3.23, 0, 0.18, 0.16, 12.8, 0x76664e, false);
      for (const z of [-5, -3, -1, 1, 3, 5])
        b(x, 2.87, z, 0.08, 0.7, 0.08, 0x8a744e, false);
    }
    for (let i = 0; i < 8; i++)
      b(-6.05, 0.46 + i * 0.32, -0.4, 0.74, 0.055, 0.12, 0x89764d, false);
    for (const x of [-6.35, -5.75])
      b(x, 1.72, -0.4, 0.07, 2.8, 0.08, 0x514431, false);
    for (const x of [-3.5, 3.5])
      for (let i = 0; i < 5; i++)
        b(x, 1.1, -5.9 + i * 0.34, 0.78, 0.075, 0.24, 0x534334, false);
    world.lamp(0, 3.4, 0, 0xe0b779, 10);
  }
  if (room === 2) {
    // The crypt has a continuous stone vault and a procession of recessed
    // name niches. Both sit behind the existing wall and tomb colliders.
    vaultedRoomRoof(world, "crypt", 4.45, 0.62, 0x68695f, 0x969484);
    const bronze = pbr("brass", 0x645d49, { roughness: 0.9 });
    for (const z of [-6, -3, 0, 3, 6]) {
      for (const side of [-1, 1]) {
        b(side * 7.5, 2.3, z, 0.21, 3.9, 0.3, 0x706d5e, false);
        b(side * 7.39, 1.58, z + 0.82, 0.07, 2.35, 1.35, 0x303c39, false);
        b(side * 7.32, 2.83, z + 0.82, 0.08, 0.1, 1.48, 0x8b8875, false);
        for (let line = 0; line < 3; line++) {
          const mark = new T.Mesh(
            new T.BoxGeometry(0.012, 0.018, 0.65 - line * 0.1),
            bronze,
          );
          mark.position.set(side * 7.275, 1.65 - line * 0.11, z + 0.82);
          world.scene.add(mark);
        }
      }
    }
    world.lamp(0, 3.5, -3.8, 0xa4a091, 7);
  }
  if (room === 3) {
    // Ribbed vault and freestanding observatory keep the center traversable.
    for (const x of [-6.2, 6.2])
      for (const z of [-3.65, 3, 5.4]) {
        b(x, 2.5, z, 0.34, 4.9, 0.32, 0x646257);
        const rib = b(x * 0.5, 4.55, z, 6.2, 0.14, 0.16, 0x8b8471, false);
        rib.rotation.z = x < 0 ? -0.13 : 0.13;
      }
    const glass = new T.MeshStandardMaterial({
      color: 0x456e83,
      emissive: 0x193744,
      emissiveIntensity: 0.25,
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    for (const x of [-4.5, 0, 4.5]) {
      const pane = new T.Mesh(new T.PlaneGeometry(1.5, 2.2), glass);
      pane.position.set(x, 3.25, -7.38);
      world.scene.add(pane);
      b(x, 3.25, -7.47, 1.7, 2.4, 0.09, 0x393a38, false);
      b(x, 3.25, -7.34, 0.07, 2.2, 0.08, 0x8b7850, false);
    }
    world.lamp(0, 3.5, -3.8, 0xa8b7bd, 8);
  }
  if (room === 4) {
    // The ruined sanctuary still reads as one structure: a broken overhead
    // oculus joins the ring of existing columns while leaving combat space clear.
    const pale = pbr("stone", 0x858a78);
    const scar = pbr("stone", 0x4a665d);
    for (const [start, arc] of [
      [0.1, 1.18],
      [1.58, 1.06],
      [3.03, 1.27],
      [4.58, 1.35],
    ]) {
      const segment = new T.Mesh(
        new T.TorusGeometry(4.55, 0.2, 7, 22, arc),
        pale,
      );
      segment.rotation.x = Math.PI / 2;
      segment.rotateOnWorldAxis(new T.Vector3(0, 1, 0), start);
      segment.position.y = 4.03;
      segment.name = "ruin-oculus";
      world.scene.add(segment);
    }
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const x = Math.cos(angle) * 5;
      const z = Math.sin(angle) * 5;
      b(x, 3.45, z, 1.02, 0.18, 1.02, 0x8b8b79, false);
      const vein = new T.Mesh(
        new T.CylinderGeometry(0.018, 0.018, 1.2, 5),
        scar,
      );
      vein.rotation.z = angle * 0.38;
      vein.position.set(x, 2.65, z);
      world.scene.add(vein);
    }
    world.lamp(0, 3.9, -3, 0x72a797, 8);
  }
  if (room === 5) {
    vaultedRoomRoof(world, "archive", 4.41, 0.55, 0x55584f, 0x776247);
    world.scene.background = new T.Color("#111a21");
    for (const x of [-5.8, 5.8])
      for (const z of [-4, -2.5, 2, 3.5]) {
        b(x, 1.15, z, 1.25, 2.3, 1.1, 0x514435);
        for (let i = 0; i < 4; i++) {
          b(x, 0.42 + i * 0.47, z + 0.57, 0.9, 0.25, 0.05, 0x7b684c, false);
          b(x, 0.46 + i * 0.47, z + 0.62, 0.11, 0.07, 0.035, 0xb2a37a, false);
        }
      }
    // Three framed portraits acquire separate meshes for sanity events.
    for (let i = 0; i < 3; i++) {
      const x = -3.8 + i * 3.8;
      b(x, 2.6, -7.48, 1.32, 1.68, 0.14, 0x8f744c, false);
      const face = b(x, 2.62, -7.36, 1.07, 1.44, 0.08, 0x5e665e, false);
      face.name = `veyr-portrait-${i}`;
      face.userData.staticBox = false;
      const relief = new T.Group();
      relief.position.set(x, 2.72, -7.28);
      const skin = pbr("stone", [0x8b8876, 0x8b8178, 0x777d76][i]);
      const head = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), skin);
      head.scale.set(0.72, 1, 0.23);
      relief.add(head);
      const shoulders = new T.Mesh(
        new T.ConeGeometry(0.47, 0.6, 6),
        pbr("fabric", 0x41463e),
      );
      shoulders.position.y = -0.54;
      shoulders.rotation.z = Math.PI;
      relief.add(shoulders);
      world.scene.add(relief);
    }
    b(0, 0.025, 0, 3.1, 0.025, 12, 0x41382e, false);
    world.lamp(0, 3.3, -4, 0xffc98d, 10);
  }
  if (room === 6) {
    world.scene.background = new T.Color("#10212b");
    world.scene.fog = new T.FogExp2("#233439", 0.028);
    for (const x of [-5.7, 5.7])
      for (const z of [-4.5, -2.5, 3]) {
        b(x, 0.42, z, 1.45, 0.75, 1.5, 0x4a5046);
        b(x, 0.81, z, 1.54, 0.08, 1.6, 0x7a755e, false);
      }
    const iron = pbr("brass", 0x4d625d);
    const stem = pbr("wood", 0x355b48);
    const leaf = pbr("fabric", 0x3b785c);
    const trunks = new T.InstancedMesh(
      new T.CylinderGeometry(0.035, 0.07, 1.1, 6),
      stem,
      24,
    );
    const fronds = new T.InstancedMesh(new T.SphereGeometry(1, 7, 5), leaf, 72);
    const matrix = new T.Matrix4();
    const rotation = new T.Quaternion();
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (5.5 + (i % 3) * 0.22);
      const z = -5.1 + Math.floor(i / 2) * 0.92;
      matrix.makeTranslation(x, 1.25, z);
      trunks.setMatrixAt(i, matrix);
      for (let j = 0; j < 3; j++) {
        const angle = (j / 3) * Math.PI * 2 + i * 0.23;
        rotation.setFromAxisAngle(
          new T.Vector3(Math.cos(angle), 0, Math.sin(angle)),
          0.65,
        );
        matrix.compose(
          new T.Vector3(
            x + Math.cos(angle) * 0.17,
            2.02,
            z + Math.sin(angle) * 0.17,
          ),
          rotation,
          new T.Vector3(0.21, 0.67, 0.1),
        );
        fronds.setMatrixAt(i * 3 + j, matrix);
      }
    }
    world.scene.add(trunks, fronds);
    const glass = new T.MeshPhysicalMaterial({
      color: 0x7ca6a8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.05,
      depthWrite: false,
    });
    for (const x of [-6.8, -3.4, 0, 3.4, 6.8]) {
      b(x, 4.55, 0, 0.1, 0.16, 15, 0x4d625d, false);
      for (const z of [-5.5, 0, 5.5])
        b(x, 2.8, z, 0.09, 4.7, 0.09, 0x4d625d, false);
    }
    for (const z of [-7.35, 7.35]) {
      const pane = new T.Mesh(new T.PlaneGeometry(13.2, 3.5), glass);
      pane.position.set(0, 3, z);
      world.scene.add(pane);
    }
    const ribs = new T.InstancedMesh(
      new T.BoxGeometry(0.08, 0.08, 15),
      iron,
      5,
    );
    for (let i = 0; i < 5; i++) {
      matrix.makeTranslation(-6.8 + i * 3.4, 4.78, 0);
      ribs.setMatrixAt(i, matrix);
    }
    world.scene.add(ribs);
    world.lamp(0, 3.3, 0, 0x98c9bf, 8);
  }
  if (room === 7) {
    vaultedRoomRoof(world, "basement", 4.28, 0.34, 0x444940, 0x5e5d4d);
    world.scene.background = new T.Color("#111514");
    world.scene.fog = new T.FogExp2("#171d1c", 0.038);
    for (const x of [-5.7, 5.7])
      for (const z of [-4.5, -2, 1.8, 3.8]) {
        b(x, 1.2, z, 0.9, 2.4, 1, 0x555449);
        b(x, 2.43, z, 1.15, 0.12, 1.1, 0x837b67, false);
      }
    for (const x of [-3.7, 3.7])
      for (const z of [-3.8, 2.8]) {
        b(x, 0.7, z, 1.3, 1.4, 1.2, 0x514437);
        b(x, 1.45, z, 1.33, 0.09, 1.23, 0x987d55, false);
      }
    for (let i = -3; i <= 3; i++)
      b(i * 0.82, 0.018, -5.9, 0.05, 0.02, 2.4, 0x82765c, false);
    const ring = new T.Mesh(
      new T.TorusGeometry(1.8, 0.11, 8, 32),
      new T.MeshStandardMaterial({ color: 0x927f65, emissive: 0x203e37 }),
    );
    ring.position.set(0, 2.3, -7.2);
    ring.name = "threshold-ring";
    world.scene.add(ring);
    world.lamp(0, 3.2, -5.5, 0xbab28b, 7);
  }
}
