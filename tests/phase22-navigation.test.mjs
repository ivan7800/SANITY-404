import { expect, it } from "vitest";
import { World } from "../src/world/scene.ts";
import { blocked, fresh, parseSave } from "../src/systems/state.ts";
import { mansionThreatAt } from "../src/systems/mansion-threats.ts";
import { mansionMove } from "../src/world/mansion-navigation.ts";
import { onMansionLanding } from "../src/world/mansion-topology.ts";
import { campaignDirectGoals } from "../scripts/phase22-dynamic-audit.mjs";
import { move, safeSpawn } from "../src/systems/collision.ts";
import {
  axisTargetReached,
  planRoute,
  clearLeg,
  clearMovement,
  EXECUTION_RADIUS,
  interactionRouteOptions,
  PLAN_RADIUS,
  blockedForRoute,
  nearestInteractable,
  observedRomanWitness,
  routeObstacles,
} from "../scripts/phase22-navigation.mjs";

it("diagnostica la pausa real de Roma 189 y exige alcanzar cada waypoint", () => {
  const start = { x: -3.2394599999999962, z: 4.210449999999995 };
  const destination = { x: -4.3, z: 5 };
  const world = new World(8, [], [], []);
  try {
    expect(
      observedRomanWitness(8, ["roman-echo-ash"], "Lo que se consume"),
    ).toBe("roman-echo-ash");
    expect(observedRomanWitness(8, [], "Lo que se consume")).toBeNull();
    expect(
      observedRomanWitness(0, ["roman-echo-ash"], "Lo que se consume"),
    ).toBeNull();
    expect(
      observedRomanWitness(8, ["roman-echo-ash"], "Otro panel"),
    ).toBeNull();
    expect(axisTargetReached(-1.03464, -3.3, start.x)).toBe(false);
    expect(axisTargetReached(4.1, 4.3, start.z)).toBe(false);
    expect(blocked(start.x, start.z, world.obstacles)).toBe(false);
    const route = planRoute(start, destination, world.obstacles, {
      preferGrid: true,
      goalRadius: 0.2,
    });
    expect(route.waypoints).toEqual([
      { x: -3.9, z: start.z },
      { x: -3.9, z: 4.5 },
      { x: -4.3, z: 4.5 },
      { x: -4.3, z: 5 },
    ]);
    let actual = start;
    for (const waypoint of route.waypoints) {
      expect(clearMovement(actual, waypoint, world.obstacles)).toBe(true);
      actual = move(
        actual.x,
        actual.z,
        waypoint.x - actual.x,
        waypoint.z - actual.z,
        world.obstacles,
      );
      expect(actual.x).toBeCloseTo(waypoint.x, 4);
      expect(actual.z).toBeCloseTo(waypoint.z, 4);
    }
    expect(actual.x).toBeCloseTo(destination.x, 4);
    expect(actual.z).toBeCloseTo(destination.z, 4);
  } finally {
    world.dispose();
  }
});

it("no sube de costado al rellano ocupado y rodea la escalera hacia Aurelia", () => {
  const state = fresh();
  state.items.push("Marca de Varro", "Tablilla del intervalo");
  state.campaign.completed.push("roman-189");
  state.defeated.push("enemy8", "enemy0");
  const world = new World(
    0,
    state.items,
    state.seals,
    state.read,
    state.collected,
    1.3,
    state.phase2,
    state.campaign,
  );
  try {
    const lastGround = { x: 2.78937, z: -5.63937 };
    const badArrival = { x: 3.73383, z: -5.63937 };
    const chart = world.upperObstacles.find(
      (obstacle) => obstacle.id === "gallery-chart",
    );
    expect(chart).toBeDefined();
    expect(blocked(badArrival.x, badArrival.z, world.obstacles)).toBe(false);
    expect(blocked(badArrival.x, badArrival.z, world.upperObstacles)).toBe(
      true,
    );
    const physical = mansionMove(
      lastGround.x,
      lastGround.z,
      1.05,
      0,
      0,
      world.obstacles,
      world.upperObstacles,
    );
    expect(physical.level).toBe(0);
    expect(physical.x).toBeLessThanOrEqual(3.72);
    expect(blocked(physical.x, physical.z, world.obstacles)).toBe(false);

    const portal = world.objects.find(
      (object) => object.id === "mosaic-portal",
    );
    expect(portal).toBeDefined();
    const navigation = routeObstacles(world.obstacles, 0, 0);
    const selected = (point) =>
      nearestInteractable(point, world.objects, {
        room: 0,
        obstacles: world.obstacles,
      })?.id === portal.id;
    const route = planRoute(lastGround, portal, navigation, {
      goalRadius: 1.5,
      goalPredicate: selected,
    });
    expect(selected(route.destination)).toBe(true);
    let previous = lastGround;
    for (const [index, waypoint] of route.waypoints.entries()) {
      expect(
        clearLeg(previous, waypoint, navigation, route.legRadii[index]),
      ).toBe(true);
      expect(onMansionLanding(waypoint.x, waypoint.z)).toBe(false);
      previous = waypoint;
    }
  } finally {
    world.dispose();
  }
});

