/** Read-only route planning. The player still walks every leg with game controls. */
import {
  ACTOR_RADIUS,
  blocked,
  clearAxisLeg,
  clearInteractionLine,
} from "../src/systems/collision.ts";
import { MANSION_GROUND_ROUTE_BARRIER } from "../src/world/mansion-topology.ts";

export const PLAYER_RADIUS = ACTOR_RADIUS;
export const PLAN_RADIUS = PLAYER_RADIUS + 0.08;
// The actual movement validator follows the game's radius. Five millimetres
// absorb float rounding while preserving the wider margin for planned lanes.
export const EXECUTION_RADIUS = PLAYER_RADIUS + 0.005;
// World.nearest and the gameplay prompt both use 1.9 m. Keep the destination
// strictly inside that open radius, then require this exact object to win
// selection and line of sight over any nearby interactable.
export const INTERACTION_GOAL_RADIUS = 1.75;
// One automated movement pulse can overshoot a waypoint by approximately a
// 60 Hz walking step (2.7 / 60 m). Include a second step of selection margin.
const INTERACTION_SELECTION_MARGIN = 0.09;
const ESCAPE_RADIUS = PLAYER_RADIUS;
const GRID = 0.2;
const LIMIT = 7.5;
const COUNT = Math.round((LIMIT * 2) / GRID) + 1;
const EPS = 1e-6;

/** The upper landing is physically reachable by its stairs, but is not a
 * ground-floor corridor. Use this boundary only while routing on floor 0. */
export function routeObstacles(obstacles, room, floor = 0) {
  return room === 0 && floor === 0
    ? [...obstacles, MANSION_GROUND_ROUTE_BARRIER]
    : obstacles;
}

export function blockedForRoute(x, z, obstacles, radius = PLAN_RADIUS) {
  return blocked(x, z, obstacles, radius);
}

export function clearLeg(a, b, obstacles, radius = PLAN_RADIUS) {
  return clearAxisLeg(a, b, obstacles, radius);
}

/** Matches goDirect's x-then-z controls from the current observed position. */
export function clearMovement(from, to, obstacles, radius = EXECUTION_RADIUS) {
  const corner = { x: to.x, z: from.z };
  return (
    clearLeg(from, corner, obstacles, radius) &&
    clearLeg(corner, to, obstacles, radius)
  );
}

/** A clearance waypoint is reached only after walking across its coordinate. */
export function axisTargetReached(start, target, current) {
  if (Math.abs(target - start) <= EPS) return true;
  return (current - target) * Math.sign(target - start) >= 0;
}

/** Only a panel backed by a completed player interaction can pause QA walking. */
export function observedRomanWitness(room, witnessed, heading) {
  if (room !== 8) return null;
  return (
    [
      ["roman-echo-ash", "Lo que se consume"],
      ["roman-echo-tide", "Lo que retorna"],
      ["roman-echo-threshold", "Lo que se atraviesa"],
    ].find(([id, title]) => witnessed.includes(id) && heading === title)?.[0] ??
    null
  );
}

function orthogonalRoute(start, target, obstacles, radius) {
  for (const [strategy, corner] of [
    ["x-first", { x: target.x, z: start.z }],
    ["z-first", { x: start.x, z: target.z }],
  ]) {
    if (
      clearLeg(start, corner, obstacles, radius) &&
      clearLeg(corner, target, obstacles, radius)
    )
      return { strategy, waypoints: [corner, target] };
  }
  return null;
}

const coordinate = (index) => -LIMIT + index * GRID;
const cellKey = (x, z) => z * COUNT + x;
const cellPosition = (key) => ({
  x: coordinate(key % COUNT),
  z: coordinate(Math.floor(key / COUNT)),
});
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** Mirrors World.nearest: proximity, interaction radius and mansion level. */
export function nearestInteractable(
  point,
  objects,
  { room, floor = 0, radius = 1.9, obstacles = [] } = {},
) {
  let nearest;
  let best = radius * radius;
  for (const object of objects) {
    if (
      room === 0 &&
      (object.level === 1 || object.kind === "galleryClue") !== (floor === 1)
    )
      continue;
    const squared = (object.x - point.x) ** 2 + (object.z - point.z) ** 2;
    if (
      squared < best &&
      clearInteractionLine(point, object, obstacles, floor ? 3.69 : 1.05)
    ) {
      best = squared;
      nearest = object;
    }
  }
  return nearest;
}

