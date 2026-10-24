import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import { character, type Rig } from "./character";

/** Quarry workwear and hammer mounted to the shared combat skeleton. */
export function idris(): T.Group {
  const actor = character(false, "medieval");
  actor.name = "Idris · cantero, año 1092";
  const rig = actor.userData.rig as Rig;
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const linen = pbr("fabric", 0xaba38a);
  const leather = pbr("leather", 0x5b4939);
  const stone = pbr("stone", 0x8f9185);
  const wood = pbr("wood", 0x69543b);
  const add = (
    parent: T.Group,
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  add(rig.hips, new T.CylinderGeometry(0.24, 0.3, 0.57, 9), linen, 0, 0.2, 0);
  add(rig.hips, new T.BoxGeometry(0.4, 0.6, 0.05), leather, 0, 0.34, 0.2);
  add(rig.hips, new T.BoxGeometry(0.48, 0.09, 0.34), stone, 0, 0.25, 0);
  for (const arm of [rig.leftArm, rig.rightArm])
    add(arm, new T.CylinderGeometry(0.11, 0.17, 0.34, 8), linen, 0, -0.28, 0);
  add(rig.head, new T.BoxGeometry(0.42, 0.1, 0.28), leather, 0, 0.28, 0);
  add(
    rig.rightArm,
    new T.CylinderGeometry(0.029, 0.037, 0.73, 8),
    wood,
    0,
    -0.62,
    0.16,
  );
  add(rig.rightArm, new T.BoxGeometry(0.4, 0.18, 0.17), stone, 0, -0.94, 0.16);
  for (const joint of [rig.hips, rig.head, rig.leftArm, rig.rightArm])
    batchRigid(joint);
  actor.userData.historicalHero = "idris";
  return actor;
}
