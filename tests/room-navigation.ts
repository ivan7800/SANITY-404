import { blocked, type Obstacle } from "../src/systems/state";

/** Reach a standing position in interaction range around solid props. */
export function reachableFromEntrance(
  obstacles: Obstacle[],
  target: { x: number; z: number },
  start = { x: 0, z: 5.2 },
): boolean {
  const scale = 5;
  const toCell = (value: number) => Math.round(value * scale);
  const key = (x: number, z: number) => `${x},${z}`;
  const queue: Array<[number, number]> = [[toCell(start.x), toCell(start.z)]];
  const seen = new Set([key(queue[0][0], queue[0][1])]);
  for (let head = 0; head < queue.length; head++) {
    const [x, z] = queue[head];
    if (Math.hypot(x / scale - target.x, z / scale - target.z) < 1.65)
      return true;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const nz = z + dz;
      const id = key(nx, nz);
      if (seen.has(id) || blocked(nx / scale, nz / scale, obstacles)) continue;
      seen.add(id);
      queue.push([nx, nz]);
    }
  }
  return false;
}
