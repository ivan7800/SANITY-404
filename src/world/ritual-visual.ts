import * as T from "three";

/** Short, pooled-looking procedural effect: two rings and one point cloud. */
export class RitualVisual {
  readonly root = new T.Group();
  readonly duration = 2.1;
  elapsed = 0;
  private rings: T.Mesh[] = [];
  private particles: T.Points;
  private positions: Float32Array;
  constructor(
    scene: T.Scene,
    x: number,
    z: number,
    kind: "veil" | "reading",
    quality = 1.3,
  ) {
    this.positions = new Float32Array((quality === 1 ? 18 : 36) * 3);
    this.root.name = `ritual-${kind}`;
    this.root.position.set(x, 0, z);
    const color = kind === "veil" ? 0xb9b090 : 0x99c7ae;
    for (const radius of [0.55, 0.92]) {
      const ring = new T.Mesh(
        new T.TorusGeometry(radius, 0.025, 5, 32),
        new T.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.15;
      this.root.add(ring);
      this.rings.push(ring);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.BufferAttribute(this.positions, 3).setUsage(T.DynamicDrawUsage),
    );
    this.particles = new T.Points(
      geometry,
      new T.PointsMaterial({
        color,
        size: 0.075,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    this.root.add(this.particles);
    scene.add(this.root);
    this.update(0);
  }
  update(dt: number) {
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    const t = this.elapsed / this.duration;
    const fade = Math.min(1, t * 5, (1 - t) * 4);
    for (let i = 0; i < this.positions.length / 3; i++) {
      const angle = i * 2.39996 + this.elapsed * (i % 2 ? 0.85 : -0.6);
      const radius = 0.16 + (i % 9) * 0.08 + t * 0.18;
      this.positions[i * 3] = Math.cos(angle) * radius;
      this.positions[i * 3 + 1] =
        0.2 + ((i * 7) % 17) * 0.08 + t * (0.55 + (i % 4) * 0.12);
      this.positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    (
      this.particles.geometry.getAttribute("position") as T.BufferAttribute
    ).needsUpdate = true;
    (this.particles.material as T.PointsMaterial).opacity = 0.82 * fade;
    this.rings.forEach((ring, index) => {
      ring.rotation.z = this.elapsed * (index ? -0.62 : 0.75);
      ring.scale.setScalar(1 + t * (index ? 0.42 : 0.2));
      (ring.material as T.MeshBasicMaterial).opacity = 0.62 * fade;
    });
    return this.elapsed < this.duration;
  }
  dispose() {
    this.root.removeFromParent();
    this.root.traverse((object) => {
      if (!(object instanceof T.Mesh || object instanceof T.Points)) return;
      object.geometry.dispose();
      (object.material as T.Material).dispose();
    });
  }
}