it("Tomás e Inés cruzan portales de planta baja realmente seleccionables", () => {
  for (const [id, position, completed] of [
    ["press-1491-portal", { x: 2.6, z: 6.7 }, ["hospital-1217", "abbey-1348"]],
    [
      "veyr-1610-portal",
      { x: 5, z: 6.7 },
      ["hospital-1217", "abbey-1348", "press-1491"],
    ],
  ]) {
    const state = fresh();
    state.campaign.completed.push(...completed);
    const world = new World(
      0,
      state.items,
      state.seals,
      state.read,
      state.collected,
      1.3,
      state.phase2,
      state.campaign,
    );
    try {
      const portal = world.objects.find((object) => object.id === id);
      expect(portal).toMatchObject(position);
      expect(portal.level ?? 0).toBe(0);
      expect(onMansionLanding(portal.x, portal.z)).toBe(false);
      expect(portal.collider.y).toBeLessThan(0.01);
      const selected = (point) =>
        nearestInteractable(point, world.objects, {
          room: 0,
          floor: 0,
          obstacles: world.obstacles,
        })?.id === id;
      const start = { x: 0, z: 4.4 };
      const navigation = routeObstacles(world.obstacles, 0, 0);
      const route = planRoute(start, portal, navigation, {
        goalRadius: 1.5,
        goalPredicate: selected,
      });
      expect(selected(route.destination)).toBe(true);
      let previous = start;
      for (const [index, waypoint] of route.waypoints.entries()) {
        expect(
          clearLeg(previous, waypoint, navigation, route.legRadii[index]),
        ).toBe(true);
        expect(onMansionLanding(waypoint.x, waypoint.z)).toBe(false);
        previous = waypoint;
      }
    } finally {
      world.dispose();
    }
  }
});

it("rodea seal1 desde la posición real sin omitir un waypoint de nueve centímetros", () => {
  const world = new World(1, [], [], []);
  try {
    const start = { x: -0.81, z: -3.78149 };
    const seal = world.obstacles.find((obstacle) => obstacle.id === "seal1");
    expect(seal).toBeDefined();
    expect(seal.w).toBeCloseTo(0.95, 2);
    expect(seal.d).toBeCloseTo(0.7, 2);
    expect(blocked(start.x, start.z, world.obstacles)).toBe(false);
    expect(move(start.x, start.z, 0, -0.1, world.obstacles)).toEqual(start);
    const route = planRoute(start, { x: 0, z: -6 }, world.obstacles, {
      goalRadius: 0.35,
    });
    const clearance = route.waypoints[0];
    expect(clearance.x).toBeLessThan(-0.815);
    expect(Math.abs(clearance.x - start.x)).toBeLessThan(0.1);
    expect(axisTargetReached(start.x, clearance.x, start.x)).toBe(false);
    let actual = start;
    const step = 2.7 / 59.04;
    for (
      let frame = 0;
      frame < 10 && !axisTargetReached(start.x, clearance.x, actual.x);
      frame++
    ) {
      actual = move(actual.x, actual.z, -step, 0, world.obstacles);
    }
    expect(axisTargetReached(start.x, clearance.x, actual.x)).toBe(true);
    expect(blocked(actual.x, actual.z, world.obstacles)).toBe(false);
    expect(
      clearMovement(actual, route.waypoints[1], world.obstacles, 0.34),
    ).toBe(true);
    for (let frame = 0; frame < 100 && actual.z > -5.3; frame++) {
      actual = move(actual.x, actual.z, 0, -step, world.obstacles);
      expect(blocked(actual.x, actual.z, world.obstacles)).toBe(false);
    }
    expect(actual.z).toBeLessThanOrEqual(-5.3);
    expect(
      nearestInteractable({ x: 0, z: -6 }, world.objects, {
        room: 1,
        obstacles: world.obstacles,
      })?.id,
    ).toBe("next");
  } finally {
    world.dispose();
  }
});

