import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
export function prop(kind: string, id: string, color: number) {
  const g = new T.Group();
  g.name = id;
  const wood = pbr("wood", 0x70503b),
    brass = pbr("brass", color),
    paper = new T.MeshStandardMaterial({ color: 0xc9bfa3, roughness: 1 }),
    dark = new T.MeshStandardMaterial({ color: 0x222b2b });
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };
  const cylinder = (r: number, h: number, y: number, m: T.Material) => {
    const o = new T.Mesh(new T.CylinderGeometry(r, r, h, 10), m);
    o.position.y = y;
    g.add(o);
    return o;
  };
  if (kind === "galleryClue") {
    box(0, 0.35, 0, 0.72, 0.09, 0.46, wood);
    box(0, 0.42, 0, 0.59, 0.025, 0.36, brass);
    const lens = new T.Mesh(new T.TorusGeometry(0.22, 0.03, 8, 24), brass);
    lens.rotation.x = 0.42;
    lens.position.y = 0.67;
    g.add(lens);
    const glass = new T.Mesh(
      new T.CircleGeometry(0.18, 24),
      new T.MeshStandardMaterial({
        color: 0x789a98,
        emissive: 0x173c42,
        transparent: true,
        opacity: 0.72,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    glass.rotation.x = 0.42;
    glass.position.y = 0.67;
    g.add(glass);
    return g;
  }
  if (kind === "door") {
    if (id === "roman-portal") {
      const stone = pbr("stone", 0x323c3a);
      const seam = new T.MeshBasicMaterial({
        color: 0x8ab6a4,
        side: T.DoubleSide,
      });
      box(0, 1.4, 0, 1.82, 2.75, 0.18, stone);
      for (const x of [-0.78, 0.78]) {
        box(x, 1.4, -0.12, 0.13, 2.7, 0.08, brass);
        box(x, 1.4, -0.17, 0.045, 2.55, 0.018, dark);
      }
      const fracture = new T.Shape();
      fracture.moveTo(-0.09, 0.12);
      fracture.lineTo(0.17, 0.55);
      fracture.lineTo(-0.04, 1.02);
      fracture.lineTo(0.2, 1.48);
      fracture.lineTo(-0.11, 1.88);
      fracture.lineTo(0.1, 2.28);
      fracture.lineTo(-0.07, 2.67);
      fracture.lineTo(-0.13, 2.5);
      fracture.lineTo(0.01, 2.24);
      fracture.lineTo(-0.22, 1.85);
      fracture.lineTo(0.08, 1.46);
      fracture.lineTo(-0.14, 1.02);
      fracture.lineTo(0.06, 0.55);
      fracture.lineTo(-0.18, 0.12);
      fracture.closePath();
      const opening = new T.Mesh(new T.ShapeGeometry(fracture), seam);
      opening.position.z = -0.13;
      g.add(opening);
      box(0, 2.73, -0.12, 1.87, 0.12, 0.16, brass);
      box(0, 0.09, -0.16, 1.87, 0.13, 0.22, brass);
      return batchRigid(g);
    }
    box(0, 1.4, 0, 1.9, 2.8, 0.22, wood);
    for (const x of [-0.48, 0.48])
      for (const y of [0.75, 2]) {
        box(x, y, 0.13, 0.7, 1, 0.06, brass);
        box(x, y, 0.18, 0.57, 0.85, 0.05, wood);
      }
    const handle = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), brass);
    handle.position.set(0.63, 1.3, 0.3);
    g.add(handle);
    g.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return batchRigid(g);
  }
  // Functional desk/table with separate legs, drawers and a leather writing surface.
  for (const x of [-0.37, 0.37])
    for (const z of [-0.24, 0.24]) box(x, 0.4, z, 0.08, 0.8, 0.08, wood);
  box(0, 0.84, 0, 0.95, 0.12, 0.7, wood);
  box(0, 0.91, 0, 0.68, 0.025, 0.48, dark);
  box(0, 0.66, 0.17, 0.7, 0.22, 0.18, wood);
  if (kind === "note") {
    box(0, 0.94, 0, 0.43, 0.04, 0.3, brass);
    const leaf = box(0.03, 0.97, 0, 0.36, 0.012, 0.27, paper);
    leaf.rotation.y = 0.1;
    for (let i = 0; i < 5; i++)
      box(0.02, 0.979, -0.09 + i * 0.035, 0.22, 0.004, 0.005, dark);
  } else if (kind === "save") {
    box(-0.2, 0.97, 0, 0.28, 0.07, 0.35, paper);
    cylinder(0.06, 0.14, 0.99, dark);
    const pen = box(0.18, 1.05, 0.04, 0.025, 0.3, 0.025, brass);
    pen.rotation.z = -0.4;
  } else if (kind === "item" && id === "key") {
    const ring = new T.Mesh(new T.TorusGeometry(0.08, 0.018, 6, 12), brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-0.1, 0.97, 0);
    g.add(ring);
    box(0.04, 0.97, 0, 0.19, 0.025, 0.028, brass);
    box(0.12, 0.97, 0.035, 0.03, 0.025, 0.08, brass);
  } else if (kind === "item") {
    const bottle = new T.Mesh(
      new T.CylinderGeometry(0.09, 0.11, 0.25, 10),
      new T.MeshStandardMaterial({
        color: 0x579a86,
        metalness: 0.2,
        roughness: 0.2,
      }),
    );
    bottle.position.y = 1.06;
    g.add(bottle);
    cylinder(0.045, 0.12, 1.24, brass);
    box(0, 1.07, 0.1, 0.1, 0.12, 0.015, paper);
  } else {
    cylinder(0.15, 0.18, 1, brass);
    for (const rotation of [0, Math.PI / 2, Math.PI / 4]) {
      const ring = new T.Mesh(new T.TorusGeometry(0.27, 0.025, 8, 24), brass);
      ring.position.y = 1.35;
      ring.rotation.set(rotation, rotation, 0.4);
      g.add(ring);
    }
    const orb = new T.Mesh(
      new T.IcosahedronGeometry(0.1, 1),
      new T.MeshStandardMaterial({ color: 0x7caea0, emissive: 0x244b44 }),
    );
    orb.position.y = 1.35;
    g.add(orb);
  }
  g.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return batchRigid(g);
}