export function interactionRouteOptions(object, objects, context) {
  const selected = (point) =>
    nearestInteractable(point, objects, context)?.id === object.id;
  return {
    target: { x: object.x, z: object.z },
    goalRadius: INTERACTION_GOAL_RADIUS,
    arrivalPredicate: selected,
    goalPredicate: (point) =>
      selected(point) &&
      [
        [INTERACTION_SELECTION_MARGIN, 0],
        [-INTERACTION_SELECTION_MARGIN, 0],
        [0, INTERACTION_SELECTION_MARGIN],
        [0, -INTERACTION_SELECTION_MARGIN],
        [INTERACTION_SELECTION_MARGIN, INTERACTION_SELECTION_MARGIN],
        [INTERACTION_SELECTION_MARGIN, -INTERACTION_SELECTION_MARGIN],
        [-INTERACTION_SELECTION_MARGIN, INTERACTION_SELECTION_MARGIN],
        [-INTERACTION_SELECTION_MARGIN, -INTERACTION_SELECTION_MARGIN],
      ].every(([dx, dz]) => selected({ x: point.x + dx, z: point.z + dz })),
  };
}

class MinHeap {
  items = [];
  push(value) {
    const items = this.items;
    items.push(value);
    for (let i = items.length - 1; i > 0;) {
      const parent = Math.floor((i - 1) / 2);
      if (items[parent].priority <= value.priority) break;
      items[i] = items[parent];
      i = parent;
      items[i] = value;
    }
  }
  pop() {
    const items = this.items;
    const first = items[0];
    const last = items.pop();
    if (items.length) {
      let i = 0;
      while (true) {
        let child = i * 2 + 1;
        if (child >= items.length) break;
        if (
          child + 1 < items.length &&
          items[child + 1].priority < items[child].priority
        )
          child++;
        if (items[child].priority >= last.priority) break;
        items[i] = items[child];
        i = child;
      }
      items[i] = last;
    }
    return first;
  }
  get size() {
    return this.items.length;
  }
}

function routeFromCells(
  start,
  target,
  obstacles,
  parent,
  sources,
  goalKey,
  escape,
) {
  const cells = [];
  for (let key = goalKey; key !== null; key = parent.get(key)) cells.push(key);
  cells.reverse();
  const waypoints = [];
  const legRadii = [];
  let previous = start;
  for (const point of sources.get(cells[0]).waypoints) {
    if (distance(previous, point) > EPS) {
      waypoints.push(point);
      legRadii.push(escape ? ESCAPE_RADIUS : PLAN_RADIUS);
      previous = point;
    }
  }
  let previousDirection;
  for (let i = 1; i < cells.length; i++) {
    const before = cellPosition(cells[i - 1]);
    const after = cellPosition(cells[i]);
    const direction = before.x === after.x ? "z" : "x";
    if (previousDirection && direction !== previousDirection) {
      waypoints.push(before);
      legRadii.push(PLAN_RADIUS);
    }
    previousDirection = direction;
  }
  const destination = cellPosition(goalKey);
  if (distance(waypoints.at(-1) ?? start, destination) > EPS) {
    waypoints.push(destination);
    legRadii.push(PLAN_RADIUS);
  }
  previous = start;
  for (let i = 0; i < waypoints.length; i++) {
    if (!clearLeg(previous, waypoints[i], obstacles, legRadii[i]))
      throw new Error(
        `Segmento inválido: ${JSON.stringify({ previous, point: waypoints[i] })}`,
      );
    previous = waypoints[i];
  }
  return {
    strategy: "a-star",
    destination,
    goalDistance: distance(destination, target),
    waypoints,
    legRadii,
  };
}