it("conecta note8 con el centro de combate de Lucius sin atravesar la estela", () => {
  const world = new World(8, [], [], []);
  try {
    const start = { x: -4.27383, z: 4.93027 };
    const target = { x: 0, z: 1.4 };
    const threshold = world.obstacles.find(
      (obstacle) => obstacle.id === "roman-echo-threshold",
    );
    expect(threshold).toMatchObject({ x: 2, z: 1.35 });
    expect(blocked(start.x, start.z, world.obstacles)).toBe(false);
    expect(blocked(target.x, target.z, world.obstacles)).toBe(false);
    expect(blocked(2, 1.35, world.obstacles)).toBe(true);
    const previousLayout = world.obstacles.map((obstacle) =>
      obstacle.id === "roman-echo-threshold" ? { ...obstacle, x: 0 } : obstacle,
    );
    expect(() =>
      planRoute(start, target, previousLayout, { goalRadius: 0.2 }),
    ).toThrow("Sin destino accesible");
    const route = expectWalkable(start, target, world.obstacles);
    let actual = start;
    for (const waypoint of route.waypoints) {
      for (const axis of ["x", "z"]) {
        while (Math.abs(actual[axis] - waypoint[axis]) > 1e-6) {
          const delta =
            Math.sign(waypoint[axis] - actual[axis]) *
            Math.min(0.04, Math.abs(waypoint[axis] - actual[axis]));
          const next = move(
            actual.x,
            actual.z,
            axis === "x" ? delta : 0,
            axis === "z" ? delta : 0,
            world.obstacles,
          );
          expect(Math.abs(next[axis] - actual[axis])).toBeGreaterThan(0);
          expect(blocked(next.x, next.z, world.obstacles)).toBe(false);
          actual = next;
        }
      }
    }
    expect(Math.hypot(actual.x - target.x, actual.z - target.z)).toBeLessThan(
      0.201,
    );
  } finally {
    world.dispose();
  }
});

it("desde enemy0 derrotado rodea ritual-table y selecciona mosaic-portal", () => {
  const state = fresh();
  state.x = 1.34946;
  state.z = -2.985;
  state.items.push("Marca de Varro", "Tablilla del intervalo");
  state.collected.push("Tablilla del intervalo");
  state.read.push("8");
  state.defeated.push("enemy8", "enemy0");
  state.campaign.visited.push("roman-189");
  state.campaign.completed.push("roman-189");
  state.campaign.witnessed.push(
    "roman-formation",
    "roman-echo-ash",
    "roman-echo-tide",
    "roman-echo-threshold",
  );
  const restored = parseSave(JSON.stringify(state));
  expect(restored).not.toBeNull();
  expect(mansionThreatAt(restored)).toBe("shade");
  const world = new World(
    restored.room,
    restored.items,
    restored.seals,
    restored.read,
    restored.collected,
    1.3,
    restored.phase2,
    restored.campaign,
  );
  try {
    const start = { x: restored.x, z: restored.z };
    const staging = { x: 0, z: 3.1 };
    const table = world.obstacles.find(
      (obstacle) => obstacle.id === "ritual-table",
    );
    expect(table).toMatchObject({ x: 0, z: 2.7 });
    expect(blocked(start.x, start.z, world.obstacles)).toBe(false);
    expect(blocked(staging.x, staging.z, world.obstacles)).toBe(true);
    expect(() =>
      planRoute(start, staging, world.obstacles, { goalRadius: 0.2 }),
    ).toThrow("Sin destino accesible");
    const ritual = world.objects.find((object) => object.id === "ritual-table");
    const ritualRoute = planRoute(start, ritual, world.obstacles, {
      goalRadius: 1.5,
      goalPredicate: (point) =>
        world.nearest(point.x, point.z, 1.9)?.id === ritual.id,
    });
    expect(
      world.nearest(ritualRoute.destination.x, ritualRoute.destination.z, 1.9)
        ?.id,
    ).toBe(ritual.id);
    expect(
      blocked(
        ritualRoute.destination.x,
        ritualRoute.destination.z,
        world.obstacles,
      ),
    ).toBe(false);
    const portal = world.objects.find(
      (object) => object.id === "mosaic-portal",
    );
    expect(portal).toBeDefined();
    const selected = (point) =>
      nearestInteractable(point, world.objects, {
        room: 0,
        floor: 0,
        obstacles: world.obstacles,
      })?.id;
    const navigation = routeObstacles(world.obstacles, 0, 0);
    const route = planRoute(start, portal, navigation, {
      goalRadius: 1.5,
      goalPredicate: (point) => selected(point) === portal.id,
    });
    expect(selected(route.destination)).toBe(portal.id);
    let previous = start;
    for (const [index, point] of route.waypoints.entries()) {
      expect(
        clearMovement(previous, point, navigation, route.legRadii[index]),
      ).toBe(true);
      previous = point;
    }
    expect(world.obstacles.some((obstacle) => obstacle.id === "enemy0")).toBe(
      false,
    );
  } finally {
    world.dispose();
  }
});

