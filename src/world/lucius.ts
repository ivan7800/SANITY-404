import * as T from "three";
import { character, type Rig } from "./character";

/** Original lightweight 189 CE character, sharing the animated base skeleton. */
export function luciusVarro(): T.Group {
  const hero = character();
  hero.name = "Lucius Varro · cartógrafo, año 189";
  const rig = hero.userData.rig as Rig;
  // Hide 1927 clothes, retain the articulating body and head.
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const bronze = new T.MeshStandardMaterial({ color: 0x97774a, metalness: 0.66, roughness: 0.38 });
  const linen = new T.MeshStandardMaterial({ color: 0x9a8265, roughness: 0.92 });
  const crimson = new T.MeshStandardMaterial({ color: 0x673b32, roughness: 0.92 });
  const iron = new T.MeshStandardMaterial({ color: 0x85837b, metalness: 0.72, roughness: 0.36 });
  const mesh = (parent: T.Group, geometry: T.BufferGeometry, material: T.Material,
    x: number, y: number, z: number) => {
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    parent.add(object);
    return object;
  };
  // Distinctive square military cuirass and crested travel helmet.
  mesh(rig.hips, new T.BoxGeometry(0.43, 0.38, 0.3), bronze, 0, 0.47, 0);
  mesh(rig.hips, new T.BoxGeometry(0.48, 0.12, 0.32), linen, 0, 0.21, 0);
  for (const side of [-1, 1]) {
    mesh(rig.hips, new T.BoxGeometry(0.12, 0.21, 0.23), crimson, side * 0.12, 0.0, 0.02);
    mesh(rig.hips, new T.BoxGeometry(0.17, 0.09, 0.28), bronze, side * 0.21, 0.63, -0.01);
  }
  const cap = mesh(rig.head, new T.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), bronze, 0, 0.17, 0);
  cap.scale.z = 0.83;
  mesh(rig.head, new T.BoxGeometry(0.08, 0.13, 0.3), crimson, 0, 0.33, -0.01);
  // The gladius is animated through the same right-arm combat pose.
  const blade = mesh(rig.rightArm, new T.BoxGeometry(0.055, 0.48, 0.075), iron, 0, -0.67, 0.48);
  blade.rotation.x = Math.PI / 2;
  mesh(rig.rightArm, new T.BoxGeometry(0.13, 0.035, 0.11), bronze, 0, -0.67, 0.24);
  hero.userData.historicalHero = "lucius";
  return hero;
}
