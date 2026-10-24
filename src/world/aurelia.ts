import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import { character, type Rig } from "./character";

/** Aurelia uses the shared locomotion and combat rig with workshop clothing. */
export function aurelia(): T.Group {
  const actor = character(false, "roman");
  actor.name = "Aurelia · artesana del mosaico, año 312";
  const rig = actor.userData.rig as Rig;
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const linen = pbr("fabric", 0xc3aa83);
  const apron = pbr("leather", 0x66513e);
  const pigment = pbr("stone", 0x9d5140);
  const wood = pbr("wood", 0x604936);
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
  add(rig.hips, new T.CylinderGeometry(0.23, 0.3, 0.57, 10), linen, 0, 0.18, 0);
  add(rig.hips, new T.BoxGeometry(0.34, 0.59, 0.055), apron, 0, 0.32, 0.19);
  add(rig.hips, new T.BoxGeometry(0.3, 0.09, 0.06), pigment, 0, 0.1, 0.23);
  for (const arm of [rig.leftArm, rig.rightArm])
    add(arm, new T.CylinderGeometry(0.13, 0.15, 0.21, 8), linen, 0, -0.2, 0);
  // The tessera hammer moves with her attack arm.
  add(
    rig.rightArm,
    new T.CylinderGeometry(0.025, 0.03, 0.64, 7),
    wood,
    0,
    -0.56,
    0.18,
  );
  add(
    rig.rightArm,
    new T.BoxGeometry(0.32, 0.13, 0.16),
    pigment,
    0,
    -0.86,
    0.18,
  );
  for (const joint of [rig.hips, rig.leftArm, rig.rightArm]) batchRigid(joint);
  actor.userData.historicalHero = "aurelia";
  return actor;
}
