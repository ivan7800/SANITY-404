/** Static geometry audit. No browser save or campaign state is changed. */
import { writeFile } from "node:fs/promises";
import { createServer } from "vite";
import { planRoute } from "./phase22-navigation.mjs";
import { auditCampaignConnectivity } from "./phase22-dynamic-audit.mjs";

// These are actual staging points used by the continuous campaign probe.
// Interactables and exits are checked separately with World.nearest below.
const combatRooms = new Set([8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28]);
const combatTargets = (room) =>
  combatRooms.has(room)
    ? [{ id: "combat", x: 0, z: 1.4 }]
    : [5, 6].includes(room)
      ? [{ id: "central-passage", x: 0, z: 0 }]
      : [];

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "silent",
});

try {
  const { World, names } = await server.ssrLoadModule("/src/world/scene.ts");
  const { chapters, historicalProofs, newCampaign } =
    await server.ssrLoadModule("/src/systems/campaign.ts");
  const { lateChapters } = await server.ssrLoadModule(
    "/src/systems/late-chapters.ts",
  );
  const { newPhase2 } = await server.ssrLoadModule("/src/systems/phase2.ts");
  const { fresh, parseSave } = await server.ssrLoadModule(
    "/src/systems/state.ts",
  );
  const { mansionEchoes } = await server.ssrLoadModule(
    "/src/world/mansion-echoes.ts",
  );
  const collision = await server.ssrLoadModule("/src/systems/collision.ts");
  const mansion = await server.ssrLoadModule(
    "/src/world/mansion-navigation.ts",
  );
  const { blocked, clearAxisLeg, safeSpawn } = collision;

  function reachableCells(start, obstacles, walkable = () => true) {
    const scale = 5;
    const key = (x, z) => `${x},${z}`;
    const px = Math.round(start.x * scale);
    const pz = Math.round(start.z * scale);
    const queue = [{ x: start.x, z: start.z }];
    const seen = new Set([key(px, pz)]);
    const points = [];
    for (let head = 0; head < queue.length; head++) {
      const point = queue[head];
      points.push(point);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const x = Math.round(point.x * scale) + dx;
        const z = Math.round(point.z * scale) + dz;
        const id = key(x, z);
        const next = { x: x / scale, z: z / scale };
        if (
          seen.has(id) ||
          !walkable(next.x, next.z) ||
          blocked(next.x, next.z, obstacles) ||
          !clearAxisLeg(point, next, obstacles)
        )
          continue;
        seen.add(id);
        queue.push(next);
      }
    }
    return points;
  }

  const variants = [
    { name: "inicio", items: [], campaign: newCampaign() },
    {
      name: "contenido desbloqueado hipotético",
      items: mansionEchoes.map((echo) => echo.item),
      campaign: {
        ...newCampaign(),
        completed: chapters.map((chapter) => chapter.id),
        visited: chapters.map((chapter) => chapter.id),
      },
    },
  ];
  const report = {
    generatedAt: new Date().toISOString(),
    method:
      "Construcción de escenas y búsqueda geométrica en cuadrícula de 0,2 m; no es una partida real.",
    rooms: [],
  };
  for (let room = 0; room < names.length; room++) {
    const record = { room, name: names[room], variants: [] };
    for (const variant of variants) {
      const world = new World(
        room,
        variant.items,
        [],
        [],
        [],
        1.3,
        undefined,
        variant.campaign,
      );
      const spawn = safeSpawn({ x: 0, z: 5.2 }, world.obstacles);
      const points = spawn ? reachableCells(spawn, world.obstacles) : [];
      const objects = world.objects
        .filter((object) => object.level !== 1 && object.kind !== "galleryClue")
        .map((object) => ({
          id: object.id,
          kind: object.kind,
          selected: points.some(
            (point) =>
              Math.hypot(point.x - object.x, point.z - object.z) < 1.9 &&
              world.nearest(point.x, point.z, 1.9)?.id === object.id,
          ),
        }));
      const document = world.objects.find(
        (object) => object.id === `note${room}`,
      );
      const documentPoint = document
        ? points
            .filter(
              (point) =>
                world.nearest(point.x, point.z, 1.9)?.id === document.id,
            )
            .sort(
              (a, b) =>
                Math.hypot(a.x - document.x, a.z - document.z) -
                Math.hypot(b.x - document.x, b.z - document.z),
            )[0]
        : undefined;
      const anchors = combatTargets(room).map((target) => {
        const starts = [
          { id: "entrada", point: spawn },
          { id: "tras-documento", point: documentPoint },
          ...(room === 8
            ? [
                {
                  id: "tras-note8-linux-mint",
                  point: { x: -4.27383, z: 4.93027 },
                },
              ]
            : []),
        ];
        return {
          id: target.id,
          target: [target.x, target.z],
          sources: starts.map(({ id, point }) => {
            try {
              if (!point) throw new Error("Sin posición de entrada libre");
              const route = planRoute(point, target, world.obstacles, {
                goalRadius: 0.2,
              });
              return {
                id,
                accessible: true,
                strategy: route.strategy,
                waypoints: route.waypoints.length,
              };
            } catch (error) {
              return { id, accessible: false, error: String(error) };
            }
          }),
        };
      });
      const upper = [];
      if (room === 0) {
        const upperSpawn = safeSpawn(
          { x: 5.3, z: -5.8 },
          world.upperObstacles,
          mansion.upperWalkable,
        );
        const upperPoints = upperSpawn
          ? reachableCells(
              upperSpawn,
              world.upperObstacles,
              mansion.upperWalkable,
            )
          : [];
        for (const object of world.objects.filter(
          (entry) => entry.level === 1 || entry.kind === "galleryClue",
        ))
          upper.push({
            id: object.id,
            selected: upperPoints.some(
              (point) =>
                Math.hypot(point.x - object.x, point.z - object.z) < 1.9 &&
                world.nearest(point.x, point.z, 1.9, 2.64)?.id === object.id,
            ),
          });
      }
      record.variants.push({
        name: variant.name,
        spawn,
        reachableCells: points.length,
        obstacles: world.obstacles.length,
        ...(room === 8
          ? {
              collisionGeometry: world.obstacles.map(
                ({ id, x, z, w, d, y, height }) => ({
                  id,
                  x,
                  z,
                  w,
                  d,
                  y,
                  height,
                }),
              ),
            }
          : {}),
        upperObstacles: world.upperObstacles.length,
        lights: world.lights.length,
        objects,
        anchors,
        upper,
        unresolved: [...objects, ...upper]
          .filter((entry) => !entry.selected)
          .map((entry) => entry.id)
          .concat(
            anchors.flatMap((anchor) =>
              anchor.sources
                .filter((source) => !source.accessible)
                .map((source) => `${anchor.id}:${source.id}`),
            ),
          ),
      });
      world.dispose();
    }
    report.rooms.push(record);
  }
  report.campaignStates = await auditCampaignConnectivity({
    World,
    chapters,
    historicalProofs,
    lateChapters,
    newCampaign,
    newPhase2,
    fresh,
    parseSave,
  });
  const output = new URL("../docs/RESCATE_SALAS_DATOS.json", import.meta.url);
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  for (const room of report.rooms) {
    const issues = room.variants.flatMap((variant) =>
      variant.unresolved.map((id) => `${variant.name}:${id}`),
    );
    console.log(
      `${String(room.room).padStart(2, "0")} ${room.name}: ${issues.length ? issues.join(", ") : "accesos geométricos detectados"}`,
    );
  }
  if (
    report.rooms.some((room) =>
      room.variants.some((variant) => variant.unresolved.length),
    ) ||
    report.campaignStates.failures.length
  )
    process.exitCode = 1;
  console.log(
    `Estados de campaña: ${report.campaignStates.scenarios.length} rutas comprobadas con motor físico, ${report.campaignStates.consecutiveRoutes.length} tramos consecutivos, ${report.campaignStates.failures.length} inaccesibles, ${report.campaignStates.directGoals.length} destinos directos del script, ${report.campaignStates.phase2Gates.length} puertas con requisitos comprobados`,
  );
  for (const failure of report.campaignStates.failures.slice(0, 12))
    console.error(
      `INACCESIBLE ${failure.label}: ${failure.reason}; sala=${failure.room} destino=${JSON.stringify(failure.target ?? failure.objectId)}`,
    );
  console.log(`Informe: ${output.pathname}`);
} finally {
  await server.close();
}
