import * as T from "three";
import { pbr } from "../render/materials";
import { character, type Rig } from "./character";

export type EnemyKind =
  | "shade"
  | "guest"
  | "widow"
  | "crawler"
  | "wrongReflection"
  | "nameRoot"
  | "stalker"
  | "ritual"
  | "guardian"
  | "centurion"
  | "plagueScribe"
  | "mosaic"
  | "drowned"
  | "blindWatcher"
  | "stoneworker"
  | "wardKeeper"
  | "typesetter"
  | "portrait"
  | "automaton"
  | "developerShade";
export function enemyKindForRoom(room: number): EnemyKind {
  if (room === 21 || room === 22) return "typesetter";
  if (room === 23 || room === 24) return "portrait";
  if (room === 25 || room === 26) return "automaton";
  if (room === 27 || room === 28) return "developerShade";
  if (room === 19 || room === 20) return "wardKeeper";
  if (room === 17 || room === 18) return "stoneworker";
  if (room === 15 || room === 16) return "blindWatcher";
  if (room === 13 || room === 14) return "drowned";
  if (room === 11 || room === 12) return "mosaic";
  if (room === 9 || room === 10) return "plagueScribe";
  if (room === 8) return "centurion";
  if (room === 5 || room === 6) return "stalker";
  if (room === 3) return "ritual";
  if (room === 7) return "guardian";
  return "shade";
}

