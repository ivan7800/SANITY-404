import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import { character, type Rig } from "./character";

/** Samira's instruments follow the shared animated combat rig. */
export function samira(): T.Group {
  const actor = character(false, "medieval");
  actor.name = "Samira · astrónoma, año 783";
  const rig = actor.userData.rig as Rig;
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const indigo = pbr("fabric", 0x37465f);
  const linen = pbr("fabric", 0xbcb399);
  const bronze = pbr("brass", 0xa99870);
  const wood = pbr("wood", 0x514636);
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
  add(
    rig.hips,
    new T.CylinderGeometry(0.23, 0.34, 0.68, 10),
    indigo,
    0,
    0.14,
    0,
  );
  add(rig.hips, new T.BoxGeometry(0.31, 0.42, 0.05), linen, 0, 0.39, 0.19);
  for (const arm of [rig.leftArm, rig.rightArm])
    add(arm, new T.CylinderGeometry(0.11, 0.16, 0.36, 8), indigo, 0, -0.28, 0);
  add(rig.head, new T.CylinderGeometry(0.27, 0.2, 0.19, 10), linen, 0, 0.24, 0);
  add(rig.head, new T.BoxGeometry(0.4, 0.1, 0.17), indigo, 0, 0.3, 0.07);
  add(
    rig.rightArm,
    new T.CylinderGeometry(0.03, 0.04, 0.91, 8),
    wood,
    0,
    -0.64,
    0.16,
  );
  const instrument = add(
    rig.leftArm,
    new T.TorusGeometry(0.18, 0.022, 5, 20),
    bronze,
    0,
    -0.52,
    0.21,
  );
  instrument.rotation.x = 0.35;
  for (const joint of [rig.hips, rig.head, rig.leftArm, rig.rightArm])
    batchRigid(joint);
  actor.userData.historicalHero = "samira";
  return actor;
}
