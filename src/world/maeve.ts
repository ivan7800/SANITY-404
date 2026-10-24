import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import { character, type Rig } from "./character";

/** Maeve shares the combat rig but carries a short knife and a salt-stained mantle. */
export function maeve(): T.Group {
  const actor = character(false, "medieval");
  actor.name = "Maeve · escriba del archivo costero, año 537";
  const rig = actor.userData.rig as Rig;
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  rig.weapon.visible = false;
  const mantle = pbr("fabric", 0x41575b);
  const salt = pbr("fabric", 0x9eaa9d);
  const leather = pbr("leather", 0x4c4035);
  const iron = pbr("brass", 0x939c98);
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
    new T.CylinderGeometry(0.22, 0.32, 0.64, 10),
    mantle,
    0,
    0.15,
    0,
  );
  add(rig.hips, new T.BoxGeometry(0.41, 0.09, 0.34), leather, 0, 0.32, 0);
  add(rig.hips, new T.BoxGeometry(0.38, 0.2, 0.04), salt, 0, 0.59, 0.19);
  for (const side of [-1, 1]) {
    add(
      rig.hips,
      new T.BoxGeometry(0.17, 0.48, 0.06),
      mantle,
      side * 0.23,
      0.08,
      -0.14,
    );
    add(
      rig[side < 0 ? "leftArm" : "rightArm"],
      new T.CylinderGeometry(0.11, 0.15, 0.32, 8),
      mantle,
      0,
      -0.3,
      0,
    );
  }
  add(rig.head, new T.BoxGeometry(0.42, 0.08, 0.24), salt, 0, 0.26, 0);
  add(
    rig.rightArm,
    new T.BoxGeometry(0.08, 0.27, 0.1),
    leather,
    0,
    -0.54,
    0.13,
  );
  const blade = add(
    rig.rightArm,
    new T.ConeGeometry(0.07, 0.42, 4),
    iron,
    0,
    -0.89,
    0.13,
  );
  blade.rotation.z = Math.PI;
  for (const joint of [rig.hips, rig.head, rig.leftArm, rig.rightArm])
    batchRigid(joint);
  actor.userData.historicalHero = "maeve";
  return actor;
}
