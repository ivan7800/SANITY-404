/** Geometry preflight for campaign states. It never certifies played progress. */
import { readFile } from "node:fs/promises";
import ts from "typescript";
import {
  blocked,
  clearAxisLeg,
  move,
  safeSpawn,
} from "../src/systems/collision.ts";
import {
  axisTargetReached,
  interactionRouteOptions,
  planRoute,
  routeObstacles,
} from "./phase22-navigation.mjs";
import {
  advancePuzzle,
  phase2DoorLocked,
  puzzles,
} from "../src/systems/phase2.ts";

const historical = {
  "roman-189": { clue: null, solution: "Marca de Varro", returnAt: [0, -4.2] },
  "mosaic-312": {
    clue: "Pigmento de cinabrio",
    solution: "Boceto recompuesto",
    returnAt: [6.2, -0.6],
  },
  "coast-537": {
    clue: "Tabla de mareas",
    solution: "Registro corregido",
    returnAt: [-6.2, 2.5],
  },
  "stars-783": {
    clue: "Carta astral",
    solution: "Patrón de Samira",
    returnAt: [-6.2, -2.5],
  },
  "quarry-1092": {
    clue: "Cuña marcada",
    solution: "Arco ensamblado",
    returnAt: [-6.2, 0],
  },
  "hospital-1217": {
    clue: "Hierbas de serbal",
    solution: "Remedio identificado",
    returnAt: [2.6, -3.3],
  },
  "abbey-1348": {
    clue: null,
    solution: "Sello de Montfort",
    returnAt: [0, -4.2],
  },
  "press-1491": { returnAt: [0, 4.4] },
  "veyr-1610": { returnAt: [0, 4.4] },
  "theatre-1786": { returnAt: [0, 4.4] },
  "photo-1899": { returnAt: [0, 4.4] },
};
const nextPortals = [
  "mosaic-portal",
  "coast-portal",
  "stars-portal",
  "quarry-portal",
  "hospital-portal",
  "medieval-portal",
  "press-1491-portal",
  "veyr-1610-portal",
  "theatre-1786-portal",
  "photo-1899-portal",
  "legacy-passage",
];
const directRooms = {
  runLucius: [0, 8],
  runAurelia: [12],
  runMaeve: [14],
  runSamira: [16],
  runIdris: [18],
  runOona: [20],
  runIsabelle: [10],
  prepareLegacy: [5, 5, 6, 6, 6, 5],
  runLateChapter: ["late-inner"],
  runElise: [0],
};

function literalNumber(node) {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text);
  return null;
}

/** Parse the actual direct go() calls so a new staging point cannot evade QA. */
export async function campaignDirectGoals() {
  const source = await readFile(
    new URL("./phase22-start-probe.mjs", import.meta.url),
    "utf8",
  );
  const tree = ts.createSourceFile(
    "phase22-start-probe.mjs",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const goals = [];
  const unknown = [];
  const visit = (node, owner) => {
    const functionName =
      ts.isFunctionDeclaration(node) && node.name ? node.name.text : owner;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "go"
    ) {
      const x = node.arguments[0] && literalNumber(node.arguments[0]);
      const z = node.arguments[1] && literalNumber(node.arguments[1]);
      if (x !== null && z !== null && x !== undefined && z !== undefined) {
        goals.push({
          functionName,
          x,
          z,
          line:
            tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
        });
      } else if (
        functionName !== "useObject" &&
        functionName !== "runLateChapter"
      ) {
        unknown.push({
          functionName,
          line:
            tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
        });
      }
    }
    ts.forEachChild(node, (child) => visit(child, functionName));
  };
  visit(tree, null);
  const actualCounts = Object.fromEntries(
    Object.keys(directRooms).map((name) => [name, 0]),
  );
  for (const goal of goals)
    actualCounts[goal.functionName] =
      (actualCounts[goal.functionName] ?? 0) + 1;
  const mismatches = Object.entries(directRooms)
    .filter(([name, rooms]) => actualCounts[name] !== rooms.length)
    .map(
      ([name, rooms]) =>
        `${name}: ${actualCounts[name] ?? 0} llamadas, ${rooms.length} contextos`,
    );
  if (
    unknown.length ||
    mismatches.length ||
    goals.some((goal) => !(goal.functionName in directRooms))
  )
    throw new Error(
      `Actualizar auditoría de destinos reales: ${JSON.stringify({ unknown, mismatches, goals: goals.filter((goal) => !(goal.functionName in directRooms)) })}`,
    );
  return goals.map((goal) => {
    const ordinal =
      goals.filter(
        (candidate) =>
          candidate.functionName === goal.functionName &&
          candidate.line <= goal.line,
      ).length - 1;
    return { ...goal, room: directRooms[goal.functionName][ordinal] };
  });
}

