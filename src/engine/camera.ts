import * as T from "three";
import type { Obstacle } from "../systems/state";
export type CameraMode = "classic" | "modern";
export interface CameraContext {
  mode?: CameraMode;
  height?: number;
  enemy?: T.Vector3;
  combat?: boolean;
}
/** World-aligned controls are independent of the authored camera cuts. */
export class CinematicCamera {
  zone = "vestíbulo";
  corrected = false;
  private target = new T.Vector3();
  private initialized = false;
  private ray = new T.Ray();
  private box = new T.Box3();
  update(
    camera: T.PerspectiveCamera,
    x: number,
    z: number,
    room: number,
    dt: number,
    reduced: boolean,
    obstacles: Obstacle[] = [],
    context: CameraContext = {},
  ) {
    let eye: T.Vector3;
    const height = room === 0 ? (context.height ?? 0) : 0;
    if (room === 0) {
      if (height > 0.15) {
        this.zone = z < -5.1 ? "rellano superior" : "escalera Veyr";
        eye =
          z < -5.1
            ? new T.Vector3(6.05, 4.35, -3.1)
            : new T.Vector3(5.45, 3.65, 0.1);
      } else if (x > 4.8 && z > 1.6 && z < 4.6) {
        this.zone = "umbral romano";
        eye = new T.Vector3(3.55, 2.65, 5.75);
      } else if (z > 1) {
        this.zone = "entrada";
        eye = new T.Vector3(6.8, 2.35, 7.25);
      } else if (z > -3.8) {
        this.zone = "galería";
        eye = new T.Vector3(-5.3, 2.1, 3.4);
      } else {
        this.zone = "umbral";
        eye = new T.Vector3(3.3, 1.95, -2.3);
      }
    } else if (z > 3 && [1, 3, 5, 6, 7].includes(room)) {
      this.zone = "mesa de investigación";
      eye = new T.Vector3(room === 6 ? 4.1 : 4.7, 2.2, 6.4);
    } else {
      this.zone = "seguimiento";
      eye = new T.Vector3(
        T.MathUtils.clamp(x + 4, -7.2, 7.2),
        2.15,
        T.MathUtils.clamp(z + 5, -7.2, 7.2),
      );
    }
    if (room === 1 && Math.abs(x) > 5.6) {
      this.zone = "pasillo de estanterías";
      eye.set(Math.sign(x) * 6.35, 1.85, T.MathUtils.clamp(z + 3.2, -7.2, 7.2));
    }
    if (context.mode === "modern") {
      eye.set(
        T.MathUtils.clamp(x + 2.1, -7.2, 7.2),
        height + 2.05,
        T.MathUtils.clamp(z + 3.8, -7.2, 7.2),
      );
    }
    const fighting = context.combat && context.enemy;
    if (fighting) {
      // Keep both actors in the frame without crossing the established camera side.
      eye.lerp(
        new T.Vector3(
          T.MathUtils.clamp(x + 3.2, -7.2, 7.2),
          height + 2.15,
          T.MathUtils.clamp(z + 3.5, -7.2, 7.2),
        ),
        0.45,
      );
    }
    // The historical return portals stand at z=6.1. Their tall meshes are
    // intentionally non-colliding, so the obstacle ray cannot move a camera
    // that sits behind them. Keep the entrance shot inside the sanctuary.
    if (room >= 8 && z > 3) {
      eye.x = T.MathUtils.clamp(x + 3.2, -7.2, 7.2);
      eye.z = Math.min(5.7, z + 1.2);
      this.zone = "entrada histórica";
    }
    const anchor = new T.Vector3(x, height + 1.25, z),
      hit = new T.Vector3();
    const resolve = (position: T.Vector3) => {
      const direction = position.clone().sub(anchor),
        distance = direction.length();
      this.ray.set(anchor, direction.normalize());
      let closest = distance;
      for (const o of obstacles) {
        this.box.min.set(o.x - o.w / 2, 0, o.z - o.d / 2);
        this.box.max.set(o.x + o.w / 2, o.height ?? 2, o.z + o.d / 2);
        if (this.box.containsPoint(anchor)) continue;
        if (this.ray.intersectBox(this.box, hit)) {
          const d = hit.distanceTo(anchor);
          if (d < closest) closest = d;
        }
      }
      if (closest < distance - 0.01) {
        position
          .copy(anchor)
          .addScaledVector(direction, Math.max(0.15, closest - 0.3));
        return true;
      }
      return false;
    };
    this.corrected = resolve(eye);
    camera.position.lerp(eye, reduced || dt === 0 ? 1 : 1 - Math.exp(-dt * 5));
    this.corrected = resolve(camera.position) || this.corrected;
    const desired = anchor.clone();
    if (this.zone === "rellano superior" && context.mode !== "modern")
      desired.set(4.55, height + 1.05, -5.65);
    if (this.zone === "umbral romano" && context.mode !== "modern")
      desired.set(6.55, 1.5, 3);
    if (fighting) desired.lerp(context.enemy!.clone().setY(1.1), 0.35);
    if (!this.initialized || dt === 0 || reduced) this.target.copy(desired);
    else this.target.lerp(desired, 1 - Math.exp(-dt * 7));
    this.initialized = true;
    camera.lookAt(this.corrected ? anchor : this.target);
    const fov = context.mode === "modern" ? 54 : fighting ? 59 : 58;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }
}
