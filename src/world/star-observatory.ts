import * as T from "three";
import type { World } from "./scene";

/** Terrace and instrument chamber of Samira's mountain observatory. */
export function decorateStarObservatory(world: World, alignmentStage: number) {
  const b = world.box.bind(world);
  const dome = world.room === 16;
  world.scene.background = new T.Color(dome ? "#171d2a" : "#101b2a");
  world.scene.fog = new T.FogExp2(dome ? "#2f3447" : "#293b50", 0.026);
  for (const side of [-1, 1]) {
    for (const z of [-5.5, -2.1, 1.3, 4.7]) {
      b(side * 5.95, 1.56, z, 0.6, 3.12, 0.6, 0x676b70, true, "stone");
      b(side * 5.95, 3.21, z, 0.95, 0.18, 0.9, 0x9a9a95, false, "stone");
    }
    b(side * 7.54, 0.73, 0, 0.34, 1.46, 14.7, 0x505d6d, false, "stone");
    b(side * 7.43, 1.52, 0, 0.5, 0.14, 14.7, 0x969995, false, "stone");
  }
  for (let i = -5; i <= 5; i++) {
    const color = i % 2 ? 0x656b72 : 0x83868a;
    b(i * 1.08, 0.02, 0, 0.045, 0.018, 13.8, color, false, "stone");
  }
  if (!dome) {
    const positions = new Float32Array(48 * 3);
    for (let i = 0; i < 48; i++) {
      positions[i * 3] = Math.sin(i * 2.43) * 6.5;
      positions[i * 3 + 1] = 4.1 + (i % 4) * 0.15;
      positions[i * 3 + 2] = Math.cos(i * 1.91) * 6.5;
    }
    const stars = new T.BufferGeometry();
    stars.setAttribute("position", new T.BufferAttribute(positions, 3));
    const sky = new T.Points(
      stars,
      new T.PointsMaterial({
        color: 0xc9d2bf,
        size: 0.055,
        sizeAttenuation: true,
      }),
    );
    sky.name = "cielo-de-samira";
    world.scene.add(sky);
    for (const x of [-4.3, 4.3]) {
      b(x, 0.72, -4, 1.2, 1.44, 1.45, 0x626672, true, "stone");
      b(x, 1.49, -4, 1.44, 0.11, 1.7, 0x9a9b98, false, "stone");
    }
    world.lamp(-4.8, 2.8, 2.5, 0xaac0cb, 6);
  } else {
    for (const radius of [2.6, 3.55, 4.5]) {
      const rib = new T.Mesh(
        new T.TorusGeometry(radius, 0.07, 5, 44),
        new T.MeshStandardMaterial({ color: 0x787f89, roughness: 0.8 }),
      );
      rib.rotation.x = -Math.PI / 2;
      rib.position.set(0, 3.85, -1.5);
      rib.name = "costilla-de-la-cupula";
      world.scene.add(rib);
    }
    b(0, 0.62, -5.35, 2.2, 1.24, 1.2, 0x666b73, true, "stone");
    b(0, 1.31, -5.35, 2.48, 0.13, 1.4, 0xa4a4a0, false, "stone");
    const bronze = new T.MeshStandardMaterial({
      color: 0xa98f65,
      metalness: 0.55,
      roughness: 0.5,
    });
    const wheel = new T.Group();
    wheel.name = "astrolabe-wheel";
    wheel.position.set(0, 2.35, -7.45);
    wheel.rotation.z = (alignmentStage * Math.PI) / 3;
    for (const radius of [0.48, 0.78]) {
      const ring = new T.Mesh(
        new T.TorusGeometry(radius, 0.035, 6, 32),
        bronze,
      );
      wheel.add(ring);
    }
    for (let i = 0; i < 6; i++) {
      const mark = new T.Mesh(new T.BoxGeometry(0.05, 0.2, 0.06), bronze);
      const angle = (i / 6) * Math.PI * 2;
      mark.position.set(Math.sin(angle) * 0.64, Math.cos(angle) * 0.64, 0);
      mark.rotation.z = -angle;
      wheel.add(mark);
    }
    world.scene.add(wheel);
    world.lamp(0, 2.9, -4.7, 0xd1bf91, 7);
  }
}