it("audita todas las posiciones directas usadas por la campaña", async () => {
  const goals = await campaignDirectGoals();
  // The genealogy puzzle replaces a redundant northbound staging detour.
  expect(goals.length).toBe(16);
  expect(
    goals
      .filter((goal) => goal.functionName === "prepareLegacy")
      .map((goal) => goal.room),
  ).toEqual([5, 5, 6, 6, 6, 5]);
  expect(
    goals.some((goal) => goal.functionName === "runAurelia" && goal.room === 0),
  ).toBe(false);
  expect(goals.some((goal) => goal.x === 0 && goal.z === 3.1)).toBe(false);
  expect(
    goals.some(
      (goal) =>
        goal.functionName === "runLucius" && goal.room === 8 && goal.z === 1.4,
    ),
  ).toBe(true);
});

function expectWalkable(start, target, obstacles, goalRadius = 0.2) {
  const route = planRoute(start, target, obstacles, { goalRadius });
  let previous = start;
  for (const [index, point] of route.waypoints.entries()) {
    expect(
      clearLeg(previous, point, obstacles, route.legRadii[index]),
      `${JSON.stringify(previous)} → ${JSON.stringify(point)}`,
    ).toBe(true);
    expect(blocked(point.x, point.z, obstacles)).toBe(false);
    previous = point;
  }
  expect(previous).toEqual(route.destination);
  expect(
    Math.hypot(previous.x - target.x, previous.z - target.z),
  ).toBeLessThanOrEqual(goalRadius + 0.001);
  return route;
}

it("reproduce la alineación real de sala 5 y alcanza greenhouse-door", () => {
  const world = new World(5, ["Memoria reconciliada"], [], [], ["Tónico 5"]);
  try {
    const afterTonic = { x: 5.70257, z: 5.41568 };
    const afterCorridor = { x: 0.03392, z: 5.41568 };
    const start = { x: 0.03392, z: 0.06266 };
    const target = { x: 5.7, z: 0 };
    expect(blocked(start.x, start.z, world.obstacles)).toBe(false);
    for (const [from, to] of [
      [afterTonic, { x: 0, z: 5.5 }],
      [afterCorridor, { x: 0, z: 0 }],
    ]) {
      const route = planRoute(from, to, world.obstacles);
      expect(route.waypoints.length).toBeGreaterThan(0);
    }
    const selected = (point) =>
      nearestInteractable(point, world.objects, { room: 5 })?.id;
    const options = {
      goalRadius: 0.65,
      goalPredicate: (point) => selected(point) === "greenhouse-door",
    };
    const route = planRoute(start, target, world.obstacles, options);
    let previous = start;
    for (const [index, point] of route.waypoints.entries()) {
      expect(
        clearMovement(previous, point, world.obstacles, route.legRadii[index]),
      ).toBe(true);
      previous = point;
    }
    expect(selected(route.destination)).toBe("greenhouse-door");
    const alternative = planRoute(start, target, world.obstacles, {
      ...options,
      preferGrid: true,
      avoidPoint: route.waypoints[1],
    });
    expect(alternative.waypoints).not.toEqual(route.waypoints);
    expect(selected(alternative.destination)).toBe("greenhouse-door");
  } finally {
    world.dispose();
  }
});

