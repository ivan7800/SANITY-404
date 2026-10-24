import * as T from "three";
import type { World } from "./scene";

/** Lit bed frames, cloth screens and a remedy cabinet; geometry is reused by batching. */
export function decorateRoadHospital(world: World) {
  const b = world.box.bind(world);
  const infirmary = world.room === 20;
  world.scene.background = new T.Color(infirmary ? "#222c29" : "#25312c");
  world.scene.fog = new T.FogExp2(infirmary ? "#3d554d" : "#405a50", 0.03);
  for (const side of [-1, 1]) {
    for (const z of [-3.6, 0, 3.6]) {
      b(side * 4.8, 0.42, z, 1.48, 0.23, 2.25, 0x54483a, true, "wood");
      b(side * 4.8, 0.6, z, 1.25, 0.15, 1.9, 0xa9a694, false, "fabric");
      b(side * 4.8, 0.8, z + 0.58, 1.12, 0.14, 0.54, 0x747f71, false, "fabric");
      for (const corner of [-0.55, 0.55])
        b(
          side * 4.8 + corner,
          0.32,
          z + 0.84,
          0.08,
          0.64,
          0.09,
          0x675740,
          false,
          "wood",
        );
      b(side * 6.4, 1.38, z, 0.075, 2.4, 2.55, 0x8d9988, false, "fabric");
    }
  }
  for (const x of [-3.2, 3.2]) {
    b(x, 1.45, -6.2, 0.1, 2.9, 0.12, 0x9e9b82, false, "wood");
    b(x, 2.85, -6.2, 2.1, 0.1, 0.12, 0x9e9b82, false, "wood");
  }
  if (infirmary) {
    b(-2.8, 0.66, -3.65, 1.5, 1.3, 1.0, 0x6f6047, true, "wood");
    b(-2.8, 1.35, -3.65, 1.55, 0.09, 1.02, 0xa69a7f, false, "wood");
    for (const x of [-0.3, 0, 0.3])
      b(-2.8 + x, 1.42, -3.65, 0.18, 0.04, 0.54, 0x76795e, false, "fabric");
    world.lamp(-2.8, 2.45, -3.5, 0xc8b98b, 6);
  } else {
    b(-3.2, 0.6, 1.75, 0.9, 1.2, 0.7, 0x6e634b, true, "wood");
    world.lamp(0, 2.8, 0, 0xc7aa77, 6);
  }
}
