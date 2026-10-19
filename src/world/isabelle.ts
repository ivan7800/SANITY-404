import * as T from "three";
import { character, type Rig } from "./character";

/** Low-poly 1348 scribe, reusing the existing combat/locomotion skeleton. */
export function isabelleDeMontfort(): T.Group {
  const actor = character();
  actor.name = "Isabelle de Montfort · copista, año 1348";
  const rig = actor.userData.rig as Rig;
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const robe = new T.MeshStandardMaterial({color: 0x534b56, roughness: 0.95});
  const linen = new T.MeshStandardMaterial({color: 0xc4ae94, roughness: 0.95});
  const wood = new T.MeshStandardMaterial({color: 0x594436, roughness: 0.85});
  const add = (parent: T.Group, geometry: T.BufferGeometry, material: T.Material, x: number, y: number, z: number) => {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  // A tapering tunic and two animated side sleeves evoke a medieval scholar.
  add(rig.hips, new T.CylinderGeometry(0.22, 0.32, 0.68, 10), robe, 0, 0.17, 0);
  add(rig.hips, new T.CylinderGeometry(0.11, 0.17, 0.18, 10), linen, 0, 0.70, 0);
  for (const arm of [rig.leftArm, rig.rightArm]) {
    add(arm, new T.CylinderGeometry(0.105, 0.17, 0.38, 8), robe, 0, -0.34, 0);
    add(arm, new T.CylinderGeometry(0.13, 0.14, 0.055, 8), linen, 0, -0.55, 0);
  }
  // The hood follows the head's rotation rather than the torso.
  add(rig.head, new T.SphereGeometry(0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.63), robe, 0, 0.13, -0.04);
  add(rig.head, new T.BoxGeometry(0.3, 0.085, 0.075), linen, 0, 0.28, -0.02);
  // A compact writing staff replaces the modern character's weapon.
  const staff = add(rig.rightArm, new T.CylinderGeometry(0.021, 0.032, 0.9, 8), wood, 0, -0.66, 0.37);
  staff.rotation.x = Math.PI / 2;
  actor.userData.historicalHero = "isabelle";
  return actor;
}