/** A* searches walkable cells and accepts any cell inside the goal radius. */
export function planRoute(
  start,
  target,
  obstacles,
  {
    goalRadius = 0.2,
    goalPredicate = () => true,
    preferGrid = false,
    avoidPoint,
  } = {},
) {
  if (
    ![start.x, start.z, target.x, target.z, goalRadius].every(
      Number.isFinite,
    ) ||
    goalRadius < 0
  )
    throw new Error(
      `Parámetros de ruta inválidos: ${JSON.stringify({ start, target, goalRadius })}`,
    );
  if (blockedForRoute(start.x, start.z, obstacles, PLAYER_RADIUS))
    throw new Error(
      `Origen bloqueado para el personaje: ${JSON.stringify(start)}`,
    );
  if (distance(start, target) <= goalRadius && goalPredicate(start))
    return {
      strategy: "already-in-range",
      destination: start,
      goalDistance: distance(start, target),
      waypoints: [],
      legRadii: [],
    };

  const escape = blockedForRoute(start.x, start.z, obstacles, PLAN_RADIUS);
  if (
    !preferGrid &&
    !escape &&
    !blockedForRoute(target.x, target.z, obstacles, PLAN_RADIUS) &&
    goalPredicate(target)
  ) {
    const direct = orthogonalRoute(start, target, obstacles, PLAN_RADIUS);
    if (direct) {
      const waypoints = direct.waypoints.filter(
        (point, i) =>
          distance(point, i ? direct.waypoints[i - 1] : start) > EPS,
      );
      return {
        strategy: direct.strategy,
        destination: target,
        goalDistance: 0,
        waypoints,
        legRadii: waypoints.map(() => PLAN_RADIUS),
      };
    }
  }

  const occupancy = Array.from({ length: COUNT * COUNT }, (_, key) => {
    const point = cellPosition(key);
    return (
      !blockedForRoute(point.x, point.z, obstacles, PLAN_RADIUS) &&
      (!avoidPoint || distance(point, avoidPoint) >= GRID * 0.75)
    );
  });
  const heap = new MinHeap();
  const cost = new Map();
  const parent = new Map();
  const sources = new Map();
  const sourceRadius = escape ? ESCAPE_RADIUS : PLAN_RADIUS;
  for (let key = 0; key < occupancy.length; key++) {
    if (!occupancy[key]) continue;
    const point = cellPosition(key);
    if (distance(start, point) > 1.05) continue;
    const connector = orthogonalRoute(start, point, obstacles, sourceRadius);
    if (!connector) continue;
    const g = Math.abs(start.x - point.x) + Math.abs(start.z - point.z);
    cost.set(key, g);
    parent.set(key, null);
    sources.set(key, connector);
    heap.push({
      key,
      g,
      priority: g + Math.max(0, distance(point, target) - goalRadius),
    });
  }

  let searched = 0;
  while (heap.size) {
    const { key, g } = heap.pop();
    if (g !== cost.get(key)) continue;
    searched++;
    const point = cellPosition(key);
    if (distance(point, target) <= goalRadius + EPS && goalPredicate(point))
      return routeFromCells(
        start,
        target,
        obstacles,
        parent,
        sources,
        key,
        escape,
      );
    // A continuous waypoint need not lie on a grid center. Join it only after
    // checking both axis-aligned tail segments against the same collision map.
    if (
      distance(point, target) <= 0.75 &&
      !blockedForRoute(target.x, target.z, obstacles, PLAN_RADIUS) &&
      goalPredicate(target) &&
      (!avoidPoint || distance(target, avoidPoint) >= GRID * 0.75)
    ) {
      const tail = orthogonalRoute(point, target, obstacles, PLAN_RADIUS);
      if (tail) {
        const route = routeFromCells(
          start,
          target,
          obstacles,
          parent,
          sources,
          key,
          escape,
        );
        let previous = route.destination;
        for (const waypoint of tail.waypoints) {
          if (distance(previous, waypoint) <= EPS) continue;
          route.waypoints.push(waypoint);
          route.legRadii.push(PLAN_RADIUS);
          previous = waypoint;
        }
        route.destination = target;
        route.goalDistance = 0;
        return route;
      }
    }
    const ix = key % COUNT;
    const iz = Math.floor(key / COUNT);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = ix + dx;
      const nz = iz + dz;
      if (nx < 0 || nx >= COUNT || nz < 0 || nz >= COUNT) continue;
      const next = cellKey(nx, nz);
      if (
        !occupancy[next] ||
        !clearLeg(point, cellPosition(next), obstacles, PLAN_RADIUS)
      )
        continue;
      const nextCost = g + GRID;
      if (nextCost >= (cost.get(next) ?? Infinity) - EPS) continue;
      cost.set(next, nextCost);
      parent.set(next, key);
      heap.push({
        key: next,
        g: nextCost,
        priority:
          nextCost +
          Math.max(0, distance(cellPosition(next), target) - goalRadius),
      });
    }
  }
  throw new Error(
    `Sin destino accesible: ${JSON.stringify({ start, target, goalRadius, sources: sources.size, searched })}`,
  );
}
