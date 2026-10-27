import { blocked, type Obstacle } from "../systems/state";
import { moveWithin } from "../systems/collision";
import { onMansionLanding } from "./mansion-topology";

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
    const entersFromStair = x > 3.72 && x < 6.28 && z > -5.11;
    const next = moveWithin(x, z, dx, dz, (px, pz) => {
      if (blocked(px, pz, ground)) return false;
      if (!onMansionLanding(px, pz)) return true;
      // Validate the destination floor before changing levels. Otherwise a
      // side approach can place the actor inside an upper-floor exhibit.
      return (
        entersFromStair && upperWalkable(px, pz) && !blocked(px, pz, upper)
      );
    });
    const onTop = onMansionLanding(next.x, next.z);
    return { ...next, level: (onTop ? 1 : 0) as MansionLevel };
  }
  const walkable = (px: number, pz: number) =>
    (upperWalkable(px, pz) ||
      (px > 3.72 && px < 6.28 && pz > -5.6 && pz < -4.9)) &&
    !blocked(px, pz, upper);
  const { x: nx, z: nz } = moveWithin(x, z, dx, dz, walkable);
  const descending = nx > 3.72 && nx < 6.28 && nz > -5.11;
  return { x: nx, z: nz, level: (descending ? 0 : 1) as MansionLevel };
}
