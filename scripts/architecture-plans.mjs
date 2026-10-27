/** Floor plans from the same World instances and colliders used by gameplay. */
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "vite";
import * as T from "three";

const output = new URL("../docs/planos/", import.meta.url);
await mkdir(output, { recursive: true });
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "silent",
});
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const scale = 36;
const px = (x) => 320 + x * scale;
const pz = (z) => 320 + z * scale;
const circle = (x, z, r, fill, title) =>
  `<circle cx="${px(x)}" cy="${pz(z)}" r="${r}" fill="${fill}"><title>${escape(title)}</title></circle>`;
const box = (obstacle, fill, stroke, opacity = 1) =>
  `<rect x="${px(obstacle.x - obstacle.w / 2)}" y="${pz(obstacle.z - obstacle.d / 2)}" width="${obstacle.w * scale}" height="${obstacle.d * scale}" fill="${fill}" stroke="${stroke}" opacity="${opacity}"><title>${escape(obstacle.id ?? "Obstáculo arquitectónico")} · ${obstacle.w.toFixed(2)} × ${obstacle.d.toFixed(2)} m</title></rect>`;
const distanceToBox = (point, obstacle) =>
  Math.hypot(
    Math.max(0, Math.abs(point.x - obstacle.x) - obstacle.w / 2),
    Math.max(0, Math.abs(point.z - obstacle.z) - obstacle.d / 2),
  );

