import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import type { World } from "./scene";

/** Two connected 312 CE rooms built from batched masonry and shared surfaces. */
export function decorateMosaicWorkshop(world: World, restored: boolean) {
  const b = world.box.bind(world);
  const kiln = world.room === 12;
  world.scene.background = new T.Color(kiln ? "#241d1a" : "#252522");
  world.scene.fog = new T.FogExp2(kiln ? "#4b352b" : "#454039", 0.027);
  // A restrained palette makes the missing face in the central pavement legible.
  for (const x of [-5.8, 5.8]) {
    for (const z of [-5.1, -1.7, 1.7, 5.1]) {
      b(x, 1.45, z, 0.56, 2.9, 0.56, 0x807767, true, "stone");
      b(x, 3.02, z, 0.85, 0.24, 0.82, 0xb1a286, false, "stone");
      b(x, 0.18, z, 0.86, 0.36, 0.86, 0x60584c, false, "stone");
    }
  }
  for (let row = -5; row <= 5; row++) {
    for (let col = -4; col <= 4; col++) {
      const x = col * 0.45;
      const z = row * 0.45;
      const missing = Math.abs(col) <= 1 && Math.abs(row) <= 2;
      if (missing) continue;
      const color =
        (row + col) % 4 === 0
          ? 0x9d684c
          : (row - col) % 3 === 0
            ? 0x514f4a
            : 0xb9a681;
      b(x, 0.026, z, 0.39, 0.018, 0.39, color, false, "stone");
    }
  }
  for (const side of [-1, 1]) {
    b(side * 7.65, 2.2, 0, 0.12, 3.3, 10.8, 0x675f53, false, "stone");
    for (const z of [-4.2, -2.1, 0, 2.1, 4.2]) {
      b(side * 7.56, 2.7, z, 0.05, 0.9, 0.48, 0xb9a282, false, "stone");
      b(side * 7.54, 1.95, z, 0.05, 0.08, 0.68, 0x503e35, false, "stone");
    }
  }
  if (kiln) {
    const face = new T.Group();
    face.name = "mosaic-restored-face";
    const colors = [
      pbr("stone", 0xb9a681),
      pbr("stone", 0x9d684c),
      pbr("stone", 0x424441),
    ];
    for (let row = -2; row <= 2; row++)
      for (let col = -1; col <= 1; col++) {
        const material =
          row === -1 && col === 0
            ? colors[1]
            : Math.abs(col) === 1 && row >= 0
              ? colors[2]
              : colors[0];
        const tile = new T.Mesh(new T.BoxGeometry(0.39, 0.018, 0.39), material);
        tile.position.set(col * 0.45, 0.027, row * 0.45);
        face.add(tile);
      }
    batchRigid(face);
    face.visible = restored;
    world.scene.add(face);
    b(0, 1.45, -6.4, 3.15, 2.9, 1.5, 0x5b4639, true, "stone");
    b(0, 1.42, -5.59, 1.7, 1.65, 0.06, 0x211c1a, false, "stone");
    for (const x of [-1.25, 1.25])
      b(x, 1.43, -5.58, 0.2, 2.2, 0.14, 0x9b6b4b, false, "stone");
    b(0, 2.6, -5.58, 2.6, 0.18, 0.16, 0xb27950, false, "stone");
    for (const x of [-4.4, 4.4]) {
      b(x, 0.54, -3.3, 1.1, 1.08, 1.5, 0x695142, true, "stone");
      b(x, 1.12, -3.3, 1.3, 0.12, 1.7, 0xb29a78, false, "stone");
    }
    world.lamp(0, 2.45, -5.2, 0xff8349, 9);
  } else {
    for (const x of [-4.5, 4.5]) {
      b(x, 0.56, -3.3, 1.25, 1.12, 1.6, 0x655e50, true, "stone");
      b(x, 1.17, -3.3, 1.45, 0.1, 1.8, 0xaaa080, false, "stone");
      for (const z of [-3.7, -3.25, -2.8])
        b(
          x,
          1.24,
          z,
          0.46,
          0.03,
          0.31,
          x < 0 ? 0x955946 : 0x658071,
          false,
          "stone",
        );
    }
    world.lamp(-4.5, 2.35, -3.3, 0xf2af72, 7);
  }
}
