import * as T from "three";
import type { World } from "./scene";

/** Two low-overdraw quarry spaces with a visible, persistent assembled arch. */
export function decorateQuarry(world: World, assembled: boolean) {
  const b = world.box.bind(world);
  const chamber = world.room === 18;
  world.scene.background = new T.Color(chamber ? "#1d2221" : "#252d2b");
  world.scene.fog = new T.FogExp2(chamber ? "#3b423c" : "#48534a", 0.032);
  for (const side of [-1, 1]) {
    for (const z of [-5, -1.7, 1.6, 4.9]) {
      b(side * 6.05, 1.45, z, 0.68, 2.9, 0.68, 0x696d62, true, "stone");
      b(side * 6.05, 3, z, 0.95, 0.2, 0.9, 0xa5a391, false, "stone");
    }
    b(side * 7.62, 1.6, 0, 0.15, 2.7, 14.5, 0x555f55, false, "stone");
    for (const z of [-5.4, -3.2, -1, 1.2, 3.4, 5.6])
      b(side * 7.5, 2.2, z, 0.13, 0.12, 1.7, 0x969989, false, "stone");
  }
  if (!chamber) {
    for (const x of [-4.5, 4.5]) {
      for (const z of [-4.2, -1, 2.2]) {
        b(x, 0.59, z, 1.3, 1.18, 1.75, 0x83867a, true, "stone");
        b(x, 1.24, z, 1.48, 0.11, 1.9, 0xaca996, false, "stone");
        for (const offset of [-0.42, 0.1, 0.39])
          b(x, 1.31, z + offset, 0.88, 0.018, 0.035, 0x494c46, false, "stone");
      }
    }
    // A single instanced scatter catches the light without many draw calls.
    const chips = new T.InstancedMesh(
      new T.IcosahedronGeometry(0.11, 0),
      new T.MeshStandardMaterial({ color: 0x8b9083, roughness: 1 }),
      24,
    );
    const matrix = new T.Matrix4();
    for (let i = 0; i < 24; i++) {
      matrix.makeScale(0.6 + (i % 3) * 0.2, 0.35, 0.7);
      matrix.setPosition(
        Math.sin(i * 2.4) * 3.4,
        0.08,
        Math.cos(i * 1.8) * 5.3,
      );
      chips.setMatrixAt(i, matrix);
    }
    chips.name = "esquirlas-de-cantera";
    world.scene.add(chips);
    world.lamp(-4.5, 2.7, 2.6, 0xd3bb8d, 7);
  } else {
    for (const x of [-4.35, 4.35]) {
      b(x, 0.69, -3, 1.25, 1.38, 1.1, 0x66685f, true, "stone");
      b(x, 1.42, -3, 1.4, 0.1, 1.25, 0x97978a, false, "stone");
    }
    const arch = new T.Group();
    arch.name = "quarry-assembled-arch";
    const stone = new T.MeshStandardMaterial({
      color: 0xafa791,
      roughness: 0.89,
    });
    for (const side of [-1, 1]) {
      const pier = new T.Mesh(new T.BoxGeometry(0.56, 2.55, 0.65), stone);
      pier.position.set(side * 1.3, 1.27, -6.1);
      arch.add(pier);
    }
    for (const [x, angle] of [
      [-0.73, -0.48],
      [0, 0],
      [0.73, 0.48],
    ] as const) {
      const stoneBlock = new T.Mesh(new T.BoxGeometry(0.88, 0.52, 0.68), stone);
      stoneBlock.position.set(x, x === 0 ? 3.11 : 2.93, -6.1);
      stoneBlock.rotation.z = angle;
      arch.add(stoneBlock);
    }
    arch.visible = assembled;
    world.scene.add(arch);
    b(0, 0.32, -5.9, 3.6, 0.64, 1.2, 0x424a43, false, "stone");
    world.lamp(0, 2.7, -4.8, 0xe0bb82, 7);
  }
}