export function createEnemy(kind: EnemyKind): T.Group {
  const root = character(true);
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
  const rig = root.userData.rig as Rig;
  if (kind === "guest") {
    root.name = "El Huésped Inmóvil";
    root.scale.set(1.04, 1.32, 0.85);
    const mourning = pbr("fabric", 0x262e2b);
    const ivory = pbr("stone", 0x999c8c);
    mesh(
      rig.head,
      new T.SphereGeometry(0.18, 10, 8),
      mourning,
      0,
      0.1,
      0.13,
    ).scale.z = 0.22;
    for (const side of [-1, 1]) {
      mesh(
        rig.hips,
        new T.BoxGeometry(0.13, 0.61, 0.06),
        ivory,
        side * 0.25,
        0.39,
        -0.03,
      );
      for (let i = 0; i < 3; i++)
        mesh(
          rig[side < 0 ? "leftArm" : "rightArm"],
          new T.ConeGeometry(0.025, 0.22, 5),
          ivory,
          (i - 1) * 0.045,
          -0.8,
          0.04,
        ).rotation.z = Math.PI;
    }
    mesh(
      rig.hips,
      new T.CylinderGeometry(0.19, 0.32, 0.82, 9),
      mourning,
      0,
      0.07,
      -0.04,
    );
    // An asymmetrical, closed mourning coat conceals the torso while one
    // overlong hand remains recognisable at the edge of the camera frame.
    const lapel = mesh(
      rig.hips,
      new T.PlaneGeometry(0.31, 0.83),
      mourning,
      -0.08,
      0.33,
      0.185,
    );
    lapel.rotation.z = -0.17;
    const neck = mesh(
      rig.hips,
      new T.CylinderGeometry(0.055, 0.09, 0.28, 8),
      ivory,
      0.03,
      0.73,
      0,
    );
    neck.rotation.z = 0.26;
    for (const side of [-1, 1]) {
      const finger = mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.CapsuleGeometry(0.026, 0.24, 3, 5),
        ivory,
        side * 0.06,
        -0.83,
        0.09,
      );
      finger.rotation.z = side * 0.16;
    }
    rig.rightArm.scale.y = 1.25;
  }
  if (kind === "widow") {
    root.name = "La Viuda del Rellano";
    root.scale.set(1.08, 1.28, 1.04);
    const veil = pbr("fabric", 0x36383f);
    const pearl = pbr("stone", 0xafa79d);
    mesh(
      rig.hips,
      new T.ConeGeometry(0.48, 1.12, 10),
      veil,
      0,
      -0.25,
      0,
    ).rotation.z = Math.PI;
    mesh(rig.head, new T.ConeGeometry(0.29, 0.48, 10), veil, 0, 0.19, -0.07);
    mesh(rig.head, new T.BoxGeometry(0.35, 0.32, 0.03), veil, 0, 0.06, 0.18);
    for (const side of [-1, 1]) {
      mesh(
        rig.hips,
        new T.BoxGeometry(0.07, 0.76, 0.06),
        pearl,
        side * 0.16,
        0.38,
        0.2,
      );
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.ConeGeometry(0.16, 0.6, 8),
        veil,
        0,
        -0.32,
        0,
      ).rotation.z = Math.PI;
    }
    const hem = new T.Group();
    hem.name = "widow-hem";
    hem.position.set(0, -0.2, 0);
    rig.hips.add(hem);
    for (let i = 0; i < 6; i++) {
      const panel = mesh(
        hem,
        new T.PlaneGeometry(0.34, 0.88),
        veil,
        0,
        -0.37,
        0,
      );
      panel.material = (veil as T.MeshStandardMaterial).clone();
      (panel.material as T.MeshStandardMaterial).side = T.DoubleSide;
      panel.position.x = Math.sin((i * Math.PI) / 3) * 0.29;
      panel.position.z = Math.cos((i * Math.PI) / 3) * 0.29;
      panel.rotation.y = (i * Math.PI) / 3;
      panel.rotation.z = Math.sin(i * 2) * 0.1;
      panel.name = `widow-panel-${i}`;
    }
    const veilTail = mesh(
      rig.head,
      new T.PlaneGeometry(0.59, 0.84),
      veil,
      0,
      -0.22,
      -0.17,
    );
    (veilTail.material as T.MeshStandardMaterial).side = T.DoubleSide;
    veilTail.name = "widow-veil";
  }
  if (kind === "crawler") {
    root.name = "El Reptante";
    root.scale.set(1.32, 0.76, 1.35);
    const sinew = pbr("leather", 0x604c43);
    const spine = pbr("stone", 0xa4977f);
    for (let i = 0; i < 5; i++)
      mesh(
        rig.hips,
        new T.ConeGeometry(0.1, 0.3, 6),
        spine,
        0,
        0.35 + i * 0.07,
        -0.21 + i * 0.1,
      ).rotation.x = -0.6;
    for (const side of [-1, 1]) {
      rig[side < 0 ? "leftArm" : "rightArm"].scale.y = 1.5;
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.CapsuleGeometry(0.06, 0.27, 4, 7),
        sinew,
        0,
        -0.61,
        0.12,
      );
      mesh(
        rig.head,
        new T.SphereGeometry(0.045, 7, 5),
        glow,
        side * 0.095,
        0.08,
        0.18,
      );
    }
    // Sinew bridges and four planted extremities make the low silhouette
    // readable even when the rig's human coat is hidden.
    rig.coat.visible = false;
    rig.coatTails.visible = false;
    const rib = mesh(
      rig.hips,
      new T.CapsuleGeometry(0.22, 0.52, 4, 8),
      sinew,
      0,
      0.31,
      -0.18,
    );
    rib.rotation.x = 1.12;
    for (const side of [-1, 1]) {
      const claw = mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.ConeGeometry(0.075, 0.3, 5),
        spine,
        0,
        -0.89,
        0.2,
      );
      claw.rotation.x = 1.1;
      mesh(
        rig[side < 0 ? "leftLeg" : "rightLeg"],
        new T.CapsuleGeometry(0.075, 0.34, 3, 6),
        sinew,
        0,
        -0.53,
        -0.15,
      );
    }
  }
  if (kind === "wrongReflection") {
    root.name = "El Reflejo Equivocado";
    root.scale.set(0.98, 1.15, 0.78);
    const silver = pbr("brass", 0x8b9d9e);
    const mirror = new T.MeshStandardMaterial({
      color: 0x202c31,
      metalness: 0.78,
      roughness: 0.18,
      emissive: 0x17343c,
      emissiveIntensity: 0.25,
    });
    mesh(rig.hips, new T.BoxGeometry(0.46, 0.78, 0.08), mirror, 0, 0.33, 0.12);
    for (const side of [-1, 1]) {
      mesh(
        rig.hips,
        new T.BoxGeometry(0.055, 0.91, 0.08),
        silver,
        side * 0.26,
        0.31,
        0.16,
      );
      mesh(
        rig.head,
        new T.BoxGeometry(0.055, 0.07, 0.025),
        glow,
        -side * 0.1,
        0.06,
        0.2,
      );
    }
    mesh(rig.head, new T.BoxGeometry(0.54, 0.07, 0.09), silver, 0, 0.33, 0.15);
    rig.leftArm.rotation.y = Math.PI;
    const glass = mesh(
      rig.head,
      new T.PlaneGeometry(0.42, 0.45),
      mirror,
      0,
      0.11,
      0.22,
    );
    glass.name = "reflection-face";
    mesh(
      rig.hips,
      new T.TorusGeometry(0.28, 0.026, 5, 20),
      silver,
      0,
      0.46,
      0.17,
    ).scale.y = 1.4;
  }
  if (kind === "nameRoot") {
    root.name = "La Raíz de los Nombres";
    root.scale.set(1.42, 1.5, 1.27);
    const bark = pbr("wood", 0x463d32);
    const runes = pbr("stone", 0xa8a28b);
    mesh(rig.hips, new T.CylinderGeometry(0.21, 0.4, 0.96, 9), bark, 0, 0.2, 0);
    for (const side of [-1, 1]) {
      const branch = mesh(
        rig.hips,
        new T.ConeGeometry(0.14, 0.86, 7),
        bark,
        side * 0.34,
        0.66,
        0,
      );
      branch.rotation.z = side * -0.5;
      mesh(
        rig[side < 0 ? "leftLeg" : "rightLeg"],
        new T.ConeGeometry(0.17, 0.7, 7),
        bark,
        0,
        -0.32,
        0,
      ).rotation.z = Math.PI;
    }
    for (let i = 0; i < 5; i++) {
      const mark = mesh(
        rig.hips,
        new T.BoxGeometry(0.08, 0.04, 0.025),
        runes,
        0,
        0.54 - i * 0.14,
        0.24,
      );
      mark.rotation.z = i * 0.27;
    }
    const heart = mesh(
      rig.hips,
      new T.IcosahedronGeometry(0.15, 1),
      glow,
      0,
      0.32,
      0.3,
    );
    heart.name = "name-root-heart";
    rig.coat.visible = false;
    rig.coatTails.visible = false;
    for (let i = 0; i < 5; i++) {
      const pivot = new T.Group();
      pivot.name = `name-root-branch-${i}`;
      pivot.position.set(
        Math.sin(i * 2.4) * 0.17,
        0.3 + i * 0.11,
        Math.cos(i * 2.4) * 0.12,
      );
      rig.hips.add(pivot);
      const length = 0.7 + i * 0.14;
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(0, 0, 0),
        new T.Vector3(Math.sin(i * 2.4) * 0.33, length * 0.4, -0.08),
        new T.Vector3(Math.sin(i * 2.4) * 0.55, length, -0.19),
      ]);
      mesh(
        pivot,
        new T.TubeGeometry(curve, 8, 0.08 - i * 0.006, 5, false),
        bark,
        0,
        0,
        0,
      );
      const tag = mesh(
        pivot,
        new T.PlaneGeometry(0.13, 0.21),
        runes,
        Math.sin(i * 2.4) * 0.55,
        length,
        -0.17,
      );
      tag.name = `name-root-tag-${i}`;
    }
  }
  if (kind === "shade") {
    root.name = "La sombra de los retratos";
    root.scale.set(1.02, 1.18, 0.91);
    const velvet = pbr("fabric", 0x303b39);
    const lining = pbr("fabric", 0x596055);
    // A torn mourning coat and hidden face distinguish the vestibule threat
    // from the historical human opponents while keeping the articulated rig.
    for (const side of [-1, 1]) {
      const shoulder = mesh(
        rig.hips,
        new T.ConeGeometry(0.19, 0.48, 8),
        velvet,
        side * 0.28,
        0.49,
        -0.05,
      );
      shoulder.rotation.z = side * 0.65;
      const cuff = mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.CylinderGeometry(0.085, 0.045, 0.22, 8),
        lining,
        0,
        -0.52,
        0.01,
      );
      cuff.name = "shade-cuff";
      mesh(
        rig.head,
        new T.SphereGeometry(0.029, 8, 6),
        glow,
        side * 0.095,
        0.11,
        0.19,
      );
    }
    const mask = mesh(
      rig.head,
      new T.SphereGeometry(0.18, 12, 8),
      velvet,
      0,
      0.09,
      0.145,
    );
    mask.scale.set(1.05, 1.22, 0.19);
    for (const x of [-0.16, 0, 0.16]) {
      const fold = mesh(
        rig.hips,
        new T.ConeGeometry(0.13, 0.69, 6),
        velvet,
        x,
        -0.18,
        -0.12,
      );
      fold.rotation.z = Math.PI + x * 0.4;
    }
    for (let i = 0; i < 4; i++)
      mesh(
        rig.hips,
        new T.BoxGeometry(0.32 - i * 0.025, 0.025, 0.025),
        lining,
        0,
        0.52 - i * 0.1,
        0.205,
      );
  }
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
  if (kind === "plagueScribe") {
    root.name = "El copista de las fiebres";
    root.scale.set(1.02, 1.2, 0.94);
    const hood = mesh(
      rig.head,
      new T.ConeGeometry(0.24, 0.42, 8),
      dark,
      0,
      0.28,
      -0.07,
    );
    hood.rotation.x = 0.18;
    mesh(
      rig.hips,
      new T.CylinderGeometry(0.23, 0.36, 0.75, 10),
      dark,
      0,
      0.06,
      0,
    );
    mesh(rig.head, new T.SphereGeometry(0.058, 8, 6), glow, 0, 0.12, 0.135);
    rig.leftArm.scale.y = 1.15;
    rig.rightArm.scale.y = 1.15;
  }
  if (kind === "centurion") {
    root.name = "El centurión sin rostro";
    root.scale.set(1.13, 1.12, 1.08);
    const crest = mesh(
      rig.head,
      new T.BoxGeometry(0.12, 0.3, 0.38),
      dark,
      0,
      0.34,
      0,
    );
    crest.rotation.x = -0.16;
    mesh(rig.hips, new T.BoxGeometry(0.51, 0.4, 0.34), bone, 0, 0.46, 0);
    mesh(rig.hips, new T.TorusGeometry(0.14, 0.04, 6, 16), glow, 0, 0.45, 0.21);
    const bronze = pbr("brass", 0x94744b);
    const iron = pbr("brass", 0x8c8c82);
    const shield = mesh(
      rig.leftArm,
      new T.BoxGeometry(0.48, 0.72, 0.13),
      dark,
      -0.05,
      -0.38,
      0.18,
    );
    shield.name = "centurion-shield";
    mesh(
      rig.leftArm,
      new T.BoxGeometry(0.41, 0.63, 0.035),
      bronze,
      -0.05,
      -0.38,
      0.27,
    );
    mesh(
      rig.leftArm,
      new T.SphereGeometry(0.095, 8, 6),
      iron,
      -0.05,
      -0.38,
      0.31,
    );
    mesh(
      rig.rightArm,
      new T.BoxGeometry(0.075, 0.68, 0.09),
      iron,
      0,
      -0.54,
      0.13,
    );
    mesh(
      rig.rightArm,
      new T.BoxGeometry(0.17, 0.075, 0.16),
      bronze,
      0,
      -0.19,
      0.13,
    );
    const point = mesh(
      rig.rightArm,
      new T.ConeGeometry(0.055, 0.18, 4),
      iron,
      0,
      -0.96,
      0.13,
    );
    point.rotation.z = Math.PI;
    for (const side of [-1, 1]) {
      mesh(
        rig.hips,
        new T.BoxGeometry(0.18, 0.09, 0.3),
        bronze,
        side * 0.26,
        0.61,
        0,
      );
      mesh(
        rig.head,
        new T.BoxGeometry(0.1, 0.29, 0.12),
        dark,
        side * 0.1,
        0.28,
        -0.06,
      );
    }
  }
  if (kind === "mosaic") {
    root.name = "El custodio de teselas";
    root.scale.set(1.08, 1.1, 1.02);
    const chalk = pbr("stone", 0xb8a886);
    const red = pbr("stone", 0x9c5c48);
    const black = pbr("stone", 0x333a39);
    for (const [x, y, material] of [
      [-0.16, 0.57, chalk],
      [0, 0.57, red],
      [0.16, 0.57, black],
      [-0.16, 0.38, black],
      [0, 0.38, chalk],
      [0.16, 0.38, red],
    ] as const)
      mesh(rig.hips, new T.BoxGeometry(0.14, 0.15, 0.055), material, x, y, 0.2);
    for (const side of [-1, 1]) {
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.BoxGeometry(0.16, 0.25, 0.1),
        side < 0 ? red : chalk,
        0,
        -0.3,
        0.11,
      );
      mesh(
        rig.head,
        new T.BoxGeometry(0.085, 0.085, 0.04),
        black,
        side * 0.1,
        0.09,
        0.18,
      );
    }
    mesh(rig.head, new T.BoxGeometry(0.12, 0.045, 0.04), red, 0, -0.08, 0.18);
  }
  if (kind === "drowned") {
    root.name = "El custodio ahogado";
    root.scale.set(1.04, 1.15, 1.07);
    const wet = pbr("leather", 0x394d4e);
    const salt = pbr("stone", 0x84948b);
    mesh(
      rig.hips,
      new T.CylinderGeometry(0.26, 0.34, 0.68, 9),
      wet,
      0,
      0.24,
      0,
    );
    for (const side of [-1, 1]) {
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.BoxGeometry(0.16, 0.34, 0.12),
        wet,
        0,
        -0.32,
        0.07,
      );
      mesh(
        rig.head,
        new T.SphereGeometry(0.045, 6, 5),
        glow,
        side * 0.09,
        0.08,
        0.18,
      );
      for (const y of [0.17, 0.39, 0.58])
        mesh(
          rig.hips,
          new T.IcosahedronGeometry(0.055, 0),
          salt,
          side * 0.2,
          y,
          0.13,
        );
    }
    const jaw = mesh(
      rig.head,
      new T.BoxGeometry(0.21, 0.06, 0.08),
      salt,
      0,
      -0.13,
      0.15,
    );
    jaw.name = "drowned-jaw";
  }
  if (kind === "blindWatcher") {
    root.name = "El vigilante ciego";
    root.scale.set(1.08, 1.17, 1.01);
    const robe = pbr("fabric", 0x333b50);
    const band = pbr("fabric", 0x9e9588);
    mesh(
      rig.hips,
      new T.CylinderGeometry(0.26, 0.36, 0.72, 9),
      robe,
      0,
      0.2,
      0,
    );
    mesh(rig.head, new T.BoxGeometry(0.39, 0.18, 0.19), band, 0, 0.11, 0.16);
    for (const side of [-1, 1]) {
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.CylinderGeometry(0.14, 0.18, 0.37, 8),
        robe,
        0,
        -0.3,
        0,
      );
      mesh(
        rig.hips,
        new T.BoxGeometry(0.13, 0.43, 0.06),
        band,
        side * 0.23,
        0.22,
        -0.15,
      );
    }
    const sensor = mesh(
      rig.hips,
      new T.TorusGeometry(0.21, 0.035, 6, 20),
      glow,
      0,
      0.5,
      0.24,
    );
    sensor.name = "watcher-sensor";
    mesh(
      rig.rightArm,
      new T.CylinderGeometry(0.035, 0.043, 0.85, 7),
      bone,
      0,
      -0.65,
      0.15,
    );
  }
  if (kind === "stoneworker") {
    root.name = "El obrero petrificado";
    root.scale.set(1.18, 1.2, 1.12);
    const rock = pbr("stone", 0x777d71);
    const crack = pbr("stone", 0x3b4a42);
    mesh(rig.hips, new T.BoxGeometry(0.58, 0.42, 0.43), rock, 0, 0.43, 0);
    for (const side of [-1, 1]) {
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.BoxGeometry(0.21, 0.39, 0.19),
        rock,
        0,
        -0.3,
        0.06,
      );
      mesh(
        rig.hips,
        new T.BoxGeometry(0.04, 0.38, 0.05),
        crack,
        side * 0.16,
        0.45,
        0.23,
      );
      mesh(
        rig.head,
        new T.BoxGeometry(0.085, 0.035, 0.035),
        crack,
        side * 0.1,
        0.1,
        0.18,
      );
    }
    const fissure = mesh(
      rig.hips,
      new T.TorusGeometry(0.14, 0.025, 5, 16),
      glow,
      0,
      0.45,
      0.245,
    );
    fissure.name = "stoneworker-fissure";
  }
  if (kind === "wardKeeper") {
    root.name = "El custodio de salas";
    root.scale.set(1.07, 1.13, 1.02);
    const apron = pbr("fabric", 0x858b78);
    const stain = pbr("fabric", 0x5e6c60);
    mesh(
      rig.hips,
      new T.CylinderGeometry(0.28, 0.37, 0.8, 9),
      apron,
      0,
      0.15,
      0,
    );
    mesh(rig.hips, new T.BoxGeometry(0.28, 0.58, 0.045), stain, 0, 0.22, 0.3);
    for (const side of [-1, 1]) {
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.BoxGeometry(0.21, 0.42, 0.18),
        apron,
        0,
        -0.3,
        0.04,
      );
      mesh(
        rig.head,
        new T.BoxGeometry(0.075, 0.07, 0.035),
        glow,
        side * 0.12,
        0.05,
        0.21,
      );
    }
    const tag = mesh(
      rig.hips,
      new T.BoxGeometry(0.24, 0.17, 0.035),
      glow,
      0,
      0.48,
      0.33,
    );
    tag.name = "wardkeeper-tag";
  }
  if (
    ["typesetter", "portrait", "automaton", "developerShade"].includes(kind)
  ) {
    const names: Record<string, string> = {
      typesetter: "El cajista de tipos móviles",
      portrait: "El retrato guardián",
      automaton: "El autómata de escena",
      developerShade: "La sombra de revelado",
    };
    const colors: Record<string, number> = {
      typesetter: 0x685140,
      portrait: 0x514452,
      automaton: 0x8d735c,
      developerShade: 0x3b494b,
    };
    root.name = names[kind];
    const shell = pbr(kind === "automaton" ? "brass" : "fabric", colors[kind]);
    mesh(rig.hips, new T.BoxGeometry(0.57, 0.64, 0.38), shell, 0, 0.3, 0);
    for (const side of [-1, 1]) {
      mesh(
        rig[side < 0 ? "leftArm" : "rightArm"],
        new T.BoxGeometry(0.18, 0.4, 0.2),
        shell,
        0,
        -0.3,
        0,
      );
      mesh(
        rig.head,
        new T.BoxGeometry(0.09, 0.09, 0.04),
        glow,
        side * 0.1,
        0.06,
        0.2,
      );
    }
    const mark = mesh(
      rig.hips,
      kind === "automaton"
        ? new T.TorusGeometry(0.16, 0.035, 6, 16)
        : new T.BoxGeometry(0.25, 0.2, 0.04),
      glow,
      0,
      0.45,
      0.23,
    );
    mark.name = `late-enemy-${kind}`;
    if (kind === "typesetter")
      for (const x of [-0.16, 0.16]) {
        mesh(rig.hips, new T.BoxGeometry(0.1, 0.12, 0.07), bone, x, 0.15, 0.25);
        mesh(
          rig[x < 0 ? "leftArm" : "rightArm"],
          new T.BoxGeometry(0.22, 0.19, 0.15),
          shell,
          0,
          -0.45,
          0.05,
        );
      }
    if (kind === "portrait") {
      for (const x of [-0.27, 0.27])
        mesh(
          rig.head,
          new T.BoxGeometry(0.06, 0.67, 0.09),
          bone,
          x,
          0.05,
          -0.14,
        );
      for (const y of [-0.28, 0.38])
        mesh(rig.head, new T.BoxGeometry(0.6, 0.06, 0.09), bone, 0, y, -0.14);
    }
    if (kind === "automaton") {
      for (const side of [-1, 1]) {
        const joint = mesh(
          rig[side < 0 ? "leftArm" : "rightArm"],
          new T.SphereGeometry(0.13, 8, 6),
          bone,
          0,
          -0.06,
          0,
        );
        joint.name = "automaton-hinge";
        mesh(
          rig[side < 0 ? "leftLeg" : "rightLeg"],
          new T.SphereGeometry(0.11, 8, 6),
          bone,
          0,
          -0.1,
          0,
        );
      }
      mesh(rig.head, new T.BoxGeometry(0.44, 0.08, 0.17), shell, 0, 0.1, 0.13);
    }
    if (kind === "developerShade") {
      for (const side of [-1, 1]) {
        const drip = mesh(
          rig.hips,
          new T.ConeGeometry(0.14, 0.48, 6),
          dark,
          side * 0.24,
          -0.17,
          -0.08,
        );
        drip.rotation.z = Math.PI;
        drip.name = "developer-drip";
      }
      mesh(rig.head, new T.PlaneGeometry(0.36, 0.24), glow, 0, 0.03, 0.2);
    }
    if (kind === "developerShade") root.scale.set(1.04, 1.14, 1.04);
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
  windupProgress = 0,
  gazeYaw = 0,
  sanity = 100,
) {
  const rig = root.userData.rig as Rig;
  if (kind === "guest" && state === "frozen") {
    rig.hips.position.y = 0.91;
    rig.head.rotation.set(-0.08, Math.max(-1.1, Math.min(1.1, gazeYaw)), 0.12);
    rig.leftArm.rotation.set(0, 0, 0);
    rig.rightArm.rotation.set(0, 0, 0);
  }
  if (kind === "guest" && state !== "frozen") {
    rig.head.rotation.y = Math.max(-1.1, Math.min(1.1, gazeYaw));
    rig.head.rotation.z = 0.16 + Math.sin(time * 1.7) * 0.06;
    rig.hips.rotation.z = -0.08;
  }
  if (kind === "widow") {
    rig.hips.position.y += Math.sin(time * 2.6) * 0.035;
    rig.head.rotation.z = Math.sin(time * 1.4) * 0.08;
    rig.leftArm.rotation.z = -0.18 - Math.sin(time * 2.1) * 0.12;
    rig.rightArm.rotation.z = 0.18 + Math.sin(time * 2.1 + 0.8) * 0.12;
  }
  if (kind === "crawler") {
    const stride = state === "chase" ? 12 : 5;
    rig.hips.position.y = 0.57 + Math.sin(time * stride * 2) * 0.035;
    rig.hips.rotation.x = 0.8;
    rig.head.rotation.x = -0.45;
    rig.leftArm.rotation.x = -1.25 + Math.sin(time * stride) * 0.48;
    rig.rightArm.rotation.x = -1.25 - Math.sin(time * stride) * 0.48;
    rig.leftLeg.rotation.x = 0.65 - Math.sin(time * stride) * 0.42;
    rig.rightLeg.rotation.x = 0.65 + Math.sin(time * stride) * 0.42;
  }
  if (kind === "wrongReflection") {
    const delayed = time - 0.43;
    rig.head.rotation.y = -gazeYaw * 0.65 + Math.sin(delayed * 1.7) * 0.16;
    rig.leftArm.rotation.x = Math.sin(delayed * 2.2) * 0.35;
    rig.rightArm.rotation.x = -Math.sin(delayed * 2.2) * 0.35;
    rig.hips.scale.x = 1 + (1 - sanity / 100) * Math.sin(time * 3.1) * 0.12;
  }
  if (kind === "nameRoot") {
    rig.hips.rotation.z =
      Math.sin(time * (phase === 3 ? 3.2 : 1.3)) * (phase === 3 ? 0.18 : 0.07);
    rig.leftArm.rotation.z =
      (phase === 3 ? 0.75 : 0.25) + Math.sin(time * 2) * 0.18;
    rig.rightArm.rotation.z =
      -(phase === 3 ? 0.75 : 0.25) - Math.cos(time * 2) * 0.18;
  }
  if (state === "windup") {
    if (kind === "guest") {
      rig.head.rotation.y = Math.sin(time * 8) * 0.12;
      rig.leftArm.rotation.x = -0.45;
      rig.rightArm.rotation.x = -1.75;
    } else if (kind === "widow") {
      rig.leftArm.rotation.x = -1.65;
      rig.rightArm.rotation.x = -1.65;
      rig.head.rotation.x = -0.25;
    } else if (kind === "crawler") {
      rig.hips.rotation.x = 0.55;
      rig.leftArm.rotation.x = -2.1;
      rig.rightArm.rotation.x = -2.1;
    } else if (kind === "wrongReflection") {
      rig.leftArm.rotation.x = -2.0;
      rig.rightArm.rotation.x = 0.7;
    } else if (kind === "nameRoot") {
      rig.leftArm.rotation.z = 1.05;
      rig.rightArm.rotation.z = -1.05;
      rig.hips.rotation.z = Math.sin(time * 6) * 0.08;
    } else if (kind === "shade") {
      rig.leftArm.rotation.x = -1.8;
      rig.rightArm.rotation.x = -1.3 - windupProgress * 0.7;
      rig.head.rotation.z = Math.sin(time * 9) * 0.1;
    } else if (kind === "typesetter") {
      rig.rightArm.rotation.x = -2.2;
      rig.leftArm.rotation.x = -0.6;
    } else if (kind === "portrait") {
      rig.leftArm.rotation.x = -1.45;
      rig.rightArm.rotation.x = -1.45;
      rig.head.rotation.y = Math.sin(time * 3) * 0.16;
    } else if (kind === "automaton") {
      rig.rightArm.rotation.x = -2.6;
      rig.rightArm.rotation.z = -0.8;
      rig.hips.rotation.y = Math.sin(time * 11) * 0.06;
    } else if (kind === "developerShade") {
      rig.leftArm.rotation.x = -1.75;
      rig.rightArm.rotation.x = -1.75;
      rig.hips.rotation.z = Math.sin(time * 8) * 0.07;
    }
  } else if (
    state === "vulnerable" &&
    (kind === "portrait" || kind === "automaton")
  ) {
    rig.leftArm.rotation.x = 0.8;
    rig.rightArm.rotation.x = 0.8;
  }
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
    if (object.name === "name-root-heart" && object instanceof T.Mesh)
      (object.material as T.MeshStandardMaterial).emissiveIntensity =
        state === "windup" ? 1.8 : phase > 1 ? 1.2 : 0.45;
    if (object.name.startsWith("name-root-branch-")) {
      const index = Number(object.name.slice(-1));
      object.rotation.z =
        Math.sin(time * (phase === 3 ? 4 : 1.8) + index) *
        (phase === 1 ? 0.06 : phase === 2 ? 0.17 : 0.31);
      object.scale.setScalar(phase === 1 ? 0.72 : phase === 2 ? 0.92 : 1.18);
    }
    if (object.name.startsWith("widow-panel-")) {
      const index = Number(object.name.slice(-1));
      object.rotation.z = Math.sin(time * 2.2 - index * 0.65) * 0.1;
      object.rotation.x = Math.sin(time * 1.8 + index) * 0.07;
    }
    if (object.name === "widow-veil")
      object.rotation.x = Math.sin(time * 2.2 - 0.9) * 0.12;
    if (object.name === "reflection-face" && object instanceof T.Mesh)
      (object.material as T.MeshStandardMaterial).emissiveIntensity =
        0.2 + (1 - sanity / 100) * 0.8;
    if (object.name === "centurion-shield" && object instanceof T.Mesh) {
      const material = object.material as T.MeshStandardMaterial;
      material.emissive.setHex(state === "windup" ? 0x4d2618 : 0x000000);
      material.emissiveIntensity = state === "windup" ? 0.5 : 0;
    }
    if (object.name === "drowned-jaw")
      object.position.y =
        -0.13 - (state === "windup" ? 0.055 : 0.012 * Math.sin(time * 2.3));
    if (object.name === "watcher-sensor" && object instanceof T.Mesh) {
      const material = object.material as T.MeshStandardMaterial;
      material.emissiveIntensity =
        state === "investigate" || state === "windup" ? 1.25 : 0.35;
    }
    if (object.name === "stoneworker-fissure" && object instanceof T.Mesh) {
      const material = object.material as T.MeshStandardMaterial;
      material.emissiveIntensity = state === "recover" ? 1.45 : 0.25;
    }
    if (object.name === "wardkeeper-tag" && object instanceof T.Mesh) {
      const material = object.material as T.MeshStandardMaterial;
      material.emissiveIntensity = state === "windup" ? 1.4 : 0.3;
    }
    if (object.name.startsWith("late-enemy-") && object instanceof T.Mesh) {
      const material = object.material as T.MeshStandardMaterial;
      material.emissiveIntensity =
        state === "windup" ? 1.5 : state === "vulnerable" ? 0.1 : 0.5;
      object.rotation.z = Math.sin(time * 2) * 0.1;
    }
    if (object.name === "automaton-hinge")
      object.rotation.x = state === "windup" ? Math.sin(time * 12) * 0.35 : 0;
    if (object.name === "developer-drip")
      object.scale.y =
        state === "windup" ? 1.3 : 0.9 + Math.sin(time * 2) * 0.08;
  });
}
