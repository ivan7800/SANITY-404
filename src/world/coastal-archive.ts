import * as T from "three";
import type { World } from "./scene";

/** The 537 CE dock and archive share a wet-stone silhouette, with no new shadow casters. */
export function decorateCoastalArchive(world: World) {
  const b = world.box.bind(world);
  const archive = world.room === 14;
  world.scene.background = new T.Color(archive ? "#172024" : "#15252a");
  world.scene.fog = new T.FogExp2(archive ? "#33464a" : "#3d5556", 0.039);
  for (const x of [-5.7, 5.7])
    for (const z of [-5.2, -1.8, 1.6, 5]) {
      b(x, 1.65, z, 0.56, 3.3, 0.56, 0x626964, true, "stone");
      b(x, 3.37, z, 0.85, 0.18, 0.85, 0x899084, false, "stone");
    }
  for (const x of [-7.05, 7.05]) {
    b(x, 0.012, 0, 1.15, 0.019, 14.6, 0x284349, false, "stone");
    for (const z of [-5.8, -3.9, -2, -0.1, 1.8, 3.7, 5.6])
      b(x, 0.025, z, 1.1, 0.01, 0.07, 0x5c7776, false, "stone");
  }
  if (!archive) {
    for (let z = -6; z <= 6; z += 0.65) {
      b(
        0,
        0.035,
        z,
        4.3,
        0.06,
        0.52,
        z % 1.3 === 0 ? 0x756953 : 0x625d4d,
        false,
        "wood",
      );
      for (const x of [-2.05, 2.05])
        b(x, 0.08, z, 0.05, 0.04, 0.52, 0x333a38, false, "brass");
    }
    for (const x of [-4.6, 4.6]) {
      b(x, 0.48, -3.1, 1.05, 0.96, 1.3, 0x5c594d, true, "wood");
      b(x, 1.04, -3.1, 1.17, 0.1, 1.4, 0x86806b, false, "wood");
    }
    b(0, 2.45, -7.63, 2.1, 2.2, 0.1, 0x293637, false, "stone");
    b(0, 3.58, -7.6, 3, 0.2, 0.14, 0x96a594, false, "stone");
    world.lamp(-4.8, 2.6, 3.2, 0xc8b790, 7);
  } else {
    for (const x of [-4.55, 4.55])
      for (const z of [-3.7, -0.6, 2.5]) {
        b(x, 1.25, z, 1.05, 2.5, 1.65, 0x4a514e, true, "wood");
        for (const y of [0.49, 1.23, 1.96]) {
          b(x * 0.88, y, z, 0.12, 0.12, 1.62, 0x9a9580, false, "wood");
          for (const offset of [-0.48, 0, 0.48])
            b(
              x * 0.88,
              y + 0.17,
              z + offset,
              0.14,
              0.3,
              0.23,
              0xb3a790,
              false,
              "plaster",
            );
        }
      }
    b(0, 0.68, -5.4, 2.25, 1.36, 1.1, 0x626962, true, "stone");
    b(0, 1.4, -5.4, 2.45, 0.12, 1.3, 0x9a9e8a, false, "stone");
    b(0, 1.47, -5.4, 1.05, 0.02, 0.74, 0xb9b39a, false, "plaster");
    world.lamp(0, 2.7, -4.4, 0xb2c4b3, 8);
  }
}