it("reproduce tonic5 → note5 → genealogy → greenhouse-door desde el punto real", () => {
  const world = new World(
    5,
    [
      "Memoria reconciliada",
      "Juramento de Lucius",
      "Cuaderno de Oona",
      "Códice de Montfort",
      "Tónico 5",
    ],
    [],
    ["5"],
    ["Tónico 5"],
  );
  try {
    expect(
      nearestInteractable({ x: -4.2, z: 5 }, world.objects, {
        room: 5,
        obstacles: world.obstacles,
      })?.id,
    ).toBe("mansion-echo-oona");
    let actual = { x: 4.351219999999981, z: 5.550139999999997 };
    for (const id of ["note5", "genealogy", "greenhouse-door"]) {
      const object = world.objects.find((entry) => entry.id === id);
      const options = interactionRouteOptions(object, world.objects, {
        room: 5,
        obstacles: world.obstacles,
      });
      const route = planRoute(actual, options.target, world.obstacles, options);
      for (const waypoint of route.waypoints) {
        expect(clearMovement(actual, waypoint, world.obstacles)).toBe(true);
        actual = move(
          actual.x,
          actual.z,
          waypoint.x - actual.x,
          waypoint.z - actual.z,
          world.obstacles,
        );
        expect(blocked(actual.x, actual.z, world.obstacles)).toBe(false);
      }
      expect(options.arrivalPredicate(actual)).toBe(true);
      expect(Math.hypot(actual.x - object.x, actual.z - object.z)).toBeLessThan(
        1.9,
      );
    }
    expect(
      nearestInteractable({ x: 0, z: -1.9 }, world.objects, {
        room: 5,
        obstacles: world.obstacles,
      })?.id,
    ).toBe("genealogy");
    expect(
      nearestInteractable({ x: 5.7, z: 0 }, world.objects, {
        room: 5,
        obstacles: world.obstacles,
      })?.id,
    ).toBe("greenhouse-door");
  } finally {
    world.dispose();
  }
});

it("replantea el paso hacia el documento si save0 bloquea la posición observada", () => {
  const world = new World(0, [], [], []);
  try {
    const observed = { x: -1.1475, z: 4.46 };
    const attempted = { x: -3.5, z: 4.46 };
    const save = world.obstacles.find((obstacle) => obstacle.id === "save0");
    expect(save).toBeDefined();
    expect(blocked(observed.x, observed.z, world.obstacles)).toBe(false);
    expect(
      clearMovement(observed, attempted, world.obstacles, EXECUTION_RADIUS),
    ).toBe(false);
    expect(blocked(-1.5, observed.z, world.obstacles)).toBe(true);
    const route = planRoute(observed, { x: -4.2, z: 5 }, world.obstacles, {
      goalRadius: 0.35,
      preferGrid: true,
    });
    expect(route.waypoints[0].z).toBeLessThan(observed.z - 0.2);
    let previous = observed;
    for (const waypoint of route.waypoints) {
      expect(
        clearMovement(previous, waypoint, world.obstacles, EXECUTION_RADIUS),
      ).toBe(true);
      previous = waypoint;
    }
    expect(Math.hypot(previous.x + 4.2, previous.z - 5)).toBeLessThan(0.46);
  } finally {
    world.dispose();
  }
});

it("acepta el primer tramo con el radio físico cuando save0 deja solo un milímetro", () => {
  const world = new World(0, [], [], []);
  try {
    const start = { x: -1.1838669230769208, z: 5 };
    const route = planRoute(start, { x: -4.2, z: 5 }, world.obstacles, {
      goalRadius: 0.35,
    });
    expect(route.legRadii[0]).toBe(0.34);
    expect(
      clearMovement(
        start,
        route.waypoints[0],
        world.obstacles,
        EXECUTION_RADIUS,
      ),
    ).toBe(false);
    expect(
      clearMovement(
        start,
        route.waypoints[0],
        world.obstacles,
        route.legRadii[0],
      ),
    ).toBe(true);
  } finally {
    world.dispose();
  }
});