try {
  const { World, names, enemySpawn } = await server.ssrLoadModule(
    "/src/world/scene.ts",
  );
  const { chapters, historicalProofs, newCampaign } =
    await server.ssrLoadModule("/src/systems/campaign.ts");
  const { mansionEchoes } = await server.ssrLoadModule(
    "/src/world/mansion-echoes.ts",
  );
  const { safeSpawn, ACTOR_RADIUS } = await server.ssrLoadModule(
    "/src/systems/collision.ts",
  );
  const { CinematicCamera } = await server.ssrLoadModule(
    "/src/engine/camera.ts",
  );
  const { upperWalkable } = await server.ssrLoadModule(
    "/src/world/mansion-navigation.ts",
  );
  const campaign = newCampaign();
  campaign.completed = chapters.map((chapter) => chapter.id);
  campaign.visited = [...campaign.completed];
  const items = [
    ...new Map(historicalProofs).values(),
    ...mansionEchoes.map((echo) => echo.item),
    "Memoria reconciliada",
    "Juramento de Lucius",
  ];
  const records = [];
  for (let room = 0; room < names.length; room++) {
    const world = new World(room, items, [], [], [], 1.3, undefined, campaign);
    const spawn = safeSpawn({ x: 0, z: 5.2 }, world.obstacles);
    const upperSpawn =
      room === 0
        ? safeSpawn({ x: 5.3, z: -5.8 }, world.upperObstacles, upperWalkable)
        : null;
    const enemy = enemySpawn(world.obstacles);
    const camera = new T.PerspectiveCamera(55, 1, 0.1, 70);
    let eye = null;
    if (spawn) {
      new CinematicCamera().update(
        camera,
        spawn.x,
        spawn.z,
        room,
        0,
        true,
        world.obstacles,
      );
      eye = { x: camera.position.x, z: camera.position.z };
    }
    const objects = world.objects.map((object) => ({
      id: object.id,
      name: object.name,
      kind: object.kind,
      x: object.x,
      z: object.z,
      level: object.level ?? 0,
      target: object.target ?? null,
    }));
    const furniture = world.obstacles.filter(
      (obstacle) =>
        obstacle.w < 5 &&
        obstacle.d < 5 &&
        Math.abs(obstacle.x) < 7.6 &&
        Math.abs(obstacle.z) < 7.6,
    );
    const accessClearance = objects
      .filter((object) => object.kind === "door")
      .map((object) => {
        const nearest = furniture
          .filter((obstacle) => obstacle.id !== object.id)
          .map((obstacle) => ({
            id: obstacle.id ?? "mueble o columna",
            distance: distanceToBox(object, obstacle),
          }))
          .sort((a, b) => a.distance - b.distance)[0];
        return {
          id: object.id,
          nearest,
          maneuverAreaClear: !nearest || nearest.distance >= 1.2,
        };
      });
    const stairApproach =
      room === 0
        ? [
            { id: "arranque", x: 5, z: -1.55 },
            { id: "rellano", x: 5, z: -5.8 },
          ].map((point) => ({
            ...point,
            nearestFurniture:
              furniture
                .filter((obstacle) =>
                  ["hall-armchair", "hall-writing-desk"].includes(obstacle.id),
                )
                .map((obstacle) => ({
                  id: obstacle.id,
                  distance: distanceToBox(point, obstacle),
                }))
                .sort((a, b) => a.distance - b.distance)[0] ?? null,
          }))
        : [];
    const record = {
      room,
      name: names[room],
      floorBounds: { x: [-8, 8], z: [-8, 8] },
      referenceSpawn: spawn,
      upperReferenceSpawn: upperSpawn,
      representativeCamera: eye,
      actorRadius: ACTOR_RADIUS,
      obstacles: world.obstacles,
      upperObstacles: world.upperObstacles,
      objects,
      accessClearance,
      stairApproach,
      enemyReference: { x: enemy[0], z: enemy[1] },
      lights: world.lights.map((light) => light.position.toArray()),
      basis:
        "Escena con todos los capítulos desbloqueados; plano geométrico, no captura ni partida jugada.",
    };
    records.push(record);
    const visual = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 660" role="img" aria-label="Plano técnico de ${escape(names[room])}">`,
      `<rect width="920" height="660" fill="#101817"/>`,
      `<text x="32" y="26" fill="#e6d8b9" font-family="sans-serif" font-size="19">${String(room).padStart(2, "0")} · ${escape(names[room])}</text>`,
      `<text x="32" y="46" fill="#8fa59c" font-family="sans-serif" font-size="11">Plano de colisiones y objetos · escala 36 px/m · actor r=${ACTOR_RADIUS} m · z− arriba</text>`,
      `<rect x="32" y="32" width="576" height="576" fill="#26332e" stroke="#9a936f"/>`,
    ];
    for (let value = -8; value <= 8; value += 2) {
      visual.push(
        `<path d="M${px(value)} 32V608 M32 ${pz(value)}H608" stroke="#53625b" stroke-opacity=".35"/>`,
      );
    }
    if (room === 0)
      visual.push(
        `<rect x="${px(3.72)}" y="${pz(-6.48)}" width="${(6.28 - 3.72) * scale}" height="${(-1.55 + 6.48) * scale}" fill="#a47748" fill-opacity=".18" stroke="#b28c58" stroke-dasharray="5 3"><title>Escalera y rellano</title></rect>`,
      );
    const objectIds = new Set(objects.map((object) => object.id));
    for (const obstacle of world.obstacles) {
      const wall = obstacle.w > 14 || obstacle.d > 14;
      const prop = obstacle.id && objectIds.has(obstacle.id);
      visual.push(
        box(
          obstacle,
          wall ? "#594e43" : prop ? "#7b6847" : "#516057",
          wall ? "#a08c69" : "#90a392",
          wall ? 0.8 : 0.88,
        ),
      );
    }
    for (const object of objects.filter((entry) => entry.level === 0))
      visual.push(
        circle(
          object.x,
          object.z,
          object.kind === "door" ? 5 : 3.5,
          object.kind === "door" ? "#e8a869" : "#e5d4a7",
          `${object.id}: ${object.name}`,
        ),
      );
    if (spawn)
      visual.push(
        circle(
          spawn.x,
          spawn.z,
          6,
          "#65c4aa",
          "Referencia de aparición para el plano",
        ),
      );
    visual.push(
      circle(
        enemy[0],
        enemy[1],
        5,
        "#bd685e",
        "Aparición genérica del enemigo; la mansión también tiene amenazas dinámicas",
      ),
    );
    if (eye)
      visual.push(circle(eye.x, eye.z, 5, "#78b9df", "Cámara representativa"));
    visual.push(
      `<text x="627" y="75" fill="#e6d8b9" font-family="sans-serif" font-size="15">Accesos y objetivos</text>`,
      `<text x="627" y="98" fill="#8fa59c" font-family="sans-serif" font-size="11">● puerta   ● objeto   ● aparición   ● enemigo   ● cámara</text>`,
    );
    for (const [index, object] of objects
      .filter(
        (entry) =>
          entry.kind === "door" ||
          entry.kind === "phase2Puzzle" ||
          entry.kind === "note",
      )
      .slice(0, 24)
      .entries())
      visual.push(
        `<text x="627" y="${120 + index * 19}" fill="${object.kind === "door" ? "#e8a869" : "#d4c69f"}" font-family="sans-serif" font-size="11">${escape(object.id)} (${object.x.toFixed(1)}, ${object.z.toFixed(1)})${object.level ? " ↑" : ""}</text>`,
      );
    visual.push(
      `<text x="627" y="620" fill="#8fa59c" font-family="sans-serif" font-size="10">Geometría reconstruida para análisis; pendiente de jugar en Chromium.</text>`,
      `</svg>`,
    );
    await writeFile(
      new URL(`${String(room).padStart(2, "0")}.svg`, output),
      visual.join("\n"),
    );
    if (room === 0) {
      const upper = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 660" role="img" aria-label="Plano técnico de la planta alta Moreau">`,
        `<rect width="920" height="660" fill="#101817"/>`,
        `<text x="32" y="26" fill="#e6d8b9" font-family="sans-serif" font-size="19">00 · Galería y habitaciones superiores</text>`,
        `<text x="32" y="46" fill="#8fa59c" font-family="sans-serif" font-size="11">Planta distinta: únicamente los colisionadores superiores gobiernan este recorrido.</text>`,
        `<rect x="32" y="32" width="576" height="576" fill="#1b2422" stroke="#9a936f"/>`,
      ];
      for (const [x, z, w, d] of [
        [0, -5.575, 13.1, 2.15],
        [-5, -3.425, 3.1, 4.15],
        [-1.35, -3.425, 4, 4.15],
      ])
        upper.push(box({ x, z, w, d }, "#34483f", "#4c6d5e"));
      for (const obstacle of world.upperObstacles)
        upper.push(box(obstacle, "#716658", "#a59776", 0.86));
      for (const object of objects.filter((entry) => entry.level === 1))
        upper.push(circle(object.x, object.z, 5, "#e5d4a7", object.name));
      if (upperSpawn)
        upper.push(
          circle(
            upperSpawn.x,
            upperSpawn.z,
            6,
            "#65c4aa",
            "Referencia de desembarco superior",
          ),
        );
      upper.push(
        `<text x="627" y="80" fill="#e6d8b9" font-family="sans-serif" font-size="15">Galería, escalera y dos estancias</text>`,
        `<text x="627" y="110" fill="#8fa59c" font-family="sans-serif" font-size="11">Ver datos.json para alturas y colisionadores.</text>`,
        `</svg>`,
      );
      await writeFile(new URL("00-planta-alta.svg", output), upper.join("\n"));
    }
    world.dispose();
  }
  await writeFile(
    new URL("datos.json", output),
    `${JSON.stringify(records, null, 2)}\n`,
  );
  console.log(`Planos técnicos: ${records.length} salas en ${output.pathname}`);
} finally {
  await server.close();
}
