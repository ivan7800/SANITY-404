import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import { character, type Rig } from "./character";

/** The road healer carries a short staff and a satchel of remedies. */
export function oona(): T.Group {
  const actor = character(false, "medieval");
  actor.name = "Oona · curandera, año 1217";
  const rig = actor.userData.rig as Rig;
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const wool = pbr("fabric", 0x59685c);
  const linen = pbr("fabric", 0xb0a995);
  const leather = pbr("leather", 0x654a38);
  const wood = pbr("wood", 0x6f5943);
  const add = (
    parent: T.Group,
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const part = new T.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    parent.add(part);
  };
  add(rig.hips, new T.CylinderGeometry(0.25, 0.36, 0.73, 9), wool, 0, 0.17, 0);
  add(rig.hips, new T.BoxGeometry(0.31, 0.4, 0.14), leather, -0.28, 0.16, 0.18);
  add(rig.head, new T.ConeGeometry(0.34, 0.38, 9), linen, 0, 0.28, -0.04);
  for (const arm of [rig.leftArm, rig.rightArm])
    add(arm, new T.CylinderGeometry(0.1, 0.15, 0.35, 8), wool, 0, -0.27, 0);
  add(
    rig.rightArm,
    new T.CylinderGeometry(0.034, 0.04, 0.83, 7),
    wood,
    0,
    -0.7,
    0.16,
  );
  for (const joint of [rig.hips, rig.head, rig.leftArm, rig.rightArm])
    batchRigid(joint);
  actor.userData.historicalHero = "oona";
  return actor;
}
