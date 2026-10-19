import * as T from "three";
import type { World } from "./scene";

/** Two small, traversable 1348 environments; no texture downloads required. */
export function decorateMedievalAbbey(world: World) {
  const b = world.box.bind(world);
  const cloister = world.room === 9;
  world.scene.background = new T.Color(cloister ? "#1a2221" : "#1a1a20");
  world.scene.fog = new T.FogExp2(cloister ? "#333c38" : "#302b33", 0.035);
  const stone = cloister ? 0x666960 : 0x5b5b60;
  // Slim columns and vaulted bays, leaving the central passage clear.
  for (const x of [-5.9, 5.9]) {
    for (const z of [-5.2, -2.6, 0, 2.6, 5.2]) {
      b(x, 1.55, z, 0.48, 3.1, 0.48, stone);
      b(x, 3.16, z, 0.92, 0.2, 0.85, 0x969489, false);
    }
    b(x, 4.1, 0, 0.55, 0.28, 13, 0x494846, false);
  }
  for (const z of [-5.2, 0, 5.2]) {
    b(0, 4.14, z, 11.9, 0.28, 0.45, 0x716d65, false);
  }
  if (cloister) {
    for (const x of [-4, 4]) {
      const bed = b(x, 0.37, 0.5, 1.15, 0.74, 2.0, 0x454c43);
      bed.name = "abbey-planter";
      b(x, 0.78, 0.5, 1.18, 0.08, 2.03, 0x4d6959, false);
    }
    b(0, 0.18, -6.6, 2.4, 0.36, 1.2, 0x747168);
    b(0, 1.1, -6.6, 0.22, 1.6, 0.19, 0x9f9277, false);
    b(0, 1.55, -6.6, 1.2, 0.21, 0.2, 0x9f9277, false);
    world.lamp(-5, 2.8, -4.5, 0xe6aa78, 8);
    world.lamp(5, 2.8, 4.5, 0xe6aa78, 8);
  } else {
    for (const x of [-4.2, 4.2]) {
      for (const z of [-4.5, -1.5, 1.5]) {
        b(x, 1.1, z, 1.1, 2.2, 1.35, 0x443e38);
        for (const y of [0.7, 1.3, 1.9]) {
          b(x * 0.87, y, z, 0.1, 0.12, 1.2, 0x97866e, false);
        }
      }
    }
    // The codex pedestal is off the central route and stays reachable.
    b(0, 0.65, -5.6, 2.1, 1.3, 1, 0x726959);
    b(0, 1.35, -5.6, 2.4, 0.14, 1.24, 0xa99a7b, false);
    const glyph = new T.Mesh(
      new T.TorusGeometry(0.42, 0.045, 6, 28),
      new T.MeshStandardMaterial({color: 0xb8a177, emissive: 0x463725, emissiveIntensity: 0.5}),
    );
    glyph.position.set(0, 2.3, -7.38);
    world.scene.add(glyph);
    world.lamp(-4.8, 2.75, -4, 0xffae74, 8);
    world.lamp(4.8, 2.75, -4, 0xffae74, 8);
  }
}
