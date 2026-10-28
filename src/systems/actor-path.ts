import { blocked, clearAxisLeg, type Obstacle } from "./collision";

export interface PathPoint {
  x: number;
  z: number;
}

const GRID = 0.2;
const LIMIT = 7.4;
const SIDE = Math.round((LIMIT * 2) / GRID) + 1;
const SIZE = SIDE * SIDE;
const coordinate = (index: number) => -LIMIT + index * GRID;
const point = (key: number): PathPoint => ({
  x: coordinate(key % SIDE),
  z: coordinate(Math.floor(key / SIDE)),
});
const distance = (a: PathPoint, b: PathPoint) =>
  Math.hypot(a.x - b.x, a.z - b.z);

/** A short, floor-bound detour using the same body radius as physical movement. */
export function actorPath(
  start: PathPoint,
  goal: PathPoint,
  obstacles: Obstacle[],
  walkable: (x: number, z: number) => boolean,
  goalRadius = 1.15,
): PathPoint[] | null {
  if (![start.x, start.z, goal.x, goal.z, goalRadius].every(Number.isFinite))
    return null;
  if (!walkable(start.x, start.z) || blocked(start.x, start.z, obstacles))
    return null;
  const valid = new Int8Array(SIZE);
  const canStand = (key: number) => {
    if (valid[key] === 0) {
      const p = point(key);
      valid[key] = walkable(p.x, p.z) && !blocked(p.x, p.z, obstacles) ? 1 : -1;
    }
    return valid[key] === 1;
  };
  const clear = (a: PathPoint, b: PathPoint) => {
    if (!clearAxisLeg(a, b, obstacles)) return false;
    const steps = Math.max(1, Math.ceil(distance(a, b) / 0.04));
    for (let index = 0; index <= steps; index++) {
      const t = index / steps;
      if (!walkable(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  };
  // Connect a non-grid actor position to free neighbours. The first leg may
  // be diagonal, but it is sampled against the physical collision radius.
  const seeds: number[] = [];
  const ix = Math.round((start.x + LIMIT) / GRID);
  const iz = Math.round((start.z + LIMIT) / GRID);
  for (let dz = -2; dz <= 2; dz++)
    for (let dx = -2; dx <= 2; dx++) {
      const x = ix + dx;
      const z = iz + dz;
      if (x < 0 || x >= SIDE || z < 0 || z >= SIDE) continue;
      const key = z * SIDE + x;
      const p = point(key);
      if (distance(start, p) <= 0.5 && canStand(key)) {
        const steps = Math.max(1, Math.ceil(distance(start, p) / 0.04));
        let connected = true;
        for (let index = 0; index <= steps; index++) {
          const t = index / steps;
          const sx = start.x + (p.x - start.x) * t;
          const sz = start.z + (p.z - start.z) * t;
          if (!walkable(sx, sz) || blocked(sx, sz, obstacles)) {
            connected = false;
            break;
          }
        }
        if (connected) seeds.push(key);
      }
    }
  if (!seeds.length) return null;

  const parent = new Int32Array(SIZE).fill(-1);
  const queue = new Int32Array(SIZE);
  let head = 0;
  let tail = 0;
  for (const key of seeds) {
    parent[key] = key;
    queue[tail++] = key;
  }
  let found = -1;
  while (head < tail) {
    const key = queue[head++];
    const p = point(key);
    if (distance(p, goal) <= goalRadius) {
      found = key;
      break;
    }
    const x = key % SIDE;
    const z = Math.floor(key / SIDE);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx < 0 || nx >= SIDE || nz < 0 || nz >= SIDE) continue;
      const next = nz * SIDE + nx;
      if (parent[next] !== -1 || !canStand(next)) continue;
      if (!clear(p, point(next))) continue;
      parent[next] = key;
      queue[tail++] = next;
    }
  }
  if (found < 0) return null;
  const keys: number[] = [];
  for (let key = found; ; key = parent[key]) {
    keys.push(key);
    if (parent[key] === key) break;
  }
  keys.reverse();
  const route = keys.map(point);
  const turns: PathPoint[] = [];
  for (let index = 1; index < route.length - 1; index++) {
    const before = route[index - 1];
    const current = route[index];
    const after = route[index + 1];
    if (
      Math.sign(current.x - before.x) !== Math.sign(after.x - current.x) ||
      Math.sign(current.z - before.z) !== Math.sign(after.z - current.z)
    )
      turns.push(current);
  }
  if (route.length) turns.push(route.at(-1)!);
  return turns;
}
