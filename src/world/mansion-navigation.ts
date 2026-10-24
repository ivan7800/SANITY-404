import { blocked, move, type Obstacle } from "../systems/state";

export type MansionLevel = 0 | 1;
/** The balcony and two chambers occupy the same map coordinates as the ground floor. */
export function upperWalkable(x: number, z: number, radius = 0.34) {
  const gallery =
    x >= -6.55 + radius &&
    x <= 6.35 - radius &&
    z >= -6.65 + radius &&
    z <= -4.5 - radius;
  const portraitRoom =
    x >= -6.55 + radius &&
    x <= -3.45 - radius &&
    z >= -5.5 + radius &&
    z <= -1.35 - radius;
  const observatory =
    x >= -3.35 + radius &&
    x <= 0.65 - radius &&
    z >= -5.5 + radius &&
    z <= -1.35 - radius;
  return gallery || portraitRoom || observatory;
}

export function mansionMove(
  x: number,
  z: number,
  dx: number,
  dz: number,
  level: MansionLevel,
  ground: Obstacle[],
  upper: Obstacle[],
) {
  if (level === 0) {
    const next = move(x, z, dx, dz, ground);
    const onTop = next.x > 3.72 && next.x < 6.28 && next.z <= -5.11;
    return { ...next, level: (onTop ? 1 : 0) as MansionLevel };
  }
  const walkable = (px: number, pz: number) =>
    (upperWalkable(px, pz) ||
      (px > 3.72 && px < 6.28 && pz > -5.6 && pz < -4.9)) &&
    !blocked(px, pz, upper);
  const nx = walkable(x + dx, z) ? x + dx : x;
  const nz = walkable(nx, z + dz) ? z + dz : z;
  const descending = nx > 3.72 && nx < 6.28 && nz > -5.11;
  return { x: nx, z: nz, level: (descending ? 0 : 1) as MansionLevel };
}
