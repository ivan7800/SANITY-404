import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import { lateChapterForRoom, type LateChapter } from "../systems/late-chapters";
import { character, type Rig } from "./character";
import type { World } from "./scene";

export function lateHero(chapter: LateChapter): T.Group {
  const actor = character(false, chapter.year < 1700 ? "medieval" : "modern");
  actor.name = `${chapter.hero}, año ${chapter.year}`;
  actor.userData.historicalHero = chapter.id;
  const rig = actor.userData.rig as Rig;
  rig.weapon.visible = false;
  rig.coat.visible = false;
  rig.coatTails.visible = false;
  const cloth = pbr("fabric", chapter.colors[0]);
  const metal = pbr("brass", chapter.colors[1]);
  const dark = pbr("leather", chapter.colors[2]);
  const trim = pbr("fabric", chapter.colors[1]);
  const detail = (
    parent: T.Object3D,
    shape: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
    name: string,
  ) => {
    const mesh = new T.Mesh(shape, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const apron = new T.Mesh(new T.BoxGeometry(0.48, 0.62, 0.045), cloth);
  apron.position.set(0, 0.24, 0.2);
  rig.hips.add(apron);
  const tool = new T.Mesh(new T.CylinderGeometry(0.035, 0.048, 0.8, 7), metal);
  tool.position.set(0, -0.66, 0.17);
  tool.rotation.z = chapter.year === 1610 ? 0.2 : -0.22;
  rig.rightArm.add(tool);
  const badge = new T.Mesh(new T.BoxGeometry(0.18, 0.1, 0.035), metal);
  badge.position.set(0.17, 0.47, 0.24);
  rig.hips.add(badge);
  const mark = `silhouette-${chapter.id}`;
  if (chapter.year === 1491) {
    detail(
      rig.head,
      new T.CylinderGeometry(0.25, 0.32, 0.22, 10),
      dark,
      0,
      0.33,
      0,
      mark,
    );
    detail(
      rig.head,
      new T.BoxGeometry(0.52, 0.04, 0.35),
      trim,
      0,
      0.23,
      0.05,
      "printer-cap-brim",
    );
    for (const side of [-1, 1])
      detail(
        rig.hips,
        new T.BoxGeometry(0.12, 0.36, 0.08),
        trim,
        side * 0.22,
        0.21,
        0.18,
        "printer-apron-strap",
      );
    detail(
      rig.leftArm,
      new T.BoxGeometry(0.27, 0.08, 0.16),
      dark,
      0,
      -0.38,
      0.04,
      "printer-ink-cuff",
    );
  } else if (chapter.year === 1610) {
    detail(
      rig.hips,
      new T.CylinderGeometry(0.29, 0.16, 0.24, 10),
      trim,
      0,
      0.69,
      0,
      mark,
    );
    for (const side of [-1, 1]) {
      detail(
        rig.hips,
        new T.BoxGeometry(0.18, 0.5, 0.07),
        dark,
        side * 0.27,
        0.31,
        -0.03,
        "archivist-mantle",
      );
      detail(
        rig.head,
        new T.BoxGeometry(0.07, 0.3, 0.05),
        trim,
        side * 0.21,
        0.1,
        -0.02,
        "archivist-hair-ribbon",
      );
    }
    detail(
      rig.rightArm,
      new T.ConeGeometry(0.025, 0.58, 6),
      metal,
      0,
      -0.85,
      0.17,
      "archivist-rapier-tip",
    );
  } else if (chapter.year === 1786) {
    detail(
      rig.head,
      new T.TorusGeometry(0.23, 0.035, 6, 18),
      trim,
      0,
      0.21,
      0.01,
      mark,
    );
    for (const side of [-1, 1]) {
      detail(
        rig.hips,
        new T.BoxGeometry(0.12, 0.25, 0.08),
        metal,
        side * 0.23,
        0.46,
        0.09,
        "machinist-brace",
      );
      detail(
        rig.leftArm,
        new T.CylinderGeometry(0.035, 0.035, 0.2, 7),
        metal,
        side * 0.07,
        -0.4,
        0.18,
        "machinist-tool",
      );
    }
    detail(
      rig.hips,
      new T.BoxGeometry(0.31, 0.17, 0.12),
      dark,
      -0.25,
      0.01,
      0.02,
      "machinist-tool-bag",
    );
  } else {
    detail(
      rig.head,
      new T.CylinderGeometry(0.25, 0.27, 0.28, 12),
      dark,
      0,
      0.42,
      -0.02,
      mark,
    );
    detail(
      rig.head,
      new T.CylinderGeometry(0.34, 0.34, 0.03, 12),
      dark,
      0,
      0.26,
      0,
      "photographer-hat-brim",
    );
    detail(
      rig.hips,
      new T.BoxGeometry(0.34, 0.33, 0.1),
      dark,
      0,
      0.39,
      0.21,
      "photographer-camera-body",
    );
    const lens = detail(
      rig.hips,
      new T.CylinderGeometry(0.08, 0.1, 0.15, 10),
      metal,
      0,
      0.39,
      0.34,
      "photographer-camera-lens",
    );
    lens.rotation.x = Math.PI / 2;
    for (const side of [-1, 1])
      detail(
        rig.hips,
        new T.BoxGeometry(0.08, 0.45, 0.05),
        trim,
        side * 0.2,
        0.36,
        0.09,
        "photographer-suspender",
      );
  }
  for (const joint of [rig.hips, rig.rightArm]) batchRigid(joint);
  return actor;
}

/** Distinct workspaces built from low cost procedural architecture. */
export function decorateLateChapter(world: World, quality = 1.3) {
  const chapter = lateChapterForRoom(world.room);
  if (!chapter) return;
  const inner = world.room === chapter.room + 1;
  const low = quality === 1;
  const b = world.box.bind(world);
  const [base, accent, dark] = chapter.colors;
  world.scene.background = new T.Color(base);
  world.scene.fog = new T.FogExp2(dark, 0.028);
  if (chapter.year === 1491) {
    for (const side of [-1, 1])
      for (const z of low ? [-3.5, 3.5] : [-3.5, 0, 3.5]) {
        b(side * 4.8, 0.75, z, 1.4, 1.45, 0.85, base, true, "wood");
        b(side * 4.8, 1.52, z, 1.55, 0.12, 1.0, accent, false, "wood");
        for (const x of low ? [-0.42, 0.42] : [-0.42, 0, 0.42])
          b(side * 4.8 + x, 1.61, z, 0.16, 0.03, 0.55, dark, false, "wood");
      }
    b(-4, 1.1, -4, 2.3, 0.16, 1.5, base, true, "wood");
    b(-4, 2.1, -4, 2.2, 0.2, 1.3, accent, false, "wood");
    for (const x of [-1, 1])
      b(-4 + x, 1.35, -4, 0.15, 1.6, 0.15, accent, false, "wood");
  } else if (chapter.year === 1610) {
    for (const side of [-1, 1])
      for (const z of low ? [-4, 4] : [-4, 0, 4]) {
        b(side * 6.2, 2.3, z, 0.15, 2.5, 1.45, accent, false, "wood");
        b(
          side * 6.09,
          2.3,
          z,
          0.04,
          1.75,
          0.95,
          inner ? dark : base,
          false,
          "fabric",
        );
        b(side * 6.02, 1.2, z, 0.06, 0.1, 0.85, accent, false, "brass");
      }
    b(-4, 0.65, -3.5, 2.3, 1.3, 1.1, base, true, "wood");
  } else if (chapter.year === 1786) {
    for (const x of [-5, 5])
      b(x, 0.35, -5.1, 2.5, 0.7, 2.4, dark, true, "wood");
    for (const x of low ? [-4, 0, 4] : [-4, -2, 0, 2, 4]) {
      b(x, 3.7, -2, 0.07, 0.1, 8, accent, false, "brass");
      b(x, 2.5, -3.6, 0.3, 0.75, 0.3, accent, false, "brass");
    }
    for (const z of low ? [1, 5] : [1, 3, 5])
      for (const x of [-5, 5])
        b(x, 0.6, z, 1.15, 1.2, 0.55, base, true, "wood");
  } else {
    for (const side of [-1, 1])
      for (const z of low ? [-4, 2, 5] : [-4, -1, 2, 5]) {
        b(side * 5, 0.7, z, 1.25, 1.4, 0.7, base, true, "wood");
        b(side * 5, 1.43, z, 1.3, 0.04, 0.72, accent, false, "brass");
        b(side * 5, 1.5, z, 0.75, 0.04, 0.5, dark, false, "fabric");
      }
    b(-4, 0.8, -4, 1.7, 1.6, 1.0, dark, true, "wood");
    b(-4, 1.64, -4, 1.8, 0.06, 1.05, accent, false, "brass");
  }
  for (const side of [-1, 1]) {
    b(side * 7.73, 2.1, 0, 0.06, 3.7, 13.2, base, false, "wood");
    for (const z of low ? [-5.5, 0, 5.5] : [-5.5, -2.75, 0, 2.75, 5.5])
      b(side * 7.66, 2.2, z, 0.09, 3.5, 0.09, accent, false, "wood");
  }
  const landmark = new T.Group();
  landmark.name = `landmark-${chapter.id}-${inner ? "inner" : "outer"}`;
  landmark.position.set(inner ? 4.9 : -4.8, 0, inner ? -3.4 : -0.6);
  const frame = pbr("wood", base);
  const metal = pbr("brass", accent);
  const surface = pbr("fabric", dark);
  const part = (
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    landmark.add(mesh);
    return mesh;
  };
  if (chapter.year === 1491) {
    for (const x of [-0.45, 0.45])
      part(new T.BoxGeometry(0.1, 1.8, 0.12), frame, x, 0.9, 0);
    for (const y of [0.62, 1.18]) {
      const roller = part(
        new T.CylinderGeometry(0.16, 0.16, 0.95, 10),
        metal,
        0,
        y,
        0,
      );
      roller.rotation.z = Math.PI / 2;
    }
    part(new T.BoxGeometry(1.1, 0.05, 0.72), surface, 0, 0.36, 0);
  } else if (chapter.year === 1610) {
    for (const x of [-0.55, 0.55])
      part(new T.BoxGeometry(0.08, 1.65, 0.08), metal, x, 1.85, 0);
    for (const y of [1.05, 2.65])
      part(new T.BoxGeometry(1.16, 0.08, 0.08), metal, 0, y, 0);
    const portrait = part(
      new T.PlaneGeometry(0.96, 1.5),
      surface,
      0,
      1.85,
      0.02,
    );
    portrait.name = "late-veyr-portrait";
    if (inner) part(new T.BoxGeometry(0.25, 0.36, 0.05), frame, 0, 1.8, 0.08);
  } else if (chapter.year === 1786) {
    for (const x of [-0.42, 0.42]) {
      const gear = part(
        new T.TorusGeometry(0.34, 0.08, 6, 12),
        metal,
        x,
        1.5,
        0,
      );
      gear.rotation.y = Math.PI / 2;
      part(new T.CylinderGeometry(0.08, 0.08, 1.45, 8), frame, x, 0.75, 0);
    }
    part(new T.BoxGeometry(1.3, 0.12, 0.4), surface, 0, 2.2, 0);
  } else {
    part(new T.BoxGeometry(0.82, 0.66, 0.42), frame, 0, 1.5, 0);
    const lens = part(
      new T.CylinderGeometry(0.2, 0.25, 0.38, 12),
      metal,
      0,
      1.5,
      0.37,
    );
    lens.rotation.x = Math.PI / 2;
    for (const x of [-0.4, 0.4]) {
      const leg = part(
        new T.CylinderGeometry(0.035, 0.045, 1.28, 6),
        frame,
        x,
        0.62,
        0,
      );
      leg.rotation.z = x * 0.38;
    }
    if (inner) part(new T.PlaneGeometry(0.55, 0.4), surface, 0, 2.55, -0.04);
  }
  world.scene.add(batchRigid(landmark));
  if (chapter.year !== 1610)
    world.obstacles.push({
      x: landmark.position.x,
      z: landmark.position.z,
      w: 1.3,
      d: 0.8,
      height: 2.3,
    });
  world.lamp(0, 3.1, inner ? -3.4 : 0, accent, 8);
}
