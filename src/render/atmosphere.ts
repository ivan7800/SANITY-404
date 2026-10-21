import * as T from "three";
export class Atmosphere {
  dust: T.Points;
  private mist: T.Mesh[] = [];
  private positions: Float32Array;
  private uploadTime = 0;
  constructor(scene: T.Scene, count: number, room = 0) {
    this.positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.positions[i * 3] = Math.sin(i * 11.13) * 7;
      this.positions[i * 3 + 1] = 0.5 + ((i * 0.137) % 3.7);
      this.positions[i * 3 + 2] = Math.cos(i * 17.7) * 7;
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(this.positions, 3));
    this.dust = new T.Points(
      g,
      new T.PointsMaterial({
        size: 0.022,
        color: room === 8 ? 0xe2ad72 : room >= 9 ? 0xb8c4ad : 0xd0bf91,
        transparent: true,
        opacity: 0.27,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    this.dust.name = "Polvo suspendido";
    scene.add(this.dust);
    for (const x of [-6.2, 6.2]) {
      const fog = new T.Mesh(
        new T.SphereGeometry(1, 12, 8),
        new T.MeshBasicMaterial({
          color: room === 8 ? 0x98704d : room >= 9 ? 0x718b7e : 0x778b9a,
          transparent: true,
          opacity: 0.025,
          depthWrite: false,
        }),
      );
      fog.name = "Bruma localizada junto a los muros";
      fog.scale.set(1.1, 0.28, 2.6);
      fog.position.set(x, 0.35, -3);
      scene.add(fog);
      this.mist.push(fog);
    }
  }
  update(dt: number, time: number, reduced: boolean) {
    this.dust.visible = !reduced;
    for (const fog of this.mist)
      fog.position.y = 0.35 + (reduced ? 0 : Math.sin(time * 0.15) * 0.04);
    if (reduced) return;
    for (let i = 0; i < this.positions.length; i += 3) {
      this.positions[i] += Math.sin(time * 0.2 + i) * 0.009 * dt;
      this.positions[i + 1] -= 0.025 * dt;
      if (this.positions[i + 1] < 0.3) this.positions[i + 1] = 4.1;
    }
    // The slow drift is unchanged visually at 15 Hz, while avoiding a GPU
    // buffer upload on every display refresh.
    this.uploadTime += dt;
    if (this.uploadTime >= 1 / 15) {
      this.dust.geometry.attributes.position.needsUpdate = true;
      this.uploadTime = 0;
    }
  }
  dispose() {
    for (const fog of this.mist) {
      fog.geometry.dispose();
      (fog.material as T.Material).dispose();
    }
    this.dust.geometry.dispose();
    (this.dust.material as T.Material).dispose();
  }
}
