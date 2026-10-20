import * as T from "three";
import { batchRigid } from "../render/batch";
import { character, type Rig } from "./character";

/** Original lightweight 189 CE character, sharing the animated base skeleton. */
export function luciusVarro(): T.Group {
  const hero = character(false, "roman");
  hero.name = "Lucius Varro · cartógrafo, año 189";
  const rig = hero.userData.rig as Rig;
  // Hide 1927 clothes, retain the articulating body and head.
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const bronze = new T.MeshStandardMaterial({
    color: 0x97774a,
    metalness: 0.66,
    roughness: 0.38,
  });
  const linen = new T.MeshStandardMaterial({
    color: 0x9a8265,
    roughness: 0.92,
  });
  const crimson = new T.MeshStandardMaterial({
    color: 0x673b32,
    roughness: 0.92,
  });
  const iron = new T.MeshStandardMaterial({
    color: 0x85837b,
    metalness: 0.72,
    roughness: 0.36,
  });
  const darkBronze = new T.MeshStandardMaterial({
    color: 0x584933,
    metalness: 0.48,
    roughness: 0.66,
  });
  const mesh = (
    parent: T.Group,
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    parent.add(object);
    return object;
  };
  // Layered lorica, travel cloak and fitted tunic remain on the animated rig.
  mesh(rig.hips, new T.BoxGeometry(0.43, 0.38, 0.3), bronze, 0, 0.47, 0);
  for (let i = 0; i < 4; i++)
    mesh(
      rig.hips,
      new T.BoxGeometry(0.46 - i * 0.015, 0.055, 0.34),
      i % 2 ? bronze : darkBronze,
      0,
      0.59 - i * 0.09,
      0.008,
    );
  mesh(rig.hips, new T.BoxGeometry(0.48, 0.045, 0.32), darkBronze, 0, 0.16, 0);
  mesh(rig.hips, new T.BoxGeometry(0.48, 0.12, 0.32), linen, 0, 0.21, 0);
  for (const side of [-1, 1]) {
    mesh(
      rig.hips,
      new T.BoxGeometry(0.12, 0.21, 0.23),
      crimson,
      side * 0.12,
      0.0,
      0.02,
    );
    mesh(
      rig.hips,
      new T.BoxGeometry(0.17, 0.09, 0.28),
      bronze,
      side * 0.21,
      0.63,
      -0.01,
    );
    mesh(
      rig.hips,
      new T.BoxGeometry(0.14, 0.25, 0.2),
      crimson,
      side * 0.16,
      -0.06,
      0.01,
    );
    mesh(
      side < 0 ? rig.leftLeg : rig.rightLeg,
      new T.BoxGeometry(0.12, 0.21, 0.16),
      linen,
      0,
      -0.2,
      0,
    );
  }
  rig.coatTails.children.forEach((child) => (child.visible = false));
  rig.coatTails.visible = true;
  for (const side of [-1, 1]) {
    const cloak = mesh(
      rig.coatTails,
      new T.BoxGeometry(0.19, 0.76, 0.055),
      crimson,
      side * 0.13,
      -0.23,
      -0.12,
    );
    cloak.rotation.z = side * -0.08;
  }
  const cap = mesh(
    rig.head,
    new T.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    bronze,
    0,
    0.17,
    0,
  );
  cap.scale.z = 0.83;
  mesh(rig.head, new T.BoxGeometry(0.08, 0.13, 0.3), crimson, 0, 0.33, -0.01);
  for (const side of [-1, 1])
    mesh(
      rig.head,
      new T.BoxGeometry(0.05, 0.09, 0.26),
      bronze,
      side * 0.17,
      -0.03,
      -0.01,
    );
  // The gladius is animated through the same right-arm combat pose.
  const blade = mesh(
    rig.rightArm,
    new T.BoxGeometry(0.055, 0.48, 0.075),
    iron,
    0,
    -0.67,
    0.48,
  );
  blade.rotation.x = Math.PI / 2;
  mesh(
    rig.rightArm,
    new T.BoxGeometry(0.13, 0.035, 0.11),
    bronze,
    0,
    -0.67,
    0.24,
  );
  for (const joint of [
    rig.hips,
    rig.head,
    rig.coatTails,
    rig.leftLeg,
    rig.rightLeg,
  ])
    batchRigid(joint);
  hero.userData.historicalHero = "lucius";
  return hero;
}
