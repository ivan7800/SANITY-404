/** Shared world-space collision rules for the game and QA navigation. */
export interface Obstacle {
  id?: string;
  height?: number;
  y?: number;
  x: number;
  z: number;
  w: number;
  d: number;
}

export const WORLD_HALF_SIZE = 8;
export const ACTOR_RADIUS = 0.34;
const MAX_COLLISION_STEP = 0.08;
const SEGMENT_SAMPLE_STEP = 0.04;
const EPS = 1e-6;

export function blocked(
  x: number,
  z: number,
  obstacles: Obstacle[],
  radius = ACTOR_RADIUS,
) {
  return (
    Math.abs(x) > WORLD_HALF_SIZE - radius ||
    Math.abs(z) > WORLD_HALF_SIZE - radius ||
    obstacles.some(
      (o) =>
        Math.abs(x - o.x) < o.w / 2 + radius &&
        Math.abs(z - o.z) < o.d / 2 + radius,
    )
  );
}

/** Axis-aligned leg used by both the route planner and its execution guard. */
export function clearAxisLeg(
  a: { x: number; z: number },
  b: { x: number; z: number },
  obstacles: Obstacle[],
  radius = ACTOR_RADIUS,
) {
  if (Math.abs(a.x - b.x) > EPS && Math.abs(a.z - b.z) > EPS) return false;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / SEGMENT_SAMPLE_STEP),
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (
      blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, obstacles, radius)
    )
      return false;
  }
  return true;
}

/** Interaction line at chest height. The target's own solid body is ignored. */
export function clearInteractionLine(
  from: { x: number; z: number },
  target: { x: number; z: number; id?: string },
  obstacles: Obstacle[],
  eyeHeight = 1.05,
) {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  if (dx * dx + dz * dz < EPS * EPS) return true;
  return !obstacles.some((obstacle) => {
    if (target.id && obstacle.id === target.id) return false;
    const bottom = obstacle.y ?? 0;
    const top = bottom + (obstacle.height ?? 2);
    if (eyeHeight < bottom || eyeHeight > top) return false;
    const minX = obstacle.x - obstacle.w / 2;
    const maxX = obstacle.x + obstacle.w / 2;
    const minZ = obstacle.z - obstacle.d / 2;
    const maxZ = obstacle.z + obstacle.d / 2;
    let entry = 0;
    let exit = 1;
    for (const [origin, delta, low, high] of [
      [from.x, dx, minX, maxX],
      [from.z, dz, minZ, maxZ],
    ]) {
      if (Math.abs(delta) < EPS) {
        if (origin < low || origin > high) return false;
      } else {
        const a = (low - origin) / delta;
        const b = (high - origin) / delta;
        entry = Math.max(entry, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
      }
    }
    return entry <= exit && entry < 1 - EPS && exit > EPS;
  });
}

/**
 * Subdivided actor movement prevents tunnelling during dodges or long frames.
 * Independent axis checks preserve wall sliding without crossing corners.
 */
export function move(
  x: number,
  z: number,
  dx: number,
  dz: number,
  obstacles: Obstacle[],
  radius = ACTOR_RADIUS,
) {
  if (![x, z, dx, dz, radius].every(Number.isFinite) || radius < 0)
    return { x, z };
  return moveWithin(
    x,
    z,
    dx,
    dz,
    (px, pz) => !blocked(px, pz, obstacles, radius),
  );
}

export function moveWithin(
  x: number,
  z: number,
  dx: number,
  dz: number,
  walkable: (x: number, z: number) => boolean,
) {
  if (![x, z, dx, dz].every(Number.isFinite)) return { x, z };
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / MAX_COLLISION_STEP),
  );
  const sx = dx / steps;
  const sz = dz / steps;
  let px = x;
  let pz = z;
  for (let i = 0; i < steps; i++) {
    if (walkable(px + sx, pz)) px += sx;
    if (walkable(px, pz + sz)) pz += sz;
  }
  return { x: px, z: pz };
}

/** Repair a legacy arrival point covered by newly solid scenery. */
export function safeSpawn(
  desired: { x: number; z: number },
  obstacles: Obstacle[],
  walkable: (x: number, z: number) => boolean = () => true,
  radius = ACTOR_RADIUS,
) {
  if (
    walkable(desired.x, desired.z) &&
    !blocked(desired.x, desired.z, obstacles, radius)
  )
    return desired;
  let best: { x: number; z: number } | undefined;
  let bestScore = Infinity;
  for (let distance = 0.1; distance <= 2.4; distance += 0.1) {
    for (let step = 0; step < 32; step++) {
      const angle = (step / 32) * Math.PI * 2;
      const x = desired.x + Math.cos(angle) * distance;
      const z = desired.z + Math.sin(angle) * distance;
      if (!walkable(x, z) || blocked(x, z, obstacles, radius)) continue;
      // Equidistant candidates favour the playable room interior.
      const score = distance + 0.02 * Math.hypot(x, z);
      if (score < bestScore) {
        best = { x, z };
        bestScore = score;
      }
    }
    if (best && distance > bestScore + 0.2) break;
  }
  return best;
}
