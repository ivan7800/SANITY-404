import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { pbr } from "../render/materials";
export interface Rig {
  hips: T.Group;
  leftLeg: T.Group;
  rightLeg: T.Group;
  leftArm: T.Group;
  rightArm: T.Group;
  head: T.Group;
  weapon: T.Mesh;
  leftKnee: T.Group;
  rightKnee: T.Group;
  coat: T.Mesh;
}
export function character(enemy = false): T.Group {
  const root = new T.Group();
  root.name = enemy ? "El desnombrado" : "Élise Moreau · restauradora, 1927";
  const cloth = pbr("fabric", enemy ? 0x414c41 : 0x526476),
    blouse = pbr("fabric", 0xd2c7ae),
    skin = new T.MeshStandardMaterial({
      color: enemy ? 0x9a9a83 : 0xd6af93,
      roughness: 0.7,
    }),
    leather = pbr("leather", 0x302720),
    hair = pbr("wood", enemy ? 0x252b23 : 0x3b2921),
    brass = pbr("brass", 0xc5a86a),
    eyes = new T.MeshStandardMaterial({ color: 0x25302e, roughness: 0.3 }),
    lips = new T.MeshStandardMaterial({ color: 0x9b665e, roughness: 0.8 });
  const add = (
    parent: T.Object3D,
    g: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const oval = (
    parent: T.Object3D,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const o = add(parent, new T.SphereGeometry(1, 16, 12), m, x, y, z);
    o.scale.set(sx, sy, sz);
    return o;
  };
  const hips = new T.Group();
  hips.position.y = 0.91;
  root.add(hips);
  oval(hips, cloth, 0, 0.02, 0, 0.225, 0.19, 0.14);
  const torso = add(
    hips,
    new T.LatheGeometry(
      [
        new T.Vector2(0.19, 0.08),
        new T.Vector2(0.165, 0.24),
        new T.Vector2(0.21, 0.44),
        new T.Vector2(0.245, 0.61),
        new T.Vector2(0.12, 0.68),
      ],
      20,
    ),
    cloth,
    0,
    0,
    0,
  );
  torso.scale.z = 0.64;
  oval(hips, blouse, 0, 0.54, 0.13, 0.095, 0.16, 0.04);
  for (const side of [-1, 1]) {
    const lapel = add(
      hips,
      new T.BoxGeometry(0.085, 0.29, 0.025),
      cloth,
      side * 0.092,
      0.48,
      0.15,
    );
    lapel.rotation.z = side * -0.3;
  }
  const belt = add(
    hips,
    new T.CylinderGeometry(0.188, 0.194, 0.055, 20),
    leather,
    0,
    0.18,
    0,
  );
  belt.scale.z = 0.7;
  add(hips, new T.BoxGeometry(0.075, 0.06, 0.025), brass, 0, 0.18, 0.144);
  for (let i = 0; i < 4; i++)
    oval(hips, brass, 0.045, 0.29 + i * 0.077, 0.163, 0.014, 0.014, 0.007);
  const coat = add(
    hips,
    new T.LatheGeometry(
      [
        new T.Vector2(0.28, -0.28),
        new T.Vector2(0.24, -0.08),
        new T.Vector2(0.195, 0.16),
      ],
      20,
    ),
    cloth,
    0,
    0,
    0,
  );
  coat.scale.z = 0.65;
  for (const side of [-1, 1]) {
    const pocket = add(
      hips,
      new T.BoxGeometry(0.12, 0.035, 0.025),
      cloth,
      side * 0.175,
      0.04,
      0.14,
    );
    pocket.rotation.z = side * 0.12;
  }
  // Tailored cuffs, leather satchel, strap, seams and high blouse collar.
  const bag = add(
    hips,
    new T.BoxGeometry(0.19, 0.24, 0.11),
    leather,
    -0.26,
    -0.01,
    -0.01,
  );
  bag.rotation.z = 0.1;
  const strap = add(
    hips,
    new T.BoxGeometry(0.035, 0.62, 0.025),
    leather,
    -0.02,
    0.41,
    0.17,
  );
  strap.rotation.z = -0.62;
  add(
    hips,
    new T.CylinderGeometry(0.078, 0.095, 0.085, 16),
    blouse,
    0,
    0.73,
    0,
  );
  const head = new T.Group();
  head.position.y = 0.83;
  head.scale.setScalar(enemy ? 0.75 : 0.7);
  hips.add(head);
  add(head, new T.CylinderGeometry(0.06, 0.075, 0.13, 12), skin, 0, -0.04, 0);
  oval(head, skin, 0, 0.105, 0.002, 0.133, 0.188, 0.12);
  oval(head, skin, 0, 0.025, 0.032, 0.108, 0.09, 0.096);
  for (const side of [-1, 1]) {
    oval(head, skin, side * 0.135, 0.1, -0.006, 0.027, 0.047, 0.02);
    oval(head, blouse, side * 0.049, 0.127, 0.111, 0.023, 0.009, 0.01);
    oval(head, eyes, side * 0.049, 0.126, 0.121, 0.009, 0.009, 0.005);
    // Upper eyelid and lower lip catch the warm key light in close shots.
    oval(head, skin, side * 0.049, 0.138, 0.116, 0.028, 0.006, 0.008);
    oval(head, hair, side * 0.05, 0.158, 0.105, 0.039, 0.009, 0.014);
    oval(head, skin, side * 0.064, 0.073, 0.101, 0.043, 0.037, 0.022);
  }
  oval(head, skin, 0, 0.096, 0.127, 0.022, 0.042, 0.032);
  oval(head, skin, 0, 0.066, 0.144, 0.026, 0.014, 0.017);
  oval(head, lips, 0, 0.009, 0.118, 0.04, 0.008, 0.008);
  const scalp = add(
    head,
    new T.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hair,
    0,
    0.145,
    -0.012,
  );
  scalp.scale.set(0.14, 0.164, 0.129);
  oval(head, hair, 0, 0.051, -0.113, 0.122, 0.1, 0.052);
  oval(head, hair, 0.015, -0.003, -0.154, 0.075, 0.065, 0.05);
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI;
    const strand = oval(
      head,
      hair,
      Math.cos(a) * 0.117,
      0.19 + Math.sin(a) * 0.067,
      0.069,
      0.025,
      0.054,
      0.045,
    );
    strand.rotation.z = -a + 0.5;
  }
  const leg = (x: number) => {
    const pivot = new T.Group();
    pivot.position.set(x, -0.045, 0);
    hips.add(pivot);
    add(pivot, new T.CapsuleGeometry(0.092, 0.25, 6, 12), cloth, 0, -0.17, 0);
    const knee = new T.Group();
    knee.position.y = -0.39;
    pivot.add(knee);
    add(knee, new T.CapsuleGeometry(0.069, 0.21, 6, 12), leather, 0, -0.16, 0);
    const boot = oval(knee, leather, 0, -0.375, 0.05, 0.075, 0.085, 0.145);
    add(knee, new T.BoxGeometry(0.145, 0.025, 0.26), leather, 0, -0.438, 0.046);
    add(knee, new T.BoxGeometry(0.12, 0.055, 0.095), leather, 0, -0.414, -0.04);
    for (let j = 0; j < 3; j++)
      add(
        knee,
        new T.BoxGeometry(0.07, 0.014, 0.014),
        brass,
        0,
        -0.23 + j * 0.05,
        0.069,
      );
    void boot;
    return { pivot, knee };
  };
  const l = leg(-0.115),
    r = leg(0.115);
  const arm = (x: number) => {
    const pivot = new T.Group();
    pivot.position.set(x, 0.59, 0);
    hips.add(pivot);
    oval(pivot, cloth, 0, -0.035, 0, 0.101, 0.12, 0.104);
    add(pivot, new T.CapsuleGeometry(0.071, 0.18, 6, 12), cloth, 0, -0.19, 0);
    add(
      pivot,
      new T.CapsuleGeometry(0.053, 0.18, 6, 12),
      cloth,
      0,
      -0.43,
      0.017,
    );
    add(
      pivot,
      new T.CylinderGeometry(0.06, 0.06, 0.05, 12),
      blouse,
      0,
      -0.57,
      0.02,
    );
    oval(pivot, skin, 0, -0.63, 0.027, 0.042, 0.063, 0.026);
    for (let i = 0; i < 4; i++) {
      const finger = add(
        pivot,
        new T.CapsuleGeometry(0.009, 0.043 - (i === 3 ? 0.015 : 0), 3, 6),
        skin,
        -0.026 + i * 0.017,
        -0.697,
        0.036,
      );
      finger.rotation.x = -0.17;
    }
    const thumb = add(
      pivot,
      new T.CapsuleGeometry(0.013, 0.03, 3, 6),
      skin,
      x > 0 ? -0.048 : 0.048,
      -0.642,
      0.047,
    );
    thumb.rotation.z = x > 0 ? -0.55 : 0.55;
    return pivot;
  };
  const leftArm = arm(-0.255),
    rightArm = arm(0.255);
  const weapon = add(
    rightArm,
    new T.CylinderGeometry(0.018, 0.026, 0.91, 12),
    pbr("wood", 0x6b4227),
    0,
    -0.66,
    0.38,
  );
  weapon.rotation.x = Math.PI / 2;
  weapon.userData.keep = true;
  const knob = oval(rightArm, brass, 0, -0.66, 0.84, 0.039, 0.039, 0.039);
  knob.visible = !enemy;
  root.userData.rig = {
    hips,
    leftLeg: l.pivot,
    rightLeg: r.pivot,
    leftArm,
    rightArm,
    head,
    weapon,
    leftKnee: l.knee,
    rightKnee: r.knee,
    coat,
  } satisfies Rig;
  if (enemy) {
    root.scale.set(1.08, 1.12, 1);
    weapon.visible = false;
    head.rotation.z = 0.12;
  }
  // Batch rigid details per joint and material; articulation remains real 3D geometry.
  root.traverse((parent) => {
    if (!(parent instanceof T.Group)) return;
    const groups = new Map<T.Material, T.Mesh[]>();
    for (const child of parent.children)
      if (
        child instanceof T.Mesh &&
        child.visible &&
        !child.userData.keep &&
        child !== coat
      ) {
        const list = groups.get(child.material as T.Material) ?? [];
        list.push(child);
        groups.set(child.material as T.Material, list);
      }
    for (const [material, meshes] of groups) {
      if (meshes.length < 2) continue;
      const geometries = meshes.map((mesh) => {
        mesh.updateMatrix();
        return mesh.geometry.clone().applyMatrix4(mesh.matrix);
      });
      const geometry = mergeGeometries(geometries);
      for (const g of geometries) g.dispose();
      if (!geometry) continue;
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        parent.remove(mesh);
      }
      const mesh = new T.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
  });
  return root;
}
export function animateCharacter(
  root: T.Group,
  time: number,
  moving: boolean,
  attack = 0,
  guard = false,
  hurt = 0,
  running = false,
  dt = 0,
) {
  const r = root.userData.rig as Rig | undefined;
  if (!r) return;
  const previous = root.userData.locomotion ?? 0;
  const weight =
    dt > 0
      ? T.MathUtils.lerp(previous, moving ? 1 : 0, 1 - Math.exp(-dt * 10))
      : moving
        ? 1
        : 0;
  root.userData.locomotion = weight;
  const phase = time * (running ? 13 : 9),
    stride = weight * Math.sin(phase) * (running ? 0.72 : 0.46);
  r.hips.position.y =
    0.91 +
    (moving
      ? Math.abs(Math.sin(phase)) * (running ? 0.055 : 0.025)
      : Math.sin(time * 2) * 0.008);
  r.hips.rotation.x = running && moving ? 0.08 : 0;
  r.leftLeg.rotation.x = stride;
  r.rightLeg.rotation.x = -stride;
  r.leftKnee.rotation.x = moving
    ? Math.max(0, -Math.sin(phase)) * (running ? 0.9 : 0.45)
    : 0.025;
  r.rightKnee.rotation.x = moving
    ? Math.max(0, Math.sin(phase)) * (running ? 0.9 : 0.45)
    : 0.025;
  // Blend combat poses instead of snapping between locomotion and defence.
  // Preserve immediate updates when dt is omitted (used by existing callers/tests).
  const blend = dt > 0 ? 1 - Math.exp(-dt * 14) : 1;
  const defence = T.MathUtils.lerp(root.userData.defenceWeight ?? 0, guard ? 1 : 0, blend);
  root.userData.defenceWeight = defence;
  const attackPhase = T.MathUtils.clamp(attack / 0.3, 0, 1);
  const strike = attack > 0 ? Math.sin(attackPhase * Math.PI) : 0;
  const armSwing = -stride * 0.65;
  r.leftArm.rotation.x = T.MathUtils.lerp(armSwing, -1.2, defence);
  r.rightArm.rotation.x = T.MathUtils.lerp(
    stride * 0.65 - strike * 2.1,
    -1.1,
    defence,
  );
  r.rightArm.rotation.z = T.MathUtils.lerp(-strike * 0.35, -0.55, defence);
  r.leftArm.rotation.z = defence * 0.55;
  r.hips.rotation.z =
    hurt > 0
      ? Math.sin(hurt * 40) * 0.07
      : Math.sin(phase) * (moving ? 0.018 : 0);
  r.coat.rotation.x = moving ? Math.sin(phase) * 0.045 : 0;
  r.head.rotation.y = Math.sin(time * 0.6) * 0.035;
}

/** Articulated collapse, shared by the protagonist and the enemy's visual corpse. */
export function animateDeath(root: T.Group, progress: number) {
  const r = root.userData.rig as Rig;
  const t = T.MathUtils.smoothstep(progress, 0, 1);
  r.hips.position.y = 0.91 - t * 0.64;
  r.hips.rotation.x = -t * 1.35;
  r.hips.rotation.z = t * 0.25;
  r.leftKnee.rotation.x = t * 1.5;
  r.rightKnee.rotation.x = t * 1.1;
  r.leftArm.rotation.x = -t * 0.8;
  r.rightArm.rotation.x = -t * 0.55;
  r.head.rotation.x = t * 0.5;
}