it("atraviesa la mansión entre portales sin exigir el centro bloqueado por el margen", () => {
  const mansion = new World(0, [], [], []);
  try {
    const legacyStart = { x: 6.01991, z: 3.04284 };
    expect(blocked(legacyStart.x, legacyStart.z, mansion.obstacles)).toBe(true);
    const start = safeSpawn(legacyStart, mansion.obstacles);
    expect(start).toBeDefined();
    const staging = { x: -6.2, z: 3.1 };
    const coast = { x: -6.2, z: 2.5 };
    expect(blocked(staging.x, staging.z, mansion.obstacles)).toBe(false);
    expect(blockedForRoute(staging.x, staging.z, mansion.obstacles)).toBe(
      false,
    );
    const crossing = expectWalkable(start, staging, mansion.obstacles);
    expect(crossing.goalDistance).toBeLessThanOrEqual(0.2);
    const portal = planRoute(crossing.destination, coast, mansion.obstacles, {
      goalRadius: 1.5,
    });
    let previous = crossing.destination;
    for (const point of portal.waypoints) {
      expect(clearLeg(previous, point, mansion.obstacles)).toBe(true);
      previous = point;
    }
    expect(Math.hypot(previous.x - coast.x, previous.z - coast.z)).toBeLessThan(
      1.65,
    );
    let current = previous;
    for (const target of [
      { x: -6.2, z: -2.5 },
      { x: 1.8, z: -3.3 },
      { x: -5.8, z: -5.2 },
    ]) {
      const route = planRoute(current, target, mansion.obstacles, {
        goalRadius: 1.5,
      });
      let legStart = current;
      for (const point of route.waypoints) {
        expect(clearLeg(legStart, point, mansion.obstacles)).toBe(true);
        legStart = point;
      }
      expect(
        Math.hypot(legStart.x - target.x, legStart.z - target.z),
      ).toBeLessThan(1.65);
      current = legStart;
    }
  } finally {
    mansion.dispose();
  }
});

it("resuelve Maeve → Samira desde la posición real tras mover el pilar", () => {
  const mansion = new World(0, [], [], []);
  try {
    const start = { x: -6.2, z: 2.5 };
    const target = { x: -6.2, z: -2.5 };
    expect(blocked(start.x, start.z, mansion.obstacles)).toBe(false);
    expect(blockedForRoute(start.x, start.z, mansion.obstacles)).toBe(false);
    const route = planRoute(start, target, mansion.obstacles, {
      goalRadius: 1.5,
    });
    expect(route.waypoints.length).toBeGreaterThan(0);
    let previous = start;
    for (const [index, point] of route.waypoints.entries()) {
      expect(
        clearLeg(previous, point, mansion.obstacles, route.legRadii[index]),
      ).toBe(true);
      previous = point;
    }
    expect(
      Math.hypot(previous.x - target.x, previous.z - target.z),
    ).toBeLessThan(1.5);
  } finally {
    mansion.dispose();
  }
});

it("se acerca al portal seleccionado cuando otro portal está más próximo", () => {
  const mansion = new World(0, [], [], []);
  try {
    const objects = [
      { id: "stars-portal", x: -6.2, z: -2.5 },
      { id: "medieval-portal", x: -5.8, z: -5.2 },
    ];
    const start = { x: -5.72194, z: -3.70473 };
    const target = objects[1];
    const selected = (point) =>
      nearestInteractable(point, objects, { room: 0, floor: 0 })?.id;
    expect(selected(start)).toBe("stars-portal");
    expect(Math.hypot(start.x - target.x, start.z - target.z)).toBeLessThan(
      1.5,
    );
    const route = planRoute(start, target, mansion.obstacles, {
      goalRadius: 1.5,
      goalPredicate: (point) => selected(point) === target.id,
    });
    expect(route.waypoints.length).toBeGreaterThan(0);
    expect(selected(route.destination)).toBe(target.id);
    let previous = start;
    for (const [index, point] of route.waypoints.entries()) {
      expect(
        clearLeg(previous, point, mansion.obstacles, route.legRadii[index]),
      ).toBe(true);
      previous = point;
    }
  } finally {
    mansion.dispose();
  }
});

it("replica la elección del interactuable del juego en ambas plantas", () => {
  for (const roomNumber of [0, 10]) {
    const world = new World(roomNumber, [], [], []);
    try {
      for (const floor of roomNumber === 0 ? [0, 1] : [0]) {
        for (const point of [
          { x: 0, z: 5 },
          { x: 6.2, z: 3 },
          { x: -5.72, z: -3.7 },
          { x: -2.9, z: -3.8 },
        ]) {
          expect(
            nearestInteractable(point, world.objects, {
              room: roomNumber,
              floor,
            })?.id,
          ).toBe(world.nearest(point.x, point.z, 1.9, floor ? 2.64 : 0)?.id);
        }
      }
    } finally {
      world.dispose();
    }
  }
});

