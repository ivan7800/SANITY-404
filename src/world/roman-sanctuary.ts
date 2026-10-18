import * as T from "three";
import type { World } from "./scene";

/** A traversable Roman sanctuary, made from lightweight native geometry. */
export function decorateRomanSanctuary(world: World) {
  const b = world.box.bind(world);
  world.scene.background = new T.Color("#191b1a");
  world.scene.fog = new T.FogExp2("#34332c", 0.035);
  // Freestanding columns and a ruined nave leave the centre clear for combat.
  for (const x of [-5.7, 5.7]) {
    for (const z of [-5, -2, 1, 4]) {
      b(x, 1.55, z, 0.65, 3.1, 0.65, 0x858070);
      b(x, 3.16, z, 1, 0.25, 0.95, 0xa59a7e, false);
      b(x, 0.18, z, 0.98, 0.36, 0.98, 0x676459);
    }
    b(x, 4.24, -0.5, 0.5, 0.4, 12, 0x665f53, false);
  }
  for (const z of [-5.6, 0, 5.6]) {
    b(0, 0.015, z, 11.4, 0.025, 0.08, 0x8c846e, false);
  }
  const altar = b(0, 0.8, -5.3, 2.4, 1.6, 1.2, 0x706d62);
  altar.name = "altar-romano";
  b(0, 1.67, -5.3, 2.75, 0.16, 1.5, 0x9e957b, false);
  // A broken arch frames the entrance, with a distinctive bronze oculus.
  b(-2.1, 2.3, 6.45, 0.75, 4.4, 0.7, 0x7a7568, false);
  b(2.1, 2.3, 6.45, 0.75, 4.4, 0.7, 0x7a7568, false);
  b(0, 4.42, 6.45, 5.05, 0.45, 0.78, 0x898171, false);
  const ring = new T.Mesh(
    new T.TorusGeometry(0.77, 0.075, 8, 32),
    new T.MeshStandardMaterial({
      color: 0x937850,
      metalness: 0.55,
      roughness: 0.35,
      emissive: 0x312719,
      emissiveIntensity: 0.25,
    }),
  );
  ring.position.set(0, 2.7, -7.42);
  world.scene.add(ring);
  world.lamp(-4.5, 2.35, -4.5, 0xffa24d, 11);
  world.lamp(4.5, 2.35, 3.5, 0xffa24d, 11);
}
