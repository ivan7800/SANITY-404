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
      b(x, 1.55, z, 0.65, 3.1, 0.65, 0x858070, true, "stone");
      b(x, 3.16, z, 1, 0.25, 0.95, 0xa59a7e, false);
      b(x, 0.18, z, 0.98, 0.36, 0.98, 0x676459);
      // A narrow rebate and stone courses catch the grazing torch light.
      for (const y of [0.65, 1.42, 2.21, 2.87])
        b(x, y, z, 0.69, 0.055, 0.69, 0x625a4a, false, "stone");
      for (const side of [-1, 1])
        b(
          x + side * 0.25,
          1.55,
          z,
          0.035,
          2.65,
          0.04,
          0xb1a486,
          false,
          "stone",
        );
    }
    b(x, 4.24, -0.5, 0.5, 0.4, 12, 0x665f53, false);
  }
  // Processional mosaic, frieze and faded red standards tell this era apart
  // from the mansion without introducing objects in the combat corridor.
  for (const x of [-3.9, -2.6, 2.6, 3.9])
    for (const z of [-4.6, -3.2, -1.8, -0.4, 1, 2.4, 3.8])
      b(x, 0.024, z, 0.22, 0.018, 0.22, 0xa4865b, false, "stone");
  for (let x = -7; x <= 7; x += 0.8) {
    b(x, 3.72, -7.76, 0.45, 0.18, 0.045, 0x8f795b, false, "stone");
    b(x, 3.72, -7.7, 0.1, 0.32, 0.035, 0x5b4539, false, "stone");
  }
  for (const x of [-4.7, 4.7]) {
    b(x, 2.8, -7.59, 0.82, 1.8, 0.055, 0x703d32, false, "fabric");
    b(x, 3.75, -7.52, 0.97, 0.07, 0.08, 0xb18c54, false, "brass");
    b(x, 1.93, -7.51, 0.65, 0.07, 0.08, 0xb18c54, false, "brass");
  }
  for (const z of [-5.6, 0, 5.6]) {
    b(0, 0.015, z, 11.4, 0.025, 0.08, 0x8c846e, false);
  }
  // The three side testimonies form a readable route around the combat floor.
  // All masonry uses the world's static batching; no extra dynamic lights.
  for (const side of [-1, 1]) {
    for (const z of [-3.45, 3.45]) {
      b(side * 7.52, 1.45, z, 0.18, 2.7, 2.3, 0x514d43, false, "stone");
      b(side * 7.39, 2.75, z, 0.38, 0.17, 2.6, 0xa09579, false, "stone");
      b(side * 7.37, 0.28, z, 0.42, 0.35, 2.52, 0x81755f, false, "stone");
      for (const dz of [-0.75, -0.25, 0.25, 0.75])
        b(side * 7.4, 1.5, z + dz, 0.04, 1.52, 0.055, 0x9d8a69, false, "stone");
    }
  }
  // Worn tesserae show a processional band and a broken route to the altar.
  for (let i = -11; i <= 11; i++) {
    const z = i * 0.46;
    for (const x of [-1.15, -0.69, 0.69, 1.15])
      b(
        x,
        0.027,
        z,
        0.32,
        0.018,
        0.33,
        (i + Math.round(x * 10)) % 3 === 0 ? 0x805a48 : 0xada080,
        false,
        "stone",
      );
  }
  for (const [x, z] of [
    [-4.15, 3.45],
    [4.15, 3.45],
    [0, 1.35],
  ] as const) {
    b(x, 0.016, z, 1.15, 0.025, 1.15, 0x55473a, false, "stone");
    for (const offset of [-0.48, 0.48]) {
      b(x + offset, 0.02, z, 0.04, 0.03, 1.15, 0xb69d6f, false, "brass");
      b(x, 0.02, z + offset, 1.15, 0.03, 0.04, 0xb69d6f, false, "brass");
    }
  }
  const altar = b(0, 0.8, -5.3, 2.4, 1.6, 1.2, 0x706d62);
  altar.name = "altar-romano";
  b(0, 1.67, -5.3, 2.75, 0.16, 1.5, 0x9e957b, false);
  // Incised numerals on the altar face use geometry instead of a font asset.
  for (const x of [-0.88, -0.47, 0.08, 0.65])
    b(x, 0.94, -4.68, 0.04, 0.42, 0.028, 0x3e362d, false, "stone");
  for (const [x, tilt] of [
    [-0.23, -0.28],
    [-0.07, 0.28],
    [0.35, -0.42],
    [0.35, 0.42],
  ] as const) {
    const stroke = b(
      x,
      0.94,
      -4.68,
      0.04,
      0.43,
      0.028,
      0x3e362d,
      false,
      "stone",
    );
    stroke.rotation.z = tilt;
  }
  for (const x of [-1.25, 1.25]) {
    b(x, 1.1, -5.3, 0.13, 0.66, 1.35, 0x4e443a, false, "stone");
    b(x * 2.1, 0.56, -5.35, 0.63, 1.12, 0.63, 0x756650);
    b(x * 2.1, 1.18, -5.35, 0.8, 0.13, 0.8, 0xa4865f, false, "stone");
  }
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
  const sigilMaterial = new T.MeshStandardMaterial({
    color: 0x9e7145,
    emissive: 0x3c2817,
    emissiveIntensity: 0.32,
    roughness: 0.82,
  });
  for (const radius of [1.42, 2.08]) {
    const sigil = new T.Mesh(
      new T.TorusGeometry(radius, 0.023, 4, 48),
      sigilMaterial,
    );
    sigil.rotation.x = -Math.PI / 2;
    sigil.position.set(0, 0.04, -2.25);
    sigil.name = "roman-ritual-sigil";
    world.scene.add(sigil);
  }
  const flameGeometry = new T.ConeGeometry(0.12, 0.33, 7);
  const flameMaterial = new T.MeshStandardMaterial({
    color: 0xffbc75,
    emissive: 0xcc5e25,
    emissiveIntensity: 1.2,
  });
  for (const x of [-2.625, 2.625]) {
    const flame = new T.Mesh(flameGeometry, flameMaterial);
    flame.position.set(x, 1.42, -5.35);
    flame.name = "Llama ceremonial constante";
    world.scene.add(flame);
  }
  world.lamp(-4.5, 2.35, -4.5, 0xffa24d, 11);
  world.lamp(4.5, 2.35, 3.5, 0xffa24d, 11);
}
