import type { State } from "./state";
import type { EnemyKind } from "../world/enemies";
import * as T from "three";
import type { Obstacle } from "./state";

export type MansionThreatKind =
  "guest" | "widow" | "crawler" | "wrongReflection" | "nameRoot";
export const mansionThreats: Record<
  MansionThreatKind,
  { id: string; title: string; spawn: [number, number, number]; cue: number }
> = {
  guest: {
    id: "mansion-guest",
    title: "El Huésped Inmóvil",
    spawn: [0, 2.64, -5.8],
    cue: 74,
  },
  widow: {
    id: "mansion-widow",
    title: "La Viuda del Rellano",
    spawn: [5, 2.64, -5.7],
    cue: 126,
  },
  crawler: {
    id: "mansion-crawler",
    title: "El Reptante",
    spawn: [-5, 2.64, -2.1],
    cue: 58,
  },
  wrongReflection: {
    id: "mansion-reflection",
    title: "El Reflejo Equivocado",
    spawn: [-2.35, 2.64, -2.25],
    cue: 202,
  },
  nameRoot: {
    id: "mansion-root",
    title: "La Raíz de los Nombres",
    spawn: [-1.3, 2.64, -2.1],
    cue: 47,
  },
};

/** Only one encounter runs at a time, preserving the existing combat budget. */
export function mansionThreatAt(
  state: Pick<State, "room" | "x" | "z" | "floor" | "sanity" | "items">,
): EnemyKind {
  if (state.room !== 0) return "shade";
  if (state.floor === 0) {
    if (
      state.x > 3.7 &&
      state.z < -1.5 &&
      state.items.includes("Folio del rellano")
    )
      return "widow";
    if (state.sanity < 32 && state.z > 1.5) return "wrongReflection";
    return "shade";
  }
  if (state.x < -3.45 && state.z > -5.15) return "crawler";
  if (state.x < 0.65 && state.z > -5.15) {
    if (
      state.items.includes("Folio del rellano") &&
      state.items.includes("Carta de la raíz")
    )
      return "nameRoot";
    if (state.sanity < 55) return "wrongReflection";
    return "guest";
  }
  return state.x > 3.65 ? "widow" : "guest";
}

export function isObserved(
  playerX: number,
  playerZ: number,
  facing: number,
  enemyX: number,
  enemyZ: number,
) {
  const dx = enemyX - playerX;
  const dz = enemyZ - playerZ;
  const length = Math.hypot(dx, dz);
  return (
    length < 6 &&
    length > 0.01 &&
    (Math.sin(facing) * dx + Math.cos(facing) * dz) / length > 0.35
  );
}

/** The Guest obeys the player's actual view, including occluding walls. */
export function isThreatOnCamera(
  camera: T.Camera,
  enemy: T.Object3D,
  obstacles: Obstacle[],
) {
  camera.updateMatrixWorld();
  const eye = new T.Vector3().setFromMatrixPosition(camera.matrixWorld);
  const target = enemy.position.clone().add(new T.Vector3(0, 1.15, 0));
  const projected = target.clone().project(camera);
  if (
    projected.z < -1 ||
    projected.z > 1 ||
    Math.abs(projected.x) > 0.9 ||
    Math.abs(projected.y) > 0.9
  )
    return false;
  const ray = new T.Ray(eye, target.clone().sub(eye).normalize());
  const hit = new T.Vector3();
  const distance = eye.distanceTo(target);
  return !obstacles.some((o) => {
    const box = new T.Box3(
      new T.Vector3(o.x - o.w / 2, o.y ?? 0, o.z - o.d / 2),
      new T.Vector3(o.x + o.w / 2, (o.y ?? 0) + (o.height ?? 2), o.z + o.d / 2),
    );
    return (
      !box.containsPoint(eye) &&
      !!ray.intersectBox(box, hit) &&
      hit.distanceTo(eye) < distance - 0.2
    );
  });
}