it("elige el portal correcto entre accesos históricos vecinos", () => {
  const mansion = new World(0, [], [], []);
  try {
    const objects = [
      { id: "roman", x: 6.2, z: 3 },
      { id: "mosaic", x: 6.2, z: -0.6 },
      { id: "coast", x: -6.2, z: 2.5 },
      { id: "stars", x: -6.2, z: -2.5 },
      { id: "quarry", x: -6.2, z: 0 },
      { id: "hospital", x: 2.6, z: -3.3 },
      { id: "medieval", x: -5.8, z: -5.2 },
      { id: "tomas", x: 2.6, z: 6.7 },
      { id: "ines", x: 5, z: 6.7 },
      { id: "amara", x: -4.2, z: -3.8 },
      { id: "emile", x: -4.2, z: -5.4 },
    ];
    let current = { x: 0, z: 5 };
    for (const target of objects) {
      const selected = (point) =>
        nearestInteractable(point, objects, { room: 0, floor: 0 })?.id;
      const navigation = routeObstacles(mansion.obstacles, 0, 0);
      const route = planRoute(current, target, navigation, {
        goalRadius: 1.5,
        goalPredicate: (point) => selected(point) === target.id,
      });
      expect(selected(route.destination)).toBe(target.id);
      let previous = current;
      for (const [index, point] of route.waypoints.entries()) {
        expect(
          clearLeg(previous, point, navigation, route.legRadii[index]),
        ).toBe(true);
        previous = point;
      }
      current = route.destination;
    }
  } finally {
    mansion.dispose();
  }
});

it("conecta todos los portales históricos de la mansión con trayectos reales", () => {
  const mansion = new World(0, [], [], []);
  try {
    const portals = [
      { x: 6.2, z: 3 },
      { x: 6.2, z: -0.6 },
      { x: -6.2, z: 2.5 },
      { x: -6.2, z: -2.5 },
      { x: -6.2, z: 0 },
      { x: 2.6, z: -3.3 },
      { x: -5.8, z: -5.2 },
      { x: 2.6, z: 6.7 },
      { x: 5, z: 6.7 },
      { x: -4.2, z: -3.8 },
      { x: -4.2, z: -5.4 },
      { x: 0, z: -6 },
    ];
    let start = { x: 0, z: 5 };
    for (const target of portals) {
      const navigation = routeObstacles(mansion.obstacles, 0, 0);
      const route = planRoute(start, target, navigation, {
        goalRadius: 1.5,
      });
      let previous = start;
      for (const [index, point] of route.waypoints.entries()) {
        expect(
          clearLeg(previous, point, navigation, route.legRadii[index]),
          `${JSON.stringify(previous)} → ${JSON.stringify(point)}`,
        ).toBe(true);
        previous = point;
      }
      expect(
        Math.hypot(previous.x - target.x, previous.z - target.z),
      ).toBeLessThanOrEqual(1.5);
      start = previous;
    }
  } finally {
    mansion.dispose();
  }
});

it("encuentra rutas interiores para las doce investigaciones y el final", () => {
  for (const roomNumber of [
    8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 9, 10, 21, 22, 23, 24, 25, 26,
    27, 28, 0, 1, 2, 3, 4,
  ]) {
    const room = new World(roomNumber, [], [], []);
    try {
      const start = roomNumber === 0 ? { x: 0, z: 5 } : { x: 0, z: 5.1 };
      const destinations =
        roomNumber === 0
          ? [{ x: 0, z: -6 }]
          : roomNumber <= 4
            ? [{ x: 0, z: -6 }]
            : [
                { x: 0, z: 1.4 },
                { x: 0, z: -5.1 },
                { x: 0, z: 5.1 },
              ];
      let current = start;
      for (const target of destinations) {
        const route = planRoute(current, target, room.obstacles, {
          goalRadius: 1.5,
        });
        let previous = current;
        for (const [index, point] of route.waypoints.entries()) {
          expect(
            clearLeg(previous, point, room.obstacles, route.legRadii[index]),
            `sala ${roomNumber}: ${JSON.stringify(previous)} → ${JSON.stringify(point)}`,
          ).toBe(true);
          previous = point;
        }
        expect(
          Math.hypot(previous.x - target.x, previous.z - target.z),
          `sala ${roomNumber}`,
        ).toBeLessThanOrEqual(1.5);
        current = previous;
      }
    } finally {
      room.dispose();
    }
  }
});

it("comprueba los recintos restantes del desenlace", () => {
  for (const [roomNumber, target] of [
    [5, { x: 0, z: 0 }],
    [6, { x: 3, z: 4 }],
    [7, { x: 0, z: -4.3 }],
  ]) {
    const room = new World(roomNumber, [], [], []);
    try {
      const start = { x: 0, z: 5.1 };
      const route = planRoute(start, target, room.obstacles, {
        goalRadius: 1.5,
      });
      let previous = start;
      for (const [index, point] of route.waypoints.entries()) {
        expect(
          clearLeg(previous, point, room.obstacles, route.legRadii[index]),
          `sala ${roomNumber}: ${JSON.stringify(previous)} → ${JSON.stringify(point)}`,
        ).toBe(true);
        previous = point;
      }
      expect(
        Math.hypot(previous.x - target.x, previous.z - target.z),
      ).toBeLessThanOrEqual(1.5);
    } finally {
      room.dispose();
    }
  }
});

