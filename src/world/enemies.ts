import * as T from "three";
import { pbr } from "../render/materials";
import { character } from "./character";

export type EnemyKind = "shade" | "stalker" | "ritual" | "guardian";
export function enemyKindForRoom(room: number): EnemyKind {
  if (room === 5 || room === 6) return "stalker";
  if (room === 3) return "ritual";
  if (room === 7) return "guardian";
  return "shade";
}

export function createEnemy(kind: EnemyKind): T.Group {
  const root = character(true);
  if (kind === "shade") return root;
  const bone = pbr("stone", kind === "guardian" ? 0x77796a : 0x697a6b);
  const dark = pbr("leather", kind === "stalker" ? 0x243b33 : 0x382f35);
  const glow = new T.MeshStandardMaterial({
    color: kind === "ritual" ? 0x9c88a8 : 0x7dbaa5,
    emissive: kind === "ritual" ? 0x594471 : 0x2b6957,
    emissiveIntensity: 0.65,
    roughness: 0.45,
  });
  const mesh = (
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const rig = root.userData.rig as {
    leftArm: T.Group;
    rightArm: T.Group;
    head: T.Group;
    hips: T.Group;
  };
  if (kind === "stalker") {
    root.name = "El acechador de vidrio";
    root.scale.set(1.05, 1.18, 0.9);
    for (const side of [-1, 1]) {
      const spike = mesh(
        rig.hips,
        new T.ConeGeometry(0.12, 0.65, 6),
        dark,
        side * 0.27,
        0.53,
        -0.06,
      );
      spike.rotation.z = side * 0.48;
      rig[side < 0 ? "leftArm" : "rightArm"].scale.y = 1.16;
    }
    mesh(rig.head, new T.SphereGeometry(0.065, 10, 8), glow, 0, 0.12, 0.14);
  }
  if (kind === "ritual") {
    root.name = "La criatura de la liturgia vacía";
    root.scale.set(1.1, 1.16, 1.05);
    const halo = mesh(
      root,
      new T.TorusGeometry(0.5, 0.045, 6, 20),
      glow,
      0,
      2.03,
      0,
    );
    halo.rotation.x = 0.34;
    halo.name = "ritual-halo";
    for (const side of [-1, 1]) {
      const shard = mesh(
        rig.hips,
        new T.IcosahedronGeometry(0.18, 0),
        bone,
        side * 0.36,
        0.42,
        -0.03,
      );
      shard.scale.y = 1.5;
    }
  }
  if (kind === "guardian") {
    root.name = "Étienne · guardián del umbral";
    root.scale.set(1.35, 1.38, 1.23);
    for (const side of [-1, 1]) {
      mesh(
        rig.hips,
        new T.BoxGeometry(0.38, 0.21, 0.34),
        bone,
        side * 0.3,
        0.62,
        0,
      );
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.BoxGeometry(0.18, 0.32, 0.14),
        dark,
        0,
        -0.32,
        0.1,
      );
    }
    const core = mesh(
      rig.hips,
      new T.TorusGeometry(0.19, 0.045, 8, 24),
      glow,
      0,
      0.48,
      0.18,
    );
    core.name = "guardian-core";
    mesh(rig.head, new T.BoxGeometry(0.23, 0.15, 0.16), bone, 0, 0.19, 0.04);
  }
  root.userData.enemyKind = kind;
  return root;
}

export function animateEnemyStyle(
  root: T.Group,
  time: number,
  kind: EnemyKind,
  state: string,
  phase: number,
) {
  if (kind === "shade") return;
  root.traverse((object) => {
    if (object.name === "ritual-halo") {
      object.rotation.z = time * 0.38;
      object.position.y = 2.03 + Math.sin(time * 2.2) * 0.05;
    }
    if (object.name === "guardian-core" && object instanceof T.Mesh) {
      object.rotation.z = time * (phase > 1 ? 1.1 : 0.5);
      const material = object.material as T.MeshStandardMaterial;
      material.emissiveIntensity = state === "vulnerable" ? 1.8 : 0.55;
    }
  });
}