export async function auditCampaignConnectivity({
  World,
  chapters,
  historicalProofs,
  lateChapters,
  newCampaign,
  newPhase2,
  fresh,
  parseSave,
}) {
  const report = {
    method:
      "Escenas reconstruidas para QA; no son partidas jugadas ni guardados preparados para certificación.",
    scenarios: [],
    consecutiveRoutes: [],
    directGoals: [],
    saveRoundTrips: [],
    phase2Gates: [],
    failures: [],
  };
  const story = chapters.filter((chapter) => chapter.id !== "mansion-1927");
  const proof = new Map(historicalProofs);
  const late = new Map(lateChapters.map((chapter) => [chapter.id, chapter]));
  const archiveItems = ["Memoria reconciliada", "Juramento de Lucius"];
  const progress = (completed, current) => {
    const value = newCampaign();
    value.completed = [...completed];
    value.visited = [...value.visited, ...completed];
    if (current && !value.visited.includes(current))
      value.visited.push(current);
    return value;
  };
  const proofItems = (count) =>
    story.slice(0, count).map((chapter) => proof.get(chapter.id));
  const baseItems = (index) => [
    ...proofItems(index),
    ...(index >= 7 ? archiveItems : []),
  ];
  const scene = ({
    room,
    items,
    collected = [],
    read = [],
    campaign,
    phase2,
  }) =>
    new World(
      room,
      items,
      [],
      read,
      collected,
      1.3,
      phase2 ?? newPhase2(),
      campaign,
    );
  const near = (world, point) =>
    world.obstacles
      .map((obstacle) => ({
        id: obstacle.id ?? "decorado",
        x: obstacle.x,
        z: obstacle.z,
        w: obstacle.w,
        d: obstacle.d,
        distance: Math.hypot(
          Math.max(0, Math.abs(point.x - obstacle.x) - obstacle.w / 2),
          Math.max(0, Math.abs(point.z - obstacle.z) - obstacle.d / 2),
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  const verify = ({
    label,
    room,
    items,
    collected,
    read,
    campaign,
    defeated = [],
    phase2,
    start,
    target,
    objectId,
    repairSpawn = false,
  }) => {
    const world = scene({ room, items, collected, read, campaign, phase2 });
    const result = {
      label,
      room,
      campaign: [...campaign.completed],
      items: [...items],
      defeated,
      start,
      target,
      objectId,
      accessible: false,
    };
    let actualStart = start;
    try {
      actualStart = repairSpawn ? safeSpawn(start, world.obstacles) : start;
      if (
        !actualStart ||
        blocked(actualStart.x, actualStart.z, world.obstacles)
      )
        throw new Error("origen ocupado");
      if (repairSpawn) result.arrival = actualStart;
      const object =
        objectId && world.objects.find((entry) => entry.id === objectId);
      if (objectId && !object) throw new Error("objeto aún no disponible");
      const destination = object ? { x: object.x, z: object.z } : target;
      if (!destination) throw new Error("destino ausente");
      const navigation = routeObstacles(world.obstacles, room, 0);
      const interactionGoal = object
        ? interactionRouteOptions(object, world.objects, {
            room,
            obstacles: navigation,
          })
        : null;
      const route = planRoute(actualStart, destination, navigation, {
        goalRadius: interactionGoal?.goalRadius ?? 0.2,
        goalPredicate: interactionGoal?.goalPredicate,
      });
      let previous = actualStart;
      let executed = actualStart;
      let movementSteps = 0;
      for (const [index, waypoint] of route.waypoints.entries()) {
        if (
          !clearAxisLeg(previous, waypoint, navigation, route.legRadii[index])
        )
          throw new Error("segmento de ruta no transitable");
        for (const axis of ["x", "z"]) {
          const axisStart = executed[axis];
          const direction = Math.sign(waypoint[axis] - axisStart);
          while (
            !axisTargetReached(axisStart, waypoint[axis], executed[axis])
          ) {
            if (++movementSteps > 10000)
              throw new Error("ejecución física excede 10000 pasos");
            // One 60 Hz frame at the game's walking speed, without snapping
            // to the waypoint. The overshoot tests corner clearance.
            const delta = (direction * 2.7) / 60;
            const next = move(
              executed.x,
              executed.z,
              axis === "x" ? delta : 0,
              axis === "z" ? delta : 0,
              world.obstacles,
            );
            if (Math.abs(next[axis] - executed[axis]) < 1e-6)
              throw new Error(
                `motor bloqueado en ${axis}: ${JSON.stringify({ actual: executed, waypoint })}`,
              );
            executed = next;
          }
        }
        previous = waypoint;
      }
      const endpointError = Math.hypot(
        executed.x - route.destination.x,
        executed.z - route.destination.z,
      );
      if (endpointError > 0.07)
        throw new Error("motor no alcanzó el destino calculado");
      if (objectId && !interactionGoal.arrivalPredicate(executed)) {
        result.destination = route.destination;
        result.actualEndpoint = executed;
        result.selectedAtPlan = world.nearest(
          route.destination.x,
          route.destination.z,
          1.9,
        )?.id;
        result.selectedAtActual = world.nearest(
          executed.x,
          executed.z,
          1.9,
        )?.id;
        throw new Error("otro objeto seleccionado");
      }
      result.accessible = true;
      result.motorExecuted = true;
      result.movementSteps = movementSteps;
      result.motorEndpointError = endpointError;
      result.destination = route.destination;
      result.actualEndpoint = executed;
      result.waypoints = route.waypoints.length;
      result.strategy = route.strategy;
    } catch (error) {
      result.reason = String(error);
      if (String(error).includes("origen ocupado"))
        result.reasonType = "origen ocupado";
      const diagnosticPoint =
        result.reasonType === "origen ocupado"
          ? start
          : (target ??
            world.objects.find((entry) => entry.id === objectId) ??
            start);
      result.blockers = near(world, diagnosticPoint);
      if (target && blocked(target.x, target.z, world.obstacles)) {
        result.reasonType = "destino ocupado";
        const around = world.nearest(target.x, target.z, 1.9);
        if (around) {
          try {
            const alternative = planRoute(
              actualStart ?? start,
              { x: around.x, z: around.z },
              navigation,
              {
                goalRadius: 1.5,
                goalPredicate: (point) =>
                  world.nearest(point.x, point.z, 1.9)?.id === around.id,
              },
            );
            result.alternative = {
              objectId: around.id,
              point: alternative.destination,
            };
          } catch {
            /* no legitimate alternative around this object */
          }
        }
      }
      report.failures.push(result);
    } finally {
      world.dispose();
    }
    report.scenarios.push(result);
    return result;
  };

  for (const [index, chapter] of story.entries()) {
    const metadata = { ...historical[chapter.id], ...late.get(chapter.id) };
    const before = story.slice(0, index).map((entry) => entry.id);
    const currentProgress = progress(before, chapter.id);
    const items = baseItems(index);
    const battleRoom =
      chapter.id === "roman-189"
        ? 8
        : chapter.id === "abbey-1348"
          ? 10
          : chapter.room + 1;
    const battleStart =
      chapter.id === "roman-189"
        ? { x: -4.27383, z: 4.93027 }
        : { x: 0, z: 5.2 };
    const artifact = proof.get(chapter.id);
    const clue = metadata.clue;
    const solution = metadata.solution;
    const clueItems = clue ? [...items, clue] : [...items];
    const combat = { x: 0, z: 1.4 };
    const phases = [
      {
        name: "antes de combate",
        items: clueItems,
        defeated: [],
        target: combat,
      },
      {
        name: "después de combate",
        items: clueItems,
        defeated: [`enemy${battleRoom}`],
        target: combat,
      },
      {
        name: "después de puzle",
        items: solution ? [...clueItems, solution] : clueItems,
        defeated: [`enemy${battleRoom}`],
      },
      {
        name: "después de artefacto",
        items: [...clueItems, ...(solution ? [solution] : []), artifact],
        collected: [artifact],
        defeated: [`enemy${battleRoom}`],
      },
    ];
    for (const phase of phases) {
      const phaseProgress = structuredClone(currentProgress);
      if (
        chapter.id === "roman-189" &&
        ["después de puzle", "después de artefacto"].includes(phase.name)
      )
        phaseProgress.witnessed.push(
          "roman-formation",
          "roman-echo-ash",
          "roman-echo-tide",
          "roman-echo-threshold",
        );
      const world = scene({
        room: battleRoom,
        items: phase.items,
        collected: phase.collected,
        read: [String(battleRoom)],
        campaign: phaseProgress,
      });
      const objectIds = world.objects
        .filter((entry) => entry.level !== 1 && entry.kind !== "galleryClue")
        .map((entry) => entry.id);
      world.dispose();
      if (phase.target)
        verify({
          label: `${chapter.id}:${phase.name}:combate`,
          room: battleRoom,
          items: phase.items,
          collected: phase.collected,
          read: [String(battleRoom)],
          campaign: phaseProgress,
          defeated: phase.defeated,
          start: battleStart,
          target: phase.target,
        });
      for (const objectId of objectIds)
        verify({
          label: `${chapter.id}:${phase.name}:${objectId}`,
          room: battleRoom,
          items: phase.items,
          collected: phase.collected,
          read: [String(battleRoom)],
          campaign: phaseProgress,
          defeated: phase.defeated,
          start: battleStart,
          objectId,
        });
    }
    if (chapter.room !== battleRoom) {
      for (const [phase, stageItems] of [
        ["entrada", items],
        ["tras pista", clueItems],
      ]) {
        const world = scene({
          room: chapter.room,
          items: stageItems,
          campaign: currentProgress,
        });
        const ids = world.objects
          .filter((entry) => entry.level !== 1 && entry.kind !== "galleryClue")
          .map((entry) => entry.id);
        world.dispose();
        for (const objectId of ids)
          verify({
            label: `${chapter.id}:${phase}:${objectId}`,
            room: chapter.room,
            items: stageItems,
            campaign: currentProgress,
            start: { x: 0, z: 5.2 },
            objectId,
          });
      }
    }
    const completed = story.slice(0, index + 1).map((entry) => entry.id);
    const afterItems = [
      ...proofItems(index + 1),
      ...(index >= 7 ? archiveItems : []),
    ];
    const returnAt = { x: metadata.returnAt[0], z: metadata.returnAt[1] };
    const returnProgress = progress(completed);
    const next = nextPortals[index];
    const returnWorld = scene({
      room: 0,
      items: afterItems,
      collected: proofItems(index + 1),
      campaign: returnProgress,
    });
    const arrived = safeSpawn(returnAt, returnWorld.obstacles);
    returnWorld.dispose();
    if (!arrived) {
      report.failures.push({
        label: `${chapter.id}:regreso`,
        room: 0,
        start: returnAt,
        reason: "sin punto de aparición libre",
      });
      continue;
    }
    verify({
      label: `${chapter.id}:tras regreso:${next}`,
      room: 0,
      items: afterItems,
      collected: proofItems(index + 1),
      campaign: returnProgress,
      start: arrived,
      objectId: next,
    });
    const saved = fresh();
    saved.x = arrived.x;
    saved.z = arrived.z;
    saved.items = [...afterItems];
    saved.collected = proofItems(index + 1);
    saved.campaign = returnProgress;
    saved.defeated = story
      .slice(0, index + 1)
      .map(
        (entry) =>
          `enemy${entry.id === "roman-189" ? 8 : entry.id === "abbey-1348" ? 10 : entry.room + 1}`,
      );
    const restored = parseSave(JSON.stringify(saved));
    report.saveRoundTrips.push({
      chapter: chapter.id,
      valid: Boolean(restored),
      from: arrived,
      to: restored ? { x: restored.x, z: restored.z } : null,
    });
    if (!restored) {
      report.failures.push({
        label: `${chapter.id}:guardado y recarga`,
        room: 0,
        reason: "parseSave rechazó el estado de campaña reconstruido",
      });
      continue;
    }
    verify({
      label: `${chapter.id}:tras guardado y recarga:${next}`,
      room: restored.room,
      items: restored.items,
      collected: restored.collected,
      read: restored.read,
      campaign: restored.campaign,
      defeated: restored.defeated,
      start: { x: restored.x, z: restored.z },
      objectId: next,
    });
    if (index === 0)
      verify({
        label: "roman-189:tras derrotar enemy0:mosaic-portal",
        room: 0,
        items: afterItems,
        collected: proofItems(1),
        campaign: returnProgress,
        defeated: [...restored.defeated, "enemy0"],
        start: { x: 1.34946, z: -2.985 },
        objectId: "mosaic-portal",
      });
  }

  // Linux Mint observation after the seventh chapter. Earlier audits tested
  // objects from a generic room spawn and missed the Oona echo selecting over
  // note5 at the script's former staging coordinate (-4.2, 5).
  const legacyCampaign = progress(
    story.slice(0, 7).map((chapter) => chapter.id),
  );
  const legacyItems = [...baseItems(7), "Juramento de Lucius"];
  const legacy = (label, start, objectId, extra = {}) => {
    const result = verify({
      label: `legacy:${label}:${objectId}`,
      room: 5,
      items: legacyItems,
      read: [],
      campaign: legacyCampaign,
      defeated: ["enemy5"],
      start,
      objectId,
      ...extra,
    });
    report.consecutiveRoutes.push({
      label: result.label,
      start,
      destination: result.destination,
      actualEndpoint: result.actualEndpoint,
      accessible: result.accessible,
    });
    return result;
  };
  const altar = legacy(
    "tras combate",
    { x: 2.8675699999999984, z: -3.80482 },
    "memory-altar",
  );
  const tonic = legacy(
    "tras altar",
    altar.actualEndpoint ?? { x: 2.91239, z: 1.95239 },
    "tonic5",
  );
  const observedAfterTonic = {
    x: 4.351219999999981,
    z: 5.550139999999997,
  };
  const tonicItems = [...legacyItems, "Tónico 5"];
  for (const [dx, dz] of [
    [0, 0],
    [-0.05, 0],
    [0.05, 0],
    [0, -0.05],
    [0, 0.05],
  ])
    legacy(
      `tras tonic5 variación ${dx},${dz}`,
      { x: observedAfterTonic.x + dx, z: observedAfterTonic.z + dz },
      "note5",
      { items: tonicItems, collected: ["Tónico 5"] },
    );
  const note = report.scenarios.find(
    (scenario) => scenario.label === "legacy:tras tonic5 variación 0,0:note5",
  );
  const genealogy = legacy(
    "tras note5",
    note.actualEndpoint ?? observedAfterTonic,
    "genealogy",
    { items: tonicItems, collected: ["Tónico 5"], read: ["5"] },
  );
  const solvedGenealogy = newPhase2();
  for (const answer of puzzles.genealogy.order)
    advancePuzzle(solvedGenealogy, "genealogy", answer);
  const door = legacy(
    "tras genealogy",
    genealogy.actualEndpoint ?? { x: 0, z: -1.9 },
    "greenhouse-door",
    {
      items: tonicItems,
      collected: ["Tónico 5"],
      read: ["5"],
      phase2: solvedGenealogy,
    },
  );
  if (phase2DoorLocked("greenhouse-door", solvedGenealogy) || !door.accessible)
    report.failures.push({
      label: "legacy:transición al invernadero",
      room: 5,
      reason: "genealogy no abrió una puerta físicamente alcanzable",
    });
  if (note?.actualEndpoint) {
    const back = verify({
      label: "legacy:regreso note5 → tonic5",
      room: 5,
      items: tonicItems,
      collected: ["Tónico 5"],
      read: ["5"],
      campaign: legacyCampaign,
      defeated: ["enemy5"],
      start: note.actualEndpoint,
      target: observedAfterTonic,
    });
    report.consecutiveRoutes.push({
      label: back.label,
      start: note.actualEndpoint,
      destination: back.destination,
      actualEndpoint: back.actualEndpoint,
      accessible: back.accessible,
    });
  }

  const goals = await campaignDirectGoals();
  for (const goal of goals) {
    const rooms =
      goal.room === "late-inner"
        ? lateChapters.map((chapter) => chapter.room + 1)
        : [goal.room];
    for (const room of rooms) {
      const chapterIndex = story.findIndex(
        (chapter) => chapter.room === room || chapter.room + 1 === room,
      );
      const count =
        goal.functionName === "runLucius" && room === 0
          ? 0
          : goal.functionName === "prepareLegacy"
            ? 7
            : chapterIndex < 0
              ? story.length
              : chapterIndex;
      const completed = story.slice(0, count).map((chapter) => chapter.id);
      const items = [
        ...baseItems(count),
        ...(goal.functionName === "runElise" ? ["Llave de latón"] : []),
      ];
      const start =
        goal.functionName === "runLucius" && room === 8
          ? { x: -4.27383, z: 4.93027 }
          : goal.functionName === "runElise"
            ? { x: -4, z: 0.2 }
            : { x: 0, z: 5.2 };
      const result = verify({
        label: `script:${goal.functionName}:${goal.line}`,
        room,
        items,
        campaign: progress(completed),
        start,
        target: { x: goal.x, z: goal.z },
      });
      report.directGoals.push({ ...goal, room, accessible: result.accessible });
    }
  }
  // runLateChapter also calls go(0, chapter.portal[1]); its argument is data,
  // so the AST check above cannot read a numeric literal from that call.
  for (const chapter of lateChapters) {
    const index = story.findIndex((entry) => entry.id === chapter.id);
    const completed = story.slice(0, index).map((entry) => entry.id);
    const items = baseItems(index);
    const campaign = progress(completed);
    const world = scene({ room: 0, items, campaign });
    const portal = world.objects.find(
      (entry) => entry.id === `${chapter.id}-portal`,
    );
    world.dispose();
    if (!portal) {
      report.failures.push({
        label: `script:runLateChapter:${chapter.id}:portal`,
        room: 0,
        reason: "portal dinámico no desbloqueado",
      });
      continue;
    }
    const start = index === 7 ? { x: 2.7, z: -4.3 } : { x: 0, z: 4.4 };
    const result = verify({
      label: `script:runLateChapter:${chapter.id}:aproximación`,
      room: 0,
      items,
      campaign,
      start,
      target: { x: 0, z: portal.z },
      repairSpawn: index === 7,
    });
    report.directGoals.push({
      functionName: "runLateChapter",
      expression: "go(0, chapter.portal[1])",
      chapter: chapter.id,
      room: 0,
      target: { x: 0, z: portal.z },
      accessible: result.accessible,
    });
  }
  for (const [room, doorId, puzzleId, targetRoom] of [
    [1, "archive-door", "manuscripts", 5],
    [5, "greenhouse-door", "genealogy", 6],
    [3, "chapel-side", "genealogy", 6],
    [3, "basement-door", "astronomy", 7],
  ]) {
    const phase2 = newPhase2();
    const locked = phase2DoorLocked(doorId, phase2);
    const world = scene({ room, items: [], campaign: newCampaign() });
    const door = world.objects.find((object) => object.id === doorId);
    world.dispose();
    for (const answer of puzzles[puzzleId].order)
      advancePuzzle(phase2, puzzleId, answer);
    const unlocked = phase2DoorLocked(doorId, phase2);
    const result = {
      room,
      doorId,
      puzzleId,
      targetRoom,
      doorPresent: Boolean(door),
      actualTarget: door?.target ?? null,
      lockedBeforePuzzle: Boolean(locked),
      unlockedAfterPuzzle: unlocked === null,
    };
    report.phase2Gates.push(result);
    if (
      !result.doorPresent ||
      result.actualTarget !== targetRoom ||
      !result.lockedBeforePuzzle ||
      !result.unlockedAfterPuzzle
    )
      report.failures.push({
        label: `puerta:${doorId}:requisito`,
        ...result,
      });
  }
  return report;
}