it("rodea el atril de Isabelle tras vencer a la copista", () => {
  const room = new World(10, [], [], []);
  try {
    const start = { x: 0.71928, z: -2.49203 };
    const target = { x: -2.9, z: -3.8 };
    expect(blocked(-1.8, start.z, room.obstacles)).toBe(true);
    expect(expectWalkable(start, target, room.obstacles).strategy).toBe(
      "a-star",
    );
  } finally {
    room.dispose();
  }
});

it("permite interactuar desde un punto libre cuando el centro está ocupado", () => {
  const obstacle = [{ x: 0, z: 0, w: 1, d: 1 }];
  const route = planRoute({ x: 2, z: 0 }, { x: 0, z: 0 }, obstacle, {
    goalRadius: 1.5,
  });
  expect(route.goalDistance).toBeGreaterThan(0);
  expect(route.goalDistance).toBeLessThan(1.9);
  expect(blocked(route.destination.x, route.destination.z, obstacle)).toBe(
    false,
  );
  let previous = { x: 2, z: 0 };
  for (const point of route.waypoints) {
    expect(clearLeg(previous, point, obstacle)).toBe(true);
    previous = point;
  }
});

it("alcanza coordenadas fuera de la cuadrícula con radio cero y varios giros", () => {
  const obstacles = [
    { x: 0, z: 0.4, w: 0.8, d: 5 },
    { x: -2, z: -2.5, w: 3, d: 0.6 },
  ];
  const start = { x: -2.37, z: 2.63 };
  const target = { x: 2.13, z: -2.67 };
  const route = planRoute(start, target, obstacles, { goalRadius: 0 });
  expect(route.strategy).toBe("a-star");
  expect(route.destination).toEqual(target);
  expect(route.waypoints.length).toBeGreaterThan(3);
  let previous = start;
  for (const [index, point] of route.waypoints.entries()) {
    expect(clearLeg(previous, point, obstacles, route.legRadii[index])).toBe(
      true,
    );
    previous = point;
  }
});

it("encuentra rutas libres para las acciones de Tomás, Inés, Amara, Émile y Élise", () => {
  for (const outer of [21, 23, 25, 27]) {
    const room = new World(outer, [], [], []);
    try {
      let current = { x: 0, z: 5 };
      for (const target of [
        { x: -3.3, z: 5 },
        { x: 2.25, z: -0.8 },
        { x: 0, z: -5.1 },
      ]) {
        current = expectWalkable(
          current,
          target,
          room.obstacles,
          1.5,
        ).destination;
      }
    } finally {
      room.dispose();
    }
  }
  for (const inner of [22, 24, 26, 28]) {
    const room = new World(inner, [], [], []);
    try {
      let current = { x: 0.7, z: -2.5 };
      for (const target of [
        { x: -2.4, z: 1.9 },
        { x: 2.4, z: 1.9 },
        { x: -2.4, z: -1.4 },
        { x: 2.4, z: -3.3 },
        { x: 0, z: 5.1 },
      ]) {
        current = expectWalkable(
          current,
          target,
          room.obstacles,
          1.5,
        ).destination;
      }
    } finally {
      room.dispose();
    }
  }
  for (const roomNumber of [0, 1, 2, 3, 4]) {
    const room = new World(roomNumber, [], [], []);
    try {
      const start = { x: 0, z: 5 };
      const target = { x: 0, z: roomNumber === 4 ? -2.2 : -6 };
      expectWalkable(start, target, room.obstacles);
    } finally {
      room.dispose();
    }
  }
  const mansion = new World(0, [], [], []);
  try {
    for (const portal of [
      { x: 2.6, z: 6.7 },
      { x: 5, z: 6.7 },
      { x: -4.2, z: -3.8 },
      { x: -4.2, z: -5.4 },
    ])
      expectWalkable(
        { x: 0, z: portal.z },
        portal,
        routeObstacles(mansion.obstacles, 0, 0),
      );
  } finally {
    mansion.dispose();
  }
});
