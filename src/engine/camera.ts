import * as T from "three";
import type { Obstacle } from "../systems/state";
export type CameraMode = "classic" | "modern";
export interface CameraContext {
  mode?: CameraMode;
  height?: number;
  enemy?: T.Vector3;
  combat?: boolean;
  enemyKind?: string;
  focus?: T.Vector3;
  threat?: boolean;
}
/** World-aligned controls are independent of the authored camera cuts. */
export class CinematicCamera {
  zone = "vestíbulo";
  corrected = false;
  private target = new T.Vector3();
  private initialized = false;
  private ray = new T.Ray();
  private box = new T.Box3();
  private modernYaw = 0;

  /** Rotate the optional modern follow camera without changing classic shots. */
  rotateModern(delta: number) {
    if (!Number.isFinite(delta)) return;
    this.modernYaw = T.MathUtils.euclideanModulo(
      this.modernYaw + T.MathUtils.clamp(delta, -0.35, 0.35),
      Math.PI * 2,
    );
  }

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
      if (height > 2.3 && x < 1) {
        this.zone =
          x < -3.4 ? "sala de retratos superior" : "observatorio superior";
        // The gallery door sits between the old camera and Élise. Approach
        // rooms from inside, and keep the gallery camera behind its door line.
        eye =
          z <= -5.1
            ? new T.Vector3(T.MathUtils.clamp(x + 3.5, -5.5, 0.35), 4.5, -7.1)
            : new T.Vector3(
                x < -3.4
                  ? T.MathUtils.clamp(x + 1.1, -5.5, -3.9)
                  : T.MathUtils.clamp(x - 1.3, -2.6, -0.8),
                4.5,
                T.MathUtils.clamp(z + 2, -4.6, -1.9),
              );
      } else if (height > 0.15) {
        this.zone = z < -5.1 ? "rellano superior" : "escalera Veyr";
        eye =
          z < -5.1
            ? new T.Vector3(6.05, 4.35, -3.1)
            : new T.Vector3(5.45, 3.65, 0.1);
      } else if (x > 4.8 && z > 1.6 && z < 4.6) {
        this.zone = "umbral romano";
        eye = new T.Vector3(3.55, 2.65, 5.75);
      } else if (x > 4.2 && z <= -0.9 && z >= -1.55) {
        // The mosaic-bay eye looks through the armchair at the stair foot.
        // Keep the first step in the same camera sequence as the upper flight.
        this.zone = "pie de escalera Veyr";
        eye = new T.Vector3(5.8, 2.35, 1.1);
      } else if (x > 4.8 && z < 0.5 && z > -1.4) {
        this.zone = "umbral del mosaico";
        eye = new T.Vector3(3.7, 2.55, 2.2);
      } else if (z > 1) {
        this.zone = "entrada";
        // The old oblique eye sat inside the east curtain and hid half the
        // rebuilt hall. The central entrance axis frames both side arcades.
        eye = new T.Vector3(-0.55, 2.35, 7.15);
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
      const side = Math.cos(this.modernYaw) * 2.1 + Math.sin(this.modernYaw) * 3.8;
      const behind = Math.cos(this.modernYaw) * 3.8 - Math.sin(this.modernYaw) * 2.1;
      eye.set(
        T.MathUtils.clamp(x + side, -7.2, 7.2),
        height + 2.05,
        T.MathUtils.clamp(z + behind, -7.2, 7.2),
      );
    }
    const fighting = context.combat && context.enemy;
    if (fighting) {
      if (room === 0 && height > 2.3 && x < 1 && z > -5.1) {
        // The generic combat pull crosses the upper rooms' walls and can put
        // the boss directly between the lens and its attack warning.
        if (context.enemyKind === "nameRoot") eye.set(-0.9, 3.95, -6.4);
        else if (context.enemyKind === "wrongReflection")
          eye.set(0.15, 4.55, -4.35);
        else eye.set(x < -3.4 ? -5.9 : -2.55, 4.75, -4.55);
      } else {
        // Keep both actors in the frame without crossing the established camera side.
        eye.lerp(
          new T.Vector3(
            T.MathUtils.clamp(x + 3.2, -7.2, 7.2),
            height + (context.enemyKind === "nameRoot" ? 2.45 : 2.15),
            T.MathUtils.clamp(z + 3.5, -7.2, 7.2),
          ),
          0.45,
        );
      }
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
        this.box.min.set(o.x - o.w / 2, o.y ?? 0, o.z - o.d / 2);
        this.box.max.set(
          o.x + o.w / 2,
          (o.y ?? 0) + (o.height ?? 2),
          o.z + o.d / 2,
        );
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
    camera.position.lerp(
      eye,
      reduced || dt === 0
        ? 1
        : 1 - Math.exp(-dt * (context.mode === "modern" ? 7.5 : 5)),
    );
    this.corrected = resolve(camera.position) || this.corrected;
    const desired = anchor.clone();
    if (this.zone === "rellano superior" && context.mode !== "modern")
      desired.set(4.55, height + 1.05, -5.65);
    if (this.zone === "umbral romano" && context.mode !== "modern")
      desired.set(6.55, 1.5, 3);
    if (fighting)
      desired.lerp(
        context
          .enemy!.clone()
          .add(
            new T.Vector3(
              0,
              context.enemyKind === "crawler"
                ? 0.55
                : context.enemyKind === "nameRoot"
                  ? 1.5
                  : 1.1,
              0,
            ),
          ),
        0.35,
      );
    else if (context.threat && context.enemy && !context.focus)
      desired.lerp(context.enemy.clone().add(new T.Vector3(0, 1.1, 0)), 0.18);
    else if (context.focus && context.focus.distanceTo(anchor) < 2.8)
      desired.lerp(context.focus, 0.42);
    if (!this.initialized || dt === 0 || reduced) this.target.copy(desired);
    else this.target.lerp(desired, 1 - Math.exp(-dt * 7));
    this.initialized = true;
    camera.lookAt(this.corrected ? anchor : this.target);
    const fov =
      fighting && context.enemyKind === "nameRoot"
        ? 68
        : fighting && context.enemyKind === "wrongReflection"
          ? 72
          : context.mode === "modern"
            ? 54
            : room === 0 && height > 2.3 && x < 1
              ? 63
              : fighting || context.focus
                ? 59
                : 58;
    // Smooth lens changes at camera cuts; avoid a projection update at rest.
    if (Math.abs(camera.fov - fov) > 0.03) {
      camera.fov =
        dt === 0 || reduced
          ? fov
          : T.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-dt * 9));
      if (Math.abs(camera.fov - fov) < 0.06) camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }
}
