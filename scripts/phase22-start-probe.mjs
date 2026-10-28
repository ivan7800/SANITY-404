import { chromium, firefox } from "@playwright/test";
import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  axisTargetReached,
  blockedForRoute,
  clearMovement,
  EXECUTION_RADIUS,
  interactionRouteOptions,
  nearestInteractable,
  observedRomanWitness,
  planRoute,
  PLAYER_RADIUS,
  routeObstacles,
} from "./phase22-navigation.mjs";
import { tonicConsumption } from "./phase22-resources.mjs";
import { campaignStartReady } from "./phase22-start-readiness.mjs";
import { phase2DoorLocked, puzzleIds } from "../src/systems/phase2.ts";

const option = (name, fallback) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3) ?? fallback;
const url = option(
  "url",
  process.env.SANITY_TEST_URL || "http://127.0.0.1:5174/",
);
const out = option("output-dir", "docs/capturas/fase22");
const headed = !process.argv.includes("--headless");
const through = option("through", "lucius");
const stages = [
  "lucius",
  "aurelia",
  "maeve",
  "samira",
  "idris",
  "oona",
  "isabelle",
  "tomas",
  "ines",
  "amara",
  "emile",
  "final",
];
if (!stages.includes(through))
  throw new Error(`--through debe ser uno de: ${stages.join(", ")}`);
const stageIndex = stages.indexOf(through);
const chapterCount = Math.min(stageIndex + 1, 11);
const traceName =
  through === "final"
    ? "campana-completa-trace.json"
    : stageIndex >= 5
      ? `campana-hasta-${through}-trace.json`
      : through === "idris"
        ? "lucius-aurelia-maeve-samira-idris-trace.json"
        : through === "samira"
          ? "lucius-aurelia-maeve-samira-trace.json"
          : through === "maeve"
            ? "lucius-aurelia-maeve-trace.json"
            : through === "aurelia"
              ? "lucius-aurelia-trace.json"
              : "lucius-trace.json";
const timeout = Number(option("timeout-ms", "30000"));
if (!Number.isFinite(timeout) || timeout < 1000)
  throw new Error("--timeout-ms debe ser >= 1000");
mkdirSync(out, { recursive: true });
const evidenceStamp = new Date().toISOString().replaceAll(":", "-");
function preservePreviousEvidence(path) {
  if (!existsSync(path)) return;
  const dot = path.lastIndexOf(".");
  copyFileSync(
    path,
    `${path.slice(0, dot)}-${evidenceStamp}${path.slice(dot)}`,
  );
}
preservePreviousEvidence(join(out, traceName));
preservePreviousEvidence(join(out, `${through}-fallo.png`));

const trace = {
  startedAt: new Date().toISOString(),
  url,
  headed,
  browser: process.env.SANITY_BROWSER || "chromium",
  preparedState: false,
  through,
  actions: [],
  checks: [],
  errors: [],
  chapters: [],
  resources: [],
  completed: false,
};
const started = performance.now();
const witnessedDuringNavigation = new Set();
let browser;
let page;
const inspect = () => page.evaluate(() => window.sanityInspect());
const audit = () => page.evaluate(() => window.sanityRoomAudit());

function check(label, condition, details = {}) {
  const passed = Boolean(condition);
  trace.checks.push({ label, passed, details, at: new Date().toISOString() });
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  assert.ok(passed, `${label}: ${JSON.stringify(details)}`);
}

async function snapshot(label, extra = {}) {
  const s = await inspect();
  const entry = {
    label,
    at: new Date().toISOString(),
    wallMs: Math.round(performance.now() - started),
    room: s.state.room,
    x: s.state.x,
    z: s.state.z,
    elapsed: s.state.elapsed,
    health: s.state.health,
    sanity: s.state.sanity,
    items: s.state.items,
    read: s.state.read,
    defeated: s.state.defeated,
    campaign: s.state.campaign,
    enemy: s.enemy,
    combat: s.combat,
    paused: s.paused,
    started: s.started,
    overlayHidden: s.overlayHidden,
    titleTransitionClosed: s.titleTransitionClosed,
    focused: s.focused,
    pressedKeys: s.pressedKeys,
    selectedInteraction: s.interaction?.id ?? null,
    panelHeading: s.paused
      ? await page.locator("#panel h1, #panel h2").first().textContent()
      : null,
    prompt: await page.locator("#prompt").innerText(),
    memory: s.memory,
    ...extra,
  };
  trace.actions.push(entry);
  console.log(
    `ACTION ${label} room=${entry.room} x=${entry.x.toFixed(2)} z=${entry.z.toFixed(2)} health=${entry.health} enemyHP=${entry.combat.enemyHealth}`,
  );
  return s;
}

async function waitObserved(
  label,
  predicate,
  argument = null,
  limit = timeout,
) {
  try {
    return await page.waitForFunction(predicate, argument, { timeout: limit });
  } catch (error) {
    const observed = await inspect().catch(() => null);
    const diagnostic = {
      condition: label,
      room: observed?.state.room ?? null,
      floor: observed?.state.floor ?? null,
      player: observed ? [observed.state.x, observed.state.z] : null,
      selected: observed?.interaction?.id ?? null,
      paused: observed?.paused ?? null,
      started: observed?.started ?? null,
      overlayHidden: observed?.overlayHidden ?? null,
      titleTransitionClosed: observed?.titleTransitionClosed ?? null,
      elapsed: observed?.state.elapsed ?? null,
      health: observed?.state.health ?? null,
      enemy: observed?.enemy ?? null,
      combat: observed?.combat ?? null,
      pressedKeys: observed?.pressedKeys ?? null,
      phase2Solved: observed?.state.phase2.solved ?? null,
      prompt: await page
        .locator("#prompt")
        .innerText()
        .catch(() => null),
      toast: await page
        .locator("#toast")
        .innerText()
        .catch(() => null),
      panel: await page
        .evaluate(
          () =>
            document.querySelector("#panel h1, #panel h2")?.textContent ?? null,
        )
        .catch(() => null),
      focused: await page
        .evaluate(() => document.activeElement?.tagName ?? null)
        .catch(() => null),
      recentInteractionKeys: await page
        .evaluate(() => window.sanityQaInteractionKeys?.slice(-5) ?? [])
        .catch(() => []),
      recentMovementKeys: await page
        .evaluate(() => window.sanityQaMovementKeys?.slice(-20) ?? [])
        .catch(() => []),
      error: String(error),
    };
    trace.actions.push({
      label: "condición no alcanzada",
      at: new Date().toISOString(),
      ...diagnostic,
    });
    check(`Condición observable: ${label}`, false, diagnostic);
  }
}

async function press(key) {
  const frame = (await inspect()).draw.frame;
  await page.keyboard.press(key);
  await waitObserved(
    `fotograma tras tecla ${key}`,
    (before) => window.sanityInspect().draw.frame > before,
    frame,
  );
}

async function waitForRoom(room, playing = false, interactionId = null) {
  try {
    await page.waitForFunction(
      ({ expected, playing }) => {
        const current = window.sanityInspect?.();
        return (
          current?.state.room === expected && (!playing || !current.paused)
        );
      },
      { expected: room, playing },
      { timeout: interactionId ? Math.min(timeout, 5000) : timeout },
    );
  } catch (error) {
    const observed = await inspect();
    const geometry = await audit();
    const target = geometry.interactables.find(
      (entry) => entry.id === interactionId,
    );
    const diagnostic = {
      id: interactionId,
      expectedRoom: room,
      actualRoom: observed.state.room,
      floor: observed.state.floor,
      player: [observed.state.x, observed.state.z],
      target: target ? [target.x, target.z] : null,
      distance: target
        ? Math.hypot(observed.state.x - target.x, observed.state.z - target.z)
        : null,
      selected: observed.interaction?.id ?? null,
      prompt: await page.locator("#prompt").innerText(),
      toast: await page.locator("#toast").innerText(),
      paused: observed.paused,
      panel: await page.evaluate(
        () => document.querySelector("#panel h1, #panel h2")?.textContent,
      ),
      focused: await page.evaluate(() => document.activeElement?.tagName),
      phase2Solved: observed.state.phase2.solved,
      doorLock: interactionId
        ? phase2DoorLocked(interactionId, observed.state.phase2)
        : null,
      recentInteractionKeys: await page.evaluate(() =>
        window.sanityQaInteractionKeys?.slice(-5),
      ),
      cause: String(error),
    };
    trace.actions.push({
      label: "diagnóstico de transición",
      at: new Date().toISOString(),
      ...diagnostic,
    });
    check(
      `Transición a sala ${room} mediante ${interactionId ?? "control"}`,
      false,
      diagnostic,
    );
  }
}

async function capture(name) {
  const prefix =
    {
      lucius: "lucius",
      aurelia: "acumulativa",
      maeve: "triple",
      samira: "cuadruple",
      idris: "quintuple",
    }[through] || through;
  const path = join(out, `${prefix}-${name}.png`);
  await page.screenshot({ path });
  trace.actions.push({ label: "captura", path, at: new Date().toISOString() });
}

async function walk(key, ms, running = false) {
  if (running) await page.keyboard.down("ShiftLeft");
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(ms);
  } finally {
    await page.keyboard.up(key);
    if (running) await page.keyboard.up("ShiftLeft");
  }
}

async function resumeObservedWitness(state, context) {
  if (!state.paused) return false;
  // locator.textContent() waits for an h2 that the title does not contain.
  // During that wait the game may start and the enemy may kill an idle player.
  const heading = await page.evaluate(
    () => document.querySelector("#panel h1, #panel h2")?.textContent ?? null,
  );
  const current = await inspect();
  if (!current.paused) return false;
  if (current.state.health <= 0 || heading === "Tu voz se ha apagado.")
    check("Muerte durante navegación", false, {
      context,
      heading,
      elapsed: current.state.elapsed,
      position: [current.state.x, current.state.z],
      enemy: current.enemy,
      combat: current.combat,
      pressedKeys: current.pressedKeys,
      recentMovementKeys: await page.evaluate(() =>
        window.sanityQaMovementKeys?.slice(-20),
      ),
    });
  const close = page.getByRole("button", { name: "Conservar el testimonio" });
  const witness = observedRomanWitness(
    state.state.room,
    state.state.campaign.witnessed,
    heading,
  );
  if (!witness)
    check("Pausa inesperada durante navegación", false, {
      room: current.state.room,
      position: [current.state.x, current.state.z],
      heading,
      context,
      elapsed: current.state.elapsed,
      health: current.state.health,
      enemy: current.enemy,
      combat: current.combat,
      pressedKeys: current.pressedKeys,
      recentMovementKeys: await page.evaluate(() =>
        window.sanityQaMovementKeys?.slice(-20),
      ),
    });
  check(
    "Pausa de navegación identificada",
    Boolean(witness) && (await close.isVisible()),
    {
      room: state.state.room,
      position: [state.state.x, state.state.z],
      heading,
      context,
      elapsed: current.state.elapsed,
      enemy: current.enemy,
      combat: current.combat,
      pressedKeys: current.pressedKeys,
      recentMovementKeys: await page.evaluate(() =>
        window.sanityQaMovementKeys?.slice(-20),
      ),
    },
  );
  trace.actions.push({
    label: "testimonio abierto durante navegación",
    at: new Date().toISOString(),
    id: witness,
    context,
    room: state.state.room,
    player: [state.state.x, state.state.z],
    recentInteractionKeys: await page.evaluate(() =>
      window.sanityQaInteractionKeys?.slice(-5),
    ),
    gamepads: await page.evaluate(() =>
      Array.from(navigator.getGamepads?.() ?? [])
        .filter(Boolean)
        .map((pad) => ({
          id: pad.id,
          pressedButtons: pad.buttons.flatMap((button, index) =>
            button.pressed ? [index] : [],
          ),
        })),
    ),
  });
  await close.click();
  await waitObserved(
    "panel de testimonio cerrado",
    () => !window.sanityInspect().paused,
  );
  witnessedDuringNavigation.add(witness);
  return true;
}

async function defendCurrentAttack(context) {
  const before = await inspect();
  // F only parries during the weapon's short opening window. Holding it for
  // the whole telegraph guarantees a guarded hit and slowly kills long runs.
  // The remaining windup is observed from the running game, not a sleep.
  if (before.combat.windup > 0.19) {
    await waitObserved(
      `ventana de defensa precisa durante ${context}`,
      () => window.sanityInspect().combat.windup <= 0.19,
      null,
      2500,
    );
  }
  await page.keyboard.down("f");
  const atGuard = await inspect();
  try {
    await waitObserved(
      `fin de ataque durante ${context}`,
      () => window.sanityInspect().combat.windup <= 0,
      null,
      2500,
    );
  } finally {
    await page.keyboard.up("f");
  }
  const after = await inspect();
  trace.actions.push({
    label: "defensa",
    context,
    at: new Date().toISOString(),
    room: before.state.room,
    player: [before.state.x, before.state.z],
    enemyKind: before.combat.kind,
    enemyPosition: before.enemy.position,
    windupBeforeGuard: atGuard.combat.windup,
    healthBefore: before.state.health,
    healthAfter: after.state.health,
    sanityBefore: before.state.sanity,
    sanityAfter: after.state.sanity,
    avoidedDamage: after.state.health === before.state.health,
    parryConfirmed:
      after.state.health === before.state.health &&
      after.state.sanity > before.state.sanity &&
      after.combat.vulnerable > 0,
    staminaAfter: after.combat.stamina,
  });
  if (after.state.health <= 0)
    check("Protagonista sobrevive a la defensa", false, {
      context,
      health: after.state.health,
    });
}

class NavigationBlocked extends Error {
  constructor(details) {
    super(`Movimiento bloqueado: ${JSON.stringify(details)}`);
    this.details = details;
  }
}

async function goDirect(x, z) {
  for (const [axis, target] of [
    ["x", x],
    ["z", z],
  ]) {
    const initial = await inspect();
    const diff = target - initial.state[axis];
    if (Math.abs(diff) < 1e-6) continue;
    const positive = diff > 0;
    const key = axis === "x" ? (positive ? "d" : "a") : positive ? "s" : "w";
    let stalled = 0;
    let dangerLogged = false;
    let pulses = 0;
    const began = performance.now();
    while (true) {
      const before = await inspect();
      if (before.state.health <= 0)
        check(`Movimiento ${axis} interrumpido por muerte`, false, {
          room: before.state.room,
          x: before.state.x,
          z: before.state.z,
          enemy: before.enemy,
          combat: before.combat,
        });
      if (await resumeObservedWitness(before, `hacia ${axis}=${target}`))
        continue;
      const remaining = target - before.state[axis];
      if (axisTargetReached(initial.state[axis], target, before.state[axis]))
        break;
      if (performance.now() - began > timeout)
        check(`Movimiento ${axis} dentro del tiempo`, false, {
          target,
          x: before.state.x,
          z: before.state.z,
          enemy: before.enemy,
          combat: before.combat,
        });

      const enemyDistance = Math.hypot(
        before.enemy.position[0] - before.state.x,
        before.enemy.position[2] - before.state.z,
      );
      if (before.enemy.visible && enemyDistance < 2.5 && !dangerLogged) {
        dangerLogged = true;
        trace.actions.push({
          label: "amenaza durante navegación",
          at: new Date().toISOString(),
          room: before.state.room,
          x: before.state.x,
          z: before.state.z,
          health: before.state.health,
          enemyDistance,
          enemy: before.enemy,
          combat: before.combat,
        });
      }
      if (
        before.enemy.visible &&
        enemyDistance < 2.3 &&
        before.combat.windup > 0
      ) {
        await defendCurrentAttack(`navegación a ${axis}=${target}`);
        continue;
      }

      const running = before.enemy.visible && enemyDistance < 4;
      const stepMs = Math.max(
        20,
        Math.min(180, (Math.abs(remaining) / (running ? 4.1 : 2.7)) * 1000),
      );
      await walk(key, stepMs, running);
      const after = await inspect();
      pulses++;
      if (
        pulses <= 3 ||
        after.state.health < before.state.health ||
        Math.abs(after.state[axis] - before.state[axis]) < 0.025
      )
        trace.actions.push({
          label: "pulso físico de navegación",
          at: new Date().toISOString(),
          key,
          running,
          requestedMs: stepMs,
          before: {
            x: before.state.x,
            z: before.state.z,
            health: before.state.health,
            elapsed: before.state.elapsed,
            paused: before.paused,
            focused: before.focused,
          },
          after: {
            x: after.state.x,
            z: after.state.z,
            health: after.state.health,
            elapsed: after.state.elapsed,
            paused: after.paused,
            focused: after.focused,
          },
          enemy: after.enemy,
          combat: after.combat,
          movementKeys: await page.evaluate(() =>
            window.sanityQaMovementKeys?.slice(-8),
          ),
        });
      if (after.state.health <= 0)
        check(`Movimiento ${axis} interrumpido por muerte`, false, {
          room: after.state.room,
          x: after.state.x,
          z: after.state.z,
          enemy: after.enemy,
          combat: after.combat,
        });
      if (await resumeObservedWitness(after, `tras ${axis}=${target}`)) {
        stalled = 0;
        continue;
      }
      if (after.state.health < before.state.health) {
        trace.actions.push({
          label: "daño durante navegación",
          at: new Date().toISOString(),
          room: after.state.room,
          x: after.state.x,
          z: after.state.z,
          healthBefore: before.state.health,
          healthAfter: after.state.health,
          running,
          enemy: after.enemy,
          combat: after.combat,
        });
      }
      stalled =
        Math.abs(after.state[axis] - before.state[axis]) < 0.025
          ? stalled + 1
          : 0;
      if (stalled >= 3)
        throw new NavigationBlocked({
          room: after.state.room,
          x: after.state.x,
          z: after.state.z,
          axis,
          target,
          enemy: after.enemy,
          combat: after.combat,
        });
    }
    const after = await inspect();
    check(
      `Movimiento hasta ${axis}=${target}`,
      after.state.health > 0 &&
        axisTargetReached(initial.state[axis], target, after.state[axis]),
    );
    trace.actions.push({
      label: "movimiento completado",
      at: new Date().toISOString(),
      room: after.state.room,
      axis,
      target,
      from: [initial.state.x, initial.state.z],
      to: [after.state.x, after.state.z],
      healthBefore: initial.state.health,
      healthAfter: after.state.health,
      enemy: after.enemy,
      combat: after.combat,
    });
  }
}

async function go(x, z, options = {}) {
  const maxReplans = 4;
  let avoidPoint;
  const failedRoutes = new Set();
  for (let attempt = 0; attempt <= maxReplans; attempt++) {
    const before = await inspect();
    const geometry = await audit();
    const obstacles = routeObstacles(
      geometry.navigationObstacles,
      before.state.room,
      before.state.floor,
    );
    let route;
    try {
      route = planRoute(
        { x: before.state.x, z: before.state.z },
        { x, z },
        obstacles,
        { ...options, preferGrid: attempt > 0, avoidPoint },
      );
    } catch (error) {
      const selected = nearestInteractable({ x, z }, geometry.interactables, {
        room: before.state.room,
        floor: before.state.floor,
        obstacles,
      });
      const targetObject = geometry.interactables.find(
        (object) => object.id === options.goalId,
      );
      let alternative;
      if (targetObject) {
        try {
          const interactionGoal = interactionRouteOptions(
            targetObject,
            geometry.interactables,
            {
              room: before.state.room,
              floor: before.state.floor,
              obstacles,
            },
          );
          const candidate = planRoute(
            { x: before.state.x, z: before.state.z },
            interactionGoal.target,
            obstacles,
            interactionGoal,
          );
          alternative = {
            selected: targetObject.id,
            destination: candidate.destination,
            waypoints: candidate.waypoints,
          };
        } catch {
          // A genuinely isolated object has no alternative perimeter route.
        }
      }
      const nearbyColliders = obstacles
        .map((obstacle) => ({
          id: obstacle.id ?? "decorado",
          x: obstacle.x,
          z: obstacle.z,
          w: obstacle.w,
          d: obstacle.d,
          distance: Math.hypot(
            Math.max(0, Math.abs(x - obstacle.x) - obstacle.w / 2),
            Math.max(0, Math.abs(z - obstacle.z) - obstacle.d / 2),
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);
      trace.actions.push({
        label: "ruta inaccesible",
        at: new Date().toISOString(),
        room: before.state.room,
        campaign: before.state.campaign,
        defeated: before.state.defeated,
        items: before.state.items,
        start: { x: before.state.x, z: before.state.z },
        target: { x, z },
        goalId: options.goalId ?? null,
        selectedAtTarget: selected?.id ?? null,
        targetOccupied: blockedForRoute(x, z, obstacles, PLAYER_RADIUS),
        nearbyColliders,
        alternative,
        reason: String(error),
      });
      throw error;
    }
    const signature = JSON.stringify({
      from: [
        Math.round(before.state.x * 10) / 10,
        Math.round(before.state.z * 10) / 10,
      ],
      waypoints: route.waypoints,
    });
    if (failedRoutes.has(signature))
      check("Ruta alternativa tras bloqueo", false, {
        room: before.state.room,
        x: before.state.x,
        z: before.state.z,
        target: { x, z },
        waypoints: route.waypoints,
      });
    trace.actions.push({
      label: "ruta libre calculada",
      at: new Date().toISOString(),
      room: before.state.room,
      attempt,
      strategy: route.strategy,
      from: [before.state.x, before.state.z],
      target: [x, z],
      destination: route.destination,
      goalDistance: route.goalDistance,
      waypoints: route.waypoints,
      legRadii: route.legRadii,
      avoidPoint,
    });
    try {
      for (let i = 0; i < route.waypoints.length; i++) {
        const point = route.waypoints[i];
        const state = (await inspect()).state;
        const current = { x: state.x, z: state.z };
        const executionRadius = Math.min(EXECUTION_RADIUS, route.legRadii[i]);
        if (!clearMovement(current, point, obstacles, executionRadius))
          throw new NavigationBlocked({
            room: state.room,
            x: state.x,
            z: state.z,
            target: point,
            plannedRadius: route.legRadii[i],
            executionRadius,
            reason: "segmento ya no transitable desde la posición real",
          });
        if (!clearMovement(current, point, obstacles, route.legRadii[i]))
          trace.actions.push({
            label: "paso dentro del margen físico",
            at: new Date().toISOString(),
            room: state.room,
            from: current,
            to: point,
            plannedRadius: route.legRadii[i],
            executionRadius,
          });
        try {
          await goDirect(point.x, point.z);
        } catch (error) {
          if (!(error instanceof NavigationBlocked)) throw error;
          throw new NavigationBlocked({
            ...error.details,
            waypoint: point,
          });
        }
      }
      const after = (await inspect()).state;
      const remaining = Math.hypot(after.x - x, after.z - z);
      if (
        remaining <= (options.goalRadius ?? 0.2) + 0.14 &&
        (options.arrivalPredicate?.({ x: after.x, z: after.z }) ??
          options.goalPredicate?.({ x: after.x, z: after.z }) ??
          true)
      )
        return;
      throw new NavigationBlocked({
        room: after.room,
        x: after.x,
        z: after.z,
        target: { x, z },
        remaining,
        reason: "fuera del radio de destino",
      });
    } catch (error) {
      if (!(error instanceof NavigationBlocked)) throw error;
      failedRoutes.add(signature);
      avoidPoint =
        error.details.waypoint ??
        (typeof error.details.target === "object"
          ? error.details.target
          : undefined);
      trace.actions.push({
        label: "ruta recalculada tras bloqueo",
        at: new Date().toISOString(),
        attempt,
        details: error.details,
      });
      if (attempt === maxReplans)
        check("Navegación tras reintentos", false, {
          target: { x, z },
          attempts: attempt + 1,
          lastBlock: error.details,
        });
    }
  }
}

async function useObject(id, waypoint, panelButton, targetRoom) {
  const geometry = await audit();
  const before = await inspect();
  const object = geometry.interactables.find((entry) => entry.id === id);
  check(`Objeto disponible: ${id}`, object !== undefined);
  const interactionGoal = interactionRouteOptions(
    object,
    geometry.interactables,
    {
      room: before.state.room,
      floor: before.state.floor,
      obstacles: geometry.navigationObstacles,
    },
  );
  const selectedAt = (point) =>
    nearestInteractable(point, geometry.interactables, {
      room: before.state.room,
      floor: before.state.floor,
      obstacles: geometry.navigationObstacles,
    })?.id;
  await go(interactionGoal.target.x, interactionGoal.target.z, {
    goalRadius: interactionGoal.goalRadius,
    goalPredicate: interactionGoal.goalPredicate,
    arrivalPredicate: interactionGoal.arrivalPredicate,
    goalId: id,
  });
  const ready = await inspect();
  const prompt = await page.locator("#prompt").innerText();
  const distance = Math.hypot(
    ready.state.x - object.x,
    ready.state.z - object.z,
  );
  trace.actions.push({
    label: "interacción preparada",
    at: new Date().toISOString(),
    id,
    room: ready.state.room,
    player: [ready.state.x, ready.state.z],
    object: [object.x, object.z],
    preferredWaypoint: waypoint,
    distance,
    selected: selectedAt({ x: ready.state.x, z: ready.state.z }),
    prompt,
  });
  if (!prompt.includes(object.name)) {
    try {
      await page.waitForFunction(
        (name) =>
          document.querySelector("#prompt")?.textContent?.includes(name),
        object.name,
        { timeout: 1500 },
      );
    } catch {
      const actualPrompt = await page.locator("#prompt").innerText();
      check(`Prompt correcto para ${id}`, false, {
        room: ready.state.room,
        x: ready.state.x,
        z: ready.state.z,
        distance,
        selected: selectedAt({ x: ready.state.x, z: ready.state.z }),
        prompt: actualPrompt,
      });
    }
  }
  const prePress = await inspect();
  check(
    `Objeto seleccionado antes de E: ${id}`,
    prePress.interaction?.id === id && !prePress.paused,
    {
      room: prePress.state.room,
      floor: prePress.state.floor,
      player: [prePress.state.x, prePress.state.z],
      selected: prePress.interaction?.id,
      paused: prePress.paused,
    },
  );
  await press("e");
  const postPress = await inspect();
  trace.actions.push({
    label: "resultado de interacción",
    at: new Date().toISOString(),
    id,
    expectedRoom: targetRoom,
    roomBefore: prePress.state.room,
    roomAfter: postPress.state.room,
    playerBefore: [prePress.state.x, prePress.state.z],
    playerAfter: [postPress.state.x, postPress.state.z],
    promptAfter: await page.locator("#prompt").innerText(),
    pausedAfter: postPress.paused,
    doorLock: phase2DoorLocked(id, postPress.state.phase2),
    phase2Solved: postPress.state.phase2.solved,
    toastAfter: await page.locator("#toast").innerText(),
  });
  if (targetRoom !== undefined) {
    const lock = phase2DoorLocked(id, postPress.state.phase2);
    check(`Puerta habilitada: ${id}`, !lock, {
      room: postPress.state.room,
      expectedRoom: targetRoom,
      phase2Solved: postPress.state.phase2.solved,
      lock,
      toast: await page.locator("#toast").innerText(),
    });
    await waitForRoom(targetRoom, false, id);
  }
  if (panelButton)
    await page.getByRole("button", { name: panelButton }).click();
  await snapshot(`interacción ${id}`);
}

async function enterPortal(id, waypoint, room, hero) {
  await useObject(id, waypoint, undefined, room);
  const s = await inspect();
  check(`Transición legítima por ${id}`, s.state.room === room);
  check(
    `Protagonista de sala ${room}`,
    hero.test(await page.locator("#hero-name").innerText()),
  );
  const startButton = page.getByRole("button", {
    name: "Comenzar investigación",
  });
  check(`Introducción de sala ${room}`, await startButton.isVisible());
  await capture(`${id}-introduccion`);
  await startButton.click();
  await waitForRoom(room, true);
  return performance.now();
}

async function readDocument(room, waypoint) {
  await useObject(`note${room}`, waypoint, "Guardar en el diario");
  check(
    `Documento ${room} leído`,
    (await inspect()).state.read.includes(String(room)),
  );
}

async function collectItem(id, waypoint, item, panelButton) {
  await useObject(id, waypoint, panelButton);
  await waitObserved(
    `${item} aparece en inventario`,
    (value) => window.sanityInspect().state.items.includes(value),
    item,
  );
  const s = await inspect();
  check(
    `${item} obtenido por interacción`,
    s.state.items.includes(item) && s.state.collected.includes(item),
  );
}

async function recordResources(label) {
  const s = await inspect();
  const entry = {
    label,
    at: new Date().toISOString(),
    room: s.state.room,
    health: s.state.health,
    sanity: s.state.sanity,
    stamina: s.combat.stamina,
    tonics: s.state.items.filter((item) => item.startsWith("Tónico")),
  };
  trace.resources.push(entry);
  console.log(
    `RESOURCE ${label} health=${entry.health} sanity=${entry.sanity} tonics=${entry.tonics.length}`,
  );
  return entry;
}

async function drinkTonicIfNeeded(threshold = 55) {
  const before = await recordResources("antes de posible curación");
  if (before.health >= threshold || before.tonics.length === 0) return false;
  await press("h");
  try {
    await page.waitForFunction(
      ({ expected }) => {
        const current = window.sanityInspect?.();
        if (!current) return false;
        const tonics = current.state.items.filter((item) =>
          item.startsWith("Tónico"),
        );
        return (
          tonics.length === expected.length &&
          tonics.every((item, index) => item === expected[index])
        );
      },
      { expected: before.tonics.slice(1) },
      { timeout: Math.min(timeout, 5000) },
    );
  } catch (error) {
    const observed = await inspect();
    check("Control H procesado por el juego", false, {
      before,
      observed: {
        room: observed.state.room,
        health: observed.state.health,
        sanity: observed.state.sanity,
        tonics: observed.state.items.filter((item) =>
          item.startsWith("Tónico"),
        ),
        paused: observed.paused,
        focused: await page.evaluate(() => document.activeElement?.tagName),
      },
      error: String(error),
    });
  }
  const after = await recordResources("tras beber tónico");
  const result = tonicConsumption(before, after);
  check("Tónico consumido mediante control H", result.passed, {
    before,
    after,
    result,
  });
  const frame = (await inspect()).draw.frame;
  await waitObserved(
    "inventario estable tras tónico",
    (previous) => window.sanityInspect().draw.frame > previous,
    frame,
    Math.min(timeout, 5000),
  );
  const settled = await recordResources("tónico estable tras otro fotograma");
  const game = await inspect();
  check(
    "Sin consumo duplicado y juego activo",
    settled.tonics.length === after.tonics.length &&
      settled.tonics.every((item, index) => item === after.tonics[index]) &&
      settled.health > 0 &&
      !game.paused,
    { after, settled, paused: game.paused },
  );
  return true;
}

async function solveSingleChoice(id, waypoint, answer, solution) {
  await useObject(id, waypoint);
  check(
    `Puzle ${id} presenta respuesta`,
    await page.locator(answer).isVisible(),
  );
  await page.locator(answer).click();
  await waitObserved(
    `solución ${solution} del puzle ${id}`,
    (item) => window.sanityInspect().state.items.includes(item),
    solution,
  );
  await snapshot(`puzle ${id} resuelto`);
  check(
    `Puzle ${id} completado`,
    (await inspect()).state.items.includes(solution),
  );
}

async function solveSequence(id, waypoint, steps, solution) {
  await useObject(id, waypoint);
  for (const [index, step] of steps.entries()) {
    const answer = page.locator(step.answer);
    check(
      `Puzle ${id}: opción ${index + 1}/${steps.length} disponible`,
      await answer.isVisible(),
    );
    await answer.click();
    await waitObserved(
      `hito ${step.item} del puzle ${id}`,
      (item) => window.sanityInspect().state.items.includes(item),
      step.item,
    );
    const state = await snapshot(`puzle ${id}: paso ${index + 1}`, {
      answer: step.answer,
      milestone: step.item,
    });
    check(
      `Puzle ${id}: paso ${index + 1} registrado`,
      state.state.items.includes(step.item),
    );
  }
  check(
    `Puzle ${id} completado`,
    (await inspect()).state.items.includes(solution),
  );
}

async function solvePhase2Puzzle(id, waypoint, answers, unlocks) {
  const initial = await inspect();
  const puzzleIndex = puzzleIds.indexOf(id);
  check(
    `Pista del mecanismo ${id} leída`,
    initial.state.read.includes(String(initial.state.room)),
  );
  check(
    `Mecanismo ${id} pendiente`,
    puzzleIndex >= 0 && !initial.state.phase2.solved.includes(id),
  );
  await useObject(id, waypoint);
  for (const [step, answer] of answers.entries()) {
    const option = page.locator(`#phase2-answer${answer}`);
    check(
      `Mecanismo ${id}: opción ${step + 1}/${answers.length} visible`,
      await option.isVisible(),
    );
    await option.click();
    await waitObserved(
      `paso ${step + 1}/${answers.length} del mecanismo ${id}`,
      ({ index, expected }) =>
        window.sanityInspect().state.phase2.steps[index] >= expected,
      { index: puzzleIndex, expected: step + 1 },
      Math.min(timeout, 5000),
    );
    await snapshot(`mecanismo ${id}: paso ${step + 1}`, { answer });
  }
  const completed = await inspect();
  check(
    `Mecanismo ${id} resuelto y ${unlocks} desbloqueada`,
    completed.state.phase2.solved.includes(id) &&
      phase2DoorLocked(unlocks, completed.state.phase2) === null &&
      !completed.paused,
    { solved: completed.state.phase2.solved, paused: completed.paused },
  );
}

async function finishChapter({
  id,
  exitId,
  waypoint,
  button,
  artifact,
  enemyId,
  startedAt,
}) {
  await useObject(exitId, waypoint);
  const exitButton = page.getByRole("button", { name: button });
  await exitButton.waitFor({ timeout });
  check(
    `Epílogo de ${id}`,
    (await page.locator("#panel").innerText()).includes("CONCLUIDO"),
  );
  await exitButton.click();
  await waitForRoom(0, true);
  const s = await snapshot(`regreso de ${id} a 1927`);
  check(
    `${id} completado al regresar`,
    s.state.campaign.completed.includes(id) &&
      s.state.items.includes(artifact) &&
      s.state.defeated.includes(enemyId),
  );
  const durationMs = Math.round(performance.now() - startedAt);
  trace.chapters.push({
    id,
    durationMs,
    artifact,
    enemyId,
    health: s.state.health,
    sanity: s.state.sanity,
    tonics: s.state.items.filter((item) => item.startsWith("Tónico")),
    completedAfterReturn: [...s.state.campaign.completed],
  });
  await recordResources(`final de ${id}`);
  await capture(`${id}-regreso`);
  return s;
}

async function saveAndReload(ids, artifacts, nextPortal, nextRoom) {
  const enemies = trace.chapters.map((chapter) => chapter.enemyId);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sanity404-save") || "null"),
  );
  check(
    `Guardado tras ${ids.at(-1)}`,
    saved &&
      ids.every((id) => saved.campaign.completed.includes(id)) &&
      artifacts.every((item) => saved.items.includes(item)) &&
      enemies.every((enemy) => saved.defeated.includes(enemy)),
  );
  trace.actions.push({
    label: "guardado verificado",
    at: new Date().toISOString(),
    completed: saved.campaign.completed,
    items: saved.items,
    defeated: saved.defeated,
  });
  await page.reload();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await waitForRoom(0, true);
  const s = await snapshot(`recarga tras ${ids.at(-1)}`);
  check(
    `Recarga mantiene ${ids.join(" y ")}`,
    ids.every((id) => s.state.campaign.completed.includes(id)) &&
      artifacts.every((item) => s.state.items.includes(item)) &&
      enemies.every((enemy) => s.state.defeated.includes(enemy)),
  );
  check(
    `Portal ${nextPortal} desbloqueado`,
    (await audit()).interactables.some(
      (entry) => entry.id === nextPortal && entry.target === nextRoom,
    ),
  );
  trace.actions.push({
    label: "recarga verificada",
    at: new Date().toISOString(),
    completed: s.state.campaign.completed,
    items: s.state.items,
    defeated: s.state.defeated,
    nextPortal,
  });
}

function directionToEnemy(s) {
  const dx = s.enemy.position[0] - s.state.x;
  const dz = s.enemy.position[2] - s.state.z;
  return Math.abs(dx) > Math.abs(dz)
    ? dx > 0
      ? "d"
      : "a"
    : dz > 0
      ? "s"
      : "w";
}

async function fightEnemy({ room, kind, health, defeatedId }) {
  const initial = await inspect();
  check(
    `Enemigo de sala ${room} vivo con ${health} puntos`,
    initial.state.room === room &&
      initial.enemy.visible &&
      initial.combat.kind === kind &&
      initial.combat.enemyHealth === health,
  );
  const fightStart = performance.now();
  const attacks = [];
  let guards = 0;
  while (performance.now() - fightStart < 90000) {
    const s = await inspect();
    if (s.state.defeated.includes(defeatedId)) break;
    if (s.state.health <= 0)
      check("Protagonista continúa con vida", false, {
        health: s.state.health,
      });
    const distance = Math.hypot(
      s.enemy.position[0] - s.state.x,
      s.enemy.position[2] - s.state.z,
    );
    if (s.combat.windup > 0 && distance < 2.3) {
      await defendCurrentAttack(`combate en sala ${room}`);
      guards++;
      continue;
    }
    if (distance > 1.7) {
      await walk(directionToEnemy(s), 280);
      continue;
    }
    await walk(directionToEnemy(s), 90);
    const before = await inspect();
    if (before.combat.windup > 0) continue;
    const kind = before.combat.stamina >= 35 ? "fuerte" : "ligero";
    await press(kind === "fuerte" ? "j" : "Space");
    await page.waitForTimeout(220);
    const after = await inspect();
    const attack = {
      kind,
      enemyHealthBefore: before.combat.enemyHealth,
      enemyHealthAfter: after.combat.enemyHealth,
      playerHealthAfter: after.state.health,
      staminaBefore: before.combat.stamina,
      staminaAfter: after.combat.stamina,
    };
    attacks.push(attack);
    trace.actions.push({
      label: "ataque",
      at: new Date().toISOString(),
      ...attack,
    });
    await page.waitForTimeout(450);
  }
  const after = await snapshot(`combate de sala ${room} terminado`, {
    attacks,
    guards,
  });
  check(
    "Ataques efectivos registrados",
    attacks.some((a) => a.enemyHealthAfter < a.enemyHealthBefore),
    { attacks },
  );
  check(
    `Enemigo ${defeatedId} derrotado de verdad`,
    after.state.defeated.includes(defeatedId) &&
      !after.enemy.visible &&
      after.combat.aiState === "dead" &&
      after.combat.enemyHealth <= 0,
    {
      defeated: after.state.defeated,
      visible: after.enemy.visible,
      combat: after.combat,
    },
  );
}

async function runLucius() {
  await go(5.2, 3);
  await snapshot("portal romano próximo");
  const startedAt = await enterPortal("roman-portal", [5.2, 3], 8, /LUCIUS/);
  let s = await inspect();
  check(
    "Centurión inicializado en 189",
    s.combat.kind === "centurion" &&
      s.combat.enemyHealth === 115 &&
      s.state.campaign.visited.includes("roman-189"),
  );

  await readDocument(8, [-4.3, 5]);
  check(
    "Formación imposible presenciada",
    (await inspect()).state.campaign.witnessed.includes("roman-formation"),
  );
  await go(0, 1.4);
  await fightEnemy({
    room: 8,
    kind: "centurion",
    health: 115,
    defeatedId: "enemy8",
  });

  for (const [id, waypoint] of [
    ["roman-echo-ash", [-4.15, 3.8]],
    ["roman-echo-tide", [4.15, 3.8]],
    ["roman-echo-threshold", [2, 2.4]],
  ]) {
    if (!witnessedDuringNavigation.has(id))
      await useObject(id, waypoint, "Conservar el testimonio");
    check(
      `Testimonio persistente: ${id}`,
      (await inspect()).state.campaign.witnessed.includes(id) &&
        (!witnessedDuringNavigation.has(id) ||
          trace.actions.some(
            (action) =>
              action.label === "testimonio abierto durante navegación" &&
              action.id === id,
          )),
    );
  }
  await solveSingleChoice(
    "roman-inscription",
    [-2.9, -3.25],
    "#roman-answer1",
    "Marca de Varro",
  );
  await collectItem(
    "roman-tablet",
    [0, -3.2],
    "Tablilla del intervalo",
    "Continuar",
  );
  await capture("tablilla");

  s = await finishChapter({
    id: "roman-189",
    exitId: "roman-return",
    waypoint: [0, 5.1],
    button: "Regresar a la mansión",
    artifact: "Tablilla del intervalo",
    enemyId: "enemy8",
    startedAt,
  });
  check(
    "Lucius sigue completado en 1927",
    s.state.room === 0 && s.state.campaign.completed.includes("roman-189"),
  );
  await saveAndReload(
    ["roman-189"],
    ["Tablilla del intervalo"],
    "mosaic-portal",
    11,
  );
  console.log(
    `PASS Lucius 189 certificado en ${trace.chapters.at(-1).durationMs} ms`,
  );
}

async function runAurelia() {
  // The saved mansion still contains its shade. Defeat it with normal combat
  // before crossing the right-hand corridor; standing against the central
  // table at z=-0.6 lets it attack indefinitely.
  const mansion = await inspect();
  check(
    "Amenaza de la mansión identificada",
    mansion.state.room === 0 &&
      mansion.combat.kind === "shade" &&
      mansion.enemy.visible,
  );
  await fightEnemy({
    room: 0,
    kind: "shade",
    health: 60,
    defeatedId: "enemy0",
  });
  check(
    "Sombra de la mansión derrotada legítimamente",
    (await inspect()).state.defeated.includes("enemy0"),
  );
  // The central ritual table is solid. The portal interaction plans directly
  // from the observed combat position to a selectable point beside the door.
  const startedAt = await enterPortal(
    "mosaic-portal",
    [6.2, -0.6],
    11,
    /AURELIA/,
  );
  check(
    "Lucius persiste al entrar en 312",
    (await inspect()).state.campaign.completed.includes("roman-189"),
  );
  await readDocument(11, [-3.3, 5]);
  await collectItem("mosaic-pigment", [-4.2, 1.6], "Pigmento de cinabrio");
  await useObject("mosaic-kiln", [0, -5.1], undefined, 12);
  check("Horno de teselas alcanzado", (await inspect()).state.room === 12);
  await readDocument(12, [-3.3, 5]);

  await go(0, 1.4);
  await fightEnemy({
    room: 12,
    kind: "mosaic",
    health: 95,
    defeatedId: "enemy12",
  });
  await solveSingleChoice(
    "mosaic-pattern",
    [-2.7, -3.8],
    "#mosaic-answer1",
    "Boceto recompuesto",
  );
  await collectItem("mosaic-mold", [0, -3.2], "Molde de Aurelia", "Continuar");
  await capture("molde-aurelia");

  await useObject("mosaic-back", [0, 5.1], undefined, 11);
  check(
    "Regreso legítimo del horno a la galería",
    (await inspect()).state.room === 11,
  );
  await finishChapter({
    id: "mosaic-312",
    exitId: "mosaic-return",
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: "Molde de Aurelia",
    enemyId: "enemy12",
    startedAt,
  });
  await saveAndReload(
    ["roman-189", "mosaic-312"],
    ["Tablilla del intervalo", "Molde de Aurelia"],
    "coast-portal",
    13,
  );
  console.log(
    `PASS Aurelia 312 certificada en ${trace.chapters.at(-1).durationMs} ms`,
  );
}

async function runMaeve() {
  const mansion = await inspect();
  check(
    "Lucius y Aurelia persisten antes de Maeve",
    mansion.state.room === 0 &&
      ["roman-189", "mosaic-312"].every((id) =>
        mansion.state.campaign.completed.includes(id),
      ) &&
      mansion.state.defeated.includes("enemy0"),
  );
  const startedAt = await enterPortal("coast-portal", [-6.2, 2.5], 13, /MAEVE/);
  check(
    "Investigación de Maeve visitada legítimamente",
    (await inspect()).state.campaign.visited.includes("coast-537"),
  );

  await readDocument(13, [-3.3, 5]);
  await collectItem("coast-tides", [-3.3, 2], "Tabla de mareas");
  await useObject("coast-vault", [0, -5.1], undefined, 14);
  check("Depósito costero alcanzado", (await inspect()).state.room === 14);
  await readDocument(14, [-3.3, 5]);
  await go(0, 1.4);
  await fightEnemy({
    room: 14,
    kind: "drowned",
    health: 88,
    defeatedId: "enemy14",
  });
  await solveSingleChoice(
    "coast-ledger",
    [-2.7, -3.0],
    "#coast-answer2",
    "Registro corregido",
  );
  await collectItem("coast-list", [0, -3.0], "Lista de pasajeros", "Continuar");
  const proof = await inspect();
  check(
    "Pruebas narrativas y victoria de Maeve",
    ["13", "14"].every((note) => proof.state.read.includes(note)) &&
      proof.state.items.includes("Tabla de mareas") &&
      proof.state.items.includes("Registro corregido") &&
      proof.state.items.includes("Lista de pasajeros") &&
      proof.state.defeated.includes("enemy14"),
  );
  await capture("lista-maeve");

  await useObject("coast-back", [0, 5.1], undefined, 13);
  check(
    "Regreso legítimo del depósito al muelle",
    (await inspect()).state.room === 13,
  );
  await finishChapter({
    id: "coast-537",
    exitId: "coast-return",
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: "Lista de pasajeros",
    enemyId: "enemy14",
    startedAt,
  });
  await saveAndReload(
    ["roman-189", "mosaic-312", "coast-537"],
    ["Tablilla del intervalo", "Molde de Aurelia", "Lista de pasajeros"],
    "stars-portal",
    15,
  );
  console.log(
    `PASS Maeve 537 completada y recargada en ${trace.chapters.at(-1).durationMs} ms`,
  );
}

async function runSamira() {
  const mansion = await inspect();
  check(
    "Lucius, Aurelia y Maeve persisten antes de Samira",
    mansion.state.room === 0 &&
      ["roman-189", "mosaic-312", "coast-537"].every((id) =>
        mansion.state.campaign.completed.includes(id),
      ),
  );
  // Both portals are on the west wall. Keeping x=-6.2 avoids the furniture.
  const startedAt = await enterPortal(
    "stars-portal",
    [-6.2, -2.5],
    15,
    /SAMIRA/,
  );
  check(
    "Investigación de Samira visitada legítimamente",
    (await inspect()).state.campaign.visited.includes("stars-783"),
  );

  await readDocument(15, [-3.3, 5]);
  await collectItem("stars-chart", [-3.3, 1.7], "Carta astral");
  await useObject("stars-dome", [0, -5.1], undefined, 16);
  check("Cúpula alcanzada", (await inspect()).state.room === 16);
  await readDocument(16, [-3.3, 5]);
  await go(0, 1.4);
  await fightEnemy({
    room: 16,
    kind: "blindWatcher",
    health: 90,
    defeatedId: "enemy16",
  });
  await solveSequence(
    "stars-wheel",
    [-2.7, -3.6],
    [
      { answer: "#stars-answer0", item: "Primer azimut" },
      { answer: "#stars-answer2", item: "Segundo azimut" },
      { answer: "#stars-answer1", item: "Patrón de Samira" },
    ],
    "Patrón de Samira",
  );
  await collectItem("stars-disc", [0, -3.0], "Disco estelar", "Continuar");
  const proof = await inspect();
  check(
    "Pruebas narrativas y victoria de Samira",
    ["15", "16"].every((note) => proof.state.read.includes(note)) &&
      proof.state.items.includes("Carta astral") &&
      proof.state.items.includes("Patrón de Samira") &&
      proof.state.items.includes("Disco estelar") &&
      proof.state.defeated.includes("enemy16"),
  );
  await capture("disco-samira");

  await useObject("stars-back", [0, 5.1], undefined, 15);
  check(
    "Regreso legítimo de la cúpula a la terraza",
    (await inspect()).state.room === 15,
  );
  await finishChapter({
    id: "stars-783",
    exitId: "stars-return",
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: "Disco estelar",
    enemyId: "enemy16",
    startedAt,
  });
  await saveAndReload(
    ["roman-189", "mosaic-312", "coast-537", "stars-783"],
    [
      "Tablilla del intervalo",
      "Molde de Aurelia",
      "Lista de pasajeros",
      "Disco estelar",
    ],
    "quarry-portal",
    17,
  );
  console.log(
    `PASS Samira 783 completada y recargada en ${trace.chapters.at(-1).durationMs} ms`,
  );
}

async function runIdris() {
  const mansion = await inspect();
  check(
    "Cuatro investigaciones persisten antes de Idris",
    mansion.state.room === 0 &&
      ["roman-189", "mosaic-312", "coast-537", "stars-783"].every((id) =>
        mansion.state.campaign.completed.includes(id),
      ),
  );
  const startedAt = await enterPortal("quarry-portal", [-6.2, 0], 17, /IDRIS/);
  check(
    "Investigación de Idris visitada legítimamente",
    (await inspect()).state.campaign.visited.includes("quarry-1092"),
  );

  await readDocument(17, [-3.3, 5]);
  await collectItem("quarry-wedge", [-3.3, 1.8], "Cuña marcada");
  await useObject("quarry-chamber", [0, -5.1], undefined, 18);
  check("Cámara del arco alcanzada", (await inspect()).state.room === 18);
  await readDocument(18, [-3.3, 5]);
  await go(0, 1.4);
  await fightEnemy({
    room: 18,
    kind: "stoneworker",
    health: 110,
    defeatedId: "enemy18",
  });
  await solveSequence(
    "quarry-assembly",
    [-2.8, -3.6],
    [
      { answer: "#quarry-answer0", item: "Base asentada" },
      { answer: "#quarry-answer2", item: "Clave colocada" },
      { answer: "#quarry-answer1", item: "Arco ensamblado" },
    ],
    "Arco ensamblado",
  );
  await collectItem("quarry-plan", [0, -3.0], "Plano del umbral", "Continuar");
  const proof = await inspect();
  check(
    "Pruebas narrativas y victoria de Idris",
    ["17", "18"].every((note) => proof.state.read.includes(note)) &&
      proof.state.items.includes("Cuña marcada") &&
      proof.state.items.includes("Arco ensamblado") &&
      proof.state.items.includes("Plano del umbral") &&
      proof.state.defeated.includes("enemy18"),
  );
  await capture("plano-idris");

  await useObject("quarry-back", [0, 5.1], undefined, 17);
  check(
    "Regreso legítimo de la cámara a la cantera",
    (await inspect()).state.room === 17,
  );
  await finishChapter({
    id: "quarry-1092",
    exitId: "quarry-return",
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: "Plano del umbral",
    enemyId: "enemy18",
    startedAt,
  });
  await saveAndReload(
    ["roman-189", "mosaic-312", "coast-537", "stars-783", "quarry-1092"],
    [
      "Tablilla del intervalo",
      "Molde de Aurelia",
      "Lista de pasajeros",
      "Disco estelar",
      "Plano del umbral",
    ],
    "hospital-portal",
    19,
  );
  console.log(
    `PASS Idris 1092 completado y recargado en ${trace.chapters.at(-1).durationMs} ms`,
  );
}

async function runOona() {
  check(
    "Idris persiste antes de Oona",
    (await inspect()).state.campaign.completed.includes("quarry-1092"),
  );
  await collectItem("tonic0", [6.6, 5], "Tónico 0");
  await drinkTonicIfNeeded(70);
  const startedAt = await enterPortal(
    "hospital-portal",
    [1.8, -3.3],
    19,
    /OONA/,
  );
  check(
    "Investigación de Oona visitada",
    (await inspect()).state.campaign.visited.includes("hospital-1217"),
  );
  await readDocument(19, [-3.3, 5]);
  await collectItem("hospital-rowan", [-2.3, 1.6], "Hierbas de serbal");
  await useObject("hospital-ward", [0, -5.1], undefined, 20);
  await readDocument(20, [-3.3, 5]);
  await go(0, 1.4);
  await fightEnemy({
    room: 20,
    kind: "wardKeeper",
    health: 100,
    defeatedId: "enemy20",
  });
  await solveSingleChoice(
    "hospital-remedy",
    [-2.4, -1.4],
    "#hospital-answer1",
    "Remedio identificado",
  );
  await collectItem("hospital-record", [0, -3], "Cuaderno de Oona");
  await useObject("hospital-testimony", [2.2, -1.4], "Conservar a Bran");
  check(
    "Testimonio de Bran conservado",
    (await inspect()).state.items.includes("Testimonio de Bran"),
  );
  await capture("cuaderno-oona");
  await useObject("hospital-back", [0, 5.1], undefined, 19);
  await finishChapter({
    id: "hospital-1217",
    exitId: "hospital-return",
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: "Cuaderno de Oona",
    enemyId: "enemy20",
    startedAt,
  });
  await saveAndReload(
    [
      "roman-189",
      "mosaic-312",
      "coast-537",
      "stars-783",
      "quarry-1092",
      "hospital-1217",
    ],
    [
      "Tablilla del intervalo",
      "Molde de Aurelia",
      "Lista de pasajeros",
      "Disco estelar",
      "Plano del umbral",
      "Cuaderno de Oona",
    ],
    "medieval-portal",
    9,
  );
}

async function runIsabelle() {
  check(
    "Oona persiste antes de Isabelle",
    (await inspect()).state.campaign.completed.includes("hospital-1217"),
  );
  const startedAt = await enterPortal(
    "medieval-portal",
    [-5.8, -5.2],
    9,
    /ISABELLE/,
  );
  await readDocument(9, [-4.8, 5]);
  await useObject("medieval-scriptorium", [0, -5.1], undefined, 10);
  await readDocument(10, [-4.8, 5]);
  await go(0, 1.4);
  await fightEnemy({
    room: 10,
    kind: "plagueScribe",
    health: 85,
    defeatedId: "enemy10",
  });
  await solveSingleChoice(
    "medieval-manuscript",
    [-2.9, -3.8],
    "#med-answer1",
    "Sello de Montfort",
  );
  await collectItem(
    "medieval-codex",
    [0, -3.2],
    "Códice de Montfort",
    "Continuar",
  );
  await capture("codice-isabelle");
  await useObject("medieval-back", [0, 5.1], undefined, 9);
  await finishChapter({
    id: "abbey-1348",
    exitId: "medieval-return",
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: "Códice de Montfort",
    enemyId: "enemy10",
    startedAt,
  });
  await saveAndReload(
    [
      "roman-189",
      "mosaic-312",
      "coast-537",
      "stars-783",
      "quarry-1092",
      "hospital-1217",
      "abbey-1348",
    ],
    [
      "Tablilla del intervalo",
      "Molde de Aurelia",
      "Lista de pasajeros",
      "Disco estelar",
      "Plano del umbral",
      "Cuaderno de Oona",
      "Códice de Montfort",
    ],
    "press-1491-portal",
    21,
  );
}

async function prepareLegacy() {
  await useObject("legacy-desk", [-1.5, -3.6], "Continuar");
  check(
    "Memoria reconciliada por interacción",
    (await inspect()).state.items.includes("Memoria reconciliada"),
  );
  await useObject("legacy-passage", [2, -5.1], undefined, 5);
  await fightEnemy({
    room: 5,
    kind: "stalker",
    health: 75,
    defeatedId: "enemy5",
  });
  const before = await inspect();
  await useObject(
    "memory-altar",
    [2.8, 3.2],
    "El juramento de Lucius · +30 salud",
  );
  check(
    "Juramento de Lucius elegido",
    (await inspect()).state.items.includes("Juramento de Lucius"),
  );
  await page.getByRole("button", { name: "Continuar" }).click();
  const after = await inspect();
  check(
    "Recompensa de salud legítima",
    after.state.health === Math.min(100, before.state.health + 30),
    { before: before.state.health, after: after.state.health },
  );
  await go(2.8, 5.5);
  await collectItem("tonic5", [5.8, 5.5], "Tónico 5");
  await readDocument(5, [-4.2, 5]);
  await solvePhase2Puzzle("genealogy", [0, -1.9], [0, 1, 2], "greenhouse-door");
  await go(0, 0);
  await useObject("greenhouse-door", [5.7, 0], undefined, 6);
  const greenhouse = await inspect();
  check(
    "Secuencia real enemy5 → altar → tónico → genealogy → invernadero",
    greenhouse.state.room === 6 &&
      greenhouse.state.defeated.includes("enemy5") &&
      greenhouse.state.items.includes("Juramento de Lucius") &&
      greenhouse.state.collected.includes("Tónico 5") &&
      greenhouse.state.read.includes("5") &&
      greenhouse.state.phase2.solved.includes("genealogy"),
    {
      room: greenhouse.state.room,
      defeated: greenhouse.state.defeated,
      collected: greenhouse.state.collected,
      read: greenhouse.state.read,
      phase2Solved: greenhouse.state.phase2.solved,
    },
  );
  await fightEnemy({
    room: 6,
    kind: "stalker",
    health: 75,
    defeatedId: "enemy6",
  });
  await useObject("adrien", [3, 4], "Conservar en el diario");
  check(
    "Cuaderno de Adrien descubierto",
    (await inspect()).state.phase2.discoveries.includes("adrien"),
  );
  await go(3, 5.5);
  await collectItem("tonic6", [5.8, 5.5], "Tónico 6");
  await drinkTonicIfNeeded(55);
  await go(0, 5.5);
  await go(0, 0);
  await useObject("greenhouse-back", [-5.7, 0], undefined, 5);
  await go(0, 0);
  await useObject("legacy-back", [-2.8, -5.1], undefined, 0);
  await useObject("save0", [-2, 5]);
  await saveAndReload(
    [
      "roman-189",
      "mosaic-312",
      "coast-537",
      "stars-783",
      "quarry-1092",
      "hospital-1217",
      "abbey-1348",
    ],
    [
      "Tablilla del intervalo",
      "Molde de Aurelia",
      "Lista de pasajeros",
      "Disco estelar",
      "Plano del umbral",
      "Cuaderno de Oona",
      "Códice de Montfort",
    ],
    "press-1491-portal",
    21,
  );
  const state = (await inspect()).state;
  check(
    "Reconciliación, decisión y Adrien persisten",
    state.items.includes("Memoria reconciliada") &&
      state.items.includes("Juramento de Lucius") &&
      state.phase2.discoveries.includes("adrien"),
  );
}

const lateRuns = [
  {
    stage: "tomas",
    id: "press-1491",
    room: 21,
    hero: /TOMÁS/,
    portal: [2.6, 6.7],
    clue: "Prueba de impresión",
    solution: "Planchas ordenadas",
    artifact: "Plancha auténtica",
    kind: "typesetter",
    health: 92,
    order: [0, 1, 2],
    nextPortal: "veyr-1610-portal",
    nextRoom: 23,
  },
  {
    stage: "ines",
    id: "veyr-1610",
    room: 23,
    hero: /INÉS/,
    portal: [5, 6.7],
    clue: "Inventario de Inés",
    solution: "Asiento corregido",
    artifact: "Acta original de Inés",
    kind: "portrait",
    health: 105,
    order: [1, 2, 0],
    nextPortal: "theatre-1786-portal",
    nextRoom: 25,
  },
  {
    stage: "amara",
    id: "theatre-1786",
    room: 25,
    hero: /AMARA/,
    portal: [-4.2, -3.8],
    clue: "Partitura de poleas",
    solution: "Contrapesos alineados",
    artifact: "Partitura del silencio",
    kind: "automaton",
    health: 118,
    order: [0, 1, 2],
    nextPortal: "photo-1899-portal",
    nextRoom: 27,
  },
  {
    stage: "emile",
    id: "photo-1899",
    room: 27,
    hero: /ÉMILE/,
    portal: [-3.2, -5.9],
    clue: "Negativo anterior",
    solution: "Exposición fijada",
    artifact: "Placa de la puerta",
    kind: "developerShade",
    health: 96,
    order: [1, 0, 2],
    nextPortal: "legacy-passage",
    nextRoom: 5,
  },
];

async function solveLateSequence(chapter) {
  for (const [index, choice] of chapter.order.entries()) {
    await useObject(`${chapter.id}-puzzle`, [-2.4, -1.4]);
    const answer = page.locator(`#late-answer${choice}`);
    check(
      `${chapter.id}: respuesta ${index + 1} disponible`,
      await answer.isVisible(),
    );
    await answer.click();
    const milestone =
      index < 2 ? `${chapter.id}-step-${index + 1}` : chapter.solution;
    await waitObserved(
      `${chapter.id}: hito ${milestone} del puzle`,
      ({ milestone, final }) => {
        const state = window.sanityInspect().state;
        return final
          ? state.items.includes(milestone)
          : state.campaign.witnessed.includes(milestone);
      },
      { milestone, final: index === 2 },
    );
    const state = await snapshot(`${chapter.id}: paso ${index + 1} del puzle`, {
      choice,
      milestone,
    });
    check(
      `${chapter.id}: paso ${index + 1} resuelto`,
      index === 2
        ? state.state.items.includes(milestone)
        : state.state.campaign.witnessed.includes(milestone),
    );
  }
}

async function runLateChapter(chapter) {
  const previous = trace.chapters.at(-1);
  check(
    `Predecesor de ${chapter.id} completado`,
    previous &&
      (await inspect()).state.campaign.completed.includes(previous.id),
  );
  await drinkTonicIfNeeded(55);
  await go(0, chapter.portal[1]);
  const startedAt = await enterPortal(
    `${chapter.id}-portal`,
    chapter.portal,
    chapter.room,
    chapter.hero,
  );
  check(
    `${chapter.id} visitado`,
    (await inspect()).state.campaign.visited.includes(chapter.id),
  );
  await readDocument(chapter.room, [-3.3, 5]);
  await collectItem(`${chapter.id}-clue`, [2.25, -0.8], chapter.clue);
  await useObject(
    `${chapter.id}-inner`,
    [0, -5.1],
    undefined,
    chapter.room + 1,
  );
  await readDocument(chapter.room + 1, [-3.3, 5]);
  await go(0, 1.4);
  await fightEnemy({
    room: chapter.room + 1,
    kind: chapter.kind,
    health: chapter.health,
    defeatedId: `enemy${chapter.room + 1}`,
  });
  for (let index = 0; index < 2; index++) {
    const evidence = `${chapter.id}-evidence-${index}`;
    await useObject(
      evidence,
      [index === 0 ? -2.4 : 2.4, 1.9],
      "Conservar en el diario",
    );
    check(
      `Prueba material ${evidence} persistente`,
      (await inspect()).state.campaign.witnessed.includes(evidence),
    );
  }
  await solveLateSequence(chapter);
  await collectItem(
    `${chapter.id}-artifact`,
    [2.4, -3.3],
    chapter.artifact,
    "Continuar",
  );
  await capture(`${chapter.id}-artefacto`);
  await useObject(`${chapter.id}-back`, [0, 5.1], undefined, chapter.room);
  await finishChapter({
    id: chapter.id,
    exitId: `${chapter.id}-return`,
    waypoint: [0, 5.1],
    button: "Regresar a 1927",
    artifact: chapter.artifact,
    enemyId: `enemy${chapter.room + 1}`,
    startedAt,
  });
  await saveAndReload(
    trace.chapters.map((entry) => entry.id),
    trace.chapters.map((entry) => entry.artifact),
    chapter.nextPortal,
    chapter.nextRoom,
  );
}

async function solveSeal(id, waypoint, answer, seal) {
  await useObject(id, waypoint);
  check(
    `Respuesta de ${id} disponible`,
    await page.locator(answer).isVisible(),
  );
  await page.locator(answer).click();
  await waitObserved(
    `sello ${seal} obtenido`,
    (value) => window.sanityInspect().state.seals.includes(value),
    seal,
  );
  check(
    `Sello ${seal} obtenido jugando`,
    (await inspect()).state.seals.includes(seal),
  );
}

async function runElise() {
  const before = await inspect();
  check(
    "Once investigaciones y artefactos antes de Élise",
    trace.chapters.length === 11 &&
      trace.chapters.every(
        (chapter) =>
          before.state.campaign.completed.includes(chapter.id) &&
          before.state.items.includes(chapter.artifact),
      ),
  );
  check(
    "Memoria, decisión y Adrien antes del final",
    before.state.items.includes("Memoria reconciliada") &&
      before.state.items.includes("Juramento de Lucius") &&
      before.state.phase2.discoveries.includes("adrien"),
  );
  await drinkTonicIfNeeded(60);
  const startedAt = performance.now();
  await readDocument(0, [-4.2, 5]);
  await collectItem("key", [-3.8, 0.5], "Llave de latón");
  await go(-4, 4);
  await useObject("mansion-puzzle", [3, 4]);
  check(
    "Respuesta de caja astronómica disponible",
    await page.locator("#answer0").isVisible(),
  );
  await page.locator("#answer0").click();
  await waitObserved(
    "medallón de la caja astronómica obtenido",
    () => window.sanityInspect().state.items.includes("Medallón Veyr"),
    null,
  );
  check(
    "Medallón Veyr obtenido",
    (await inspect()).state.items.includes("Medallón Veyr"),
  );
  await useObject("next", [0, -6], undefined, 1);

  for (let room = 1; room <= 3; room++) {
    await readDocument(room, [-4.2, 5]);
    await collectItem(`tonic${room}`, [5.8, 5.5], `Tónico ${room}`);
    await drinkTonicIfNeeded(55);
    await solveSeal(`seal${room}`, [0, -3.2], `#answer${room - 1}`, room - 1);
    await useObject("next", [0, -6], undefined, room + 1);
  }
  const seals = (await inspect()).state.seals;
  check(
    "Tres sellos abiertos",
    [0, 1, 2].every((seal) => seals.includes(seal)),
  );
  await readDocument(4, [-4.2, 5]);
  await drinkTonicIfNeeded(55);
  await useObject("end", [0, -2.2]);
  check(
    "Final histórico ofrecido por las pruebas",
    await page.locator("#full-ending").isVisible(),
  );
  await capture("umbral-historico");
  await page.locator("#full-ending").click();
  const endingText = await page.locator("#panel").innerText();
  const after = await snapshot("final histórico de 1927", { endingText });
  check(
    "Desenlace histórico alcanzado",
    after.state.ended &&
      after.state.campaign.completed.includes("mansion-1927") &&
      endingText.includes("FINAL HISTÓRICO") &&
      endingText.includes("La historia que nadie pudo borrar"),
  );
  trace.ending = {
    type: "historical",
    route: "ruins",
    durationMs: Math.round(performance.now() - startedAt),
    health: after.state.health,
    sanity: after.state.sanity,
    completed: [...after.state.campaign.completed],
    text: endingText,
  };
  await capture("final-historico");
}

try {
  if (through === "final") {
    const preflight = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("./audit-rooms.mjs", import.meta.url))],
      { encoding: "utf8" },
    );
    trace.actions.push({
      label: "auditoría geométrica previa de 29 salas",
      at: new Date().toISOString(),
      exitCode: preflight.status,
      output: preflight.stdout,
      error: preflight.stderr,
    });
    check(
      "Conectividad geométrica de 29 salas y estados de campaña",
      preflight.status === 0,
      {
        exitCode: preflight.status,
        error: preflight.error?.message || preflight.stderr,
      },
    );
  }
  const useFirefox = process.env.SANITY_BROWSER === "firefox";
  browser = useFirefox
    ? await firefox.launch({
        executablePath: "/usr/bin/firefox",
        headless: true,
      })
    : await chromium.launch({
        executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
        headless: !headed,
        chromiumSandbox: true,
        ignoreDefaultArgs: ["--enable-unsafe-swiftshader"],
      });
  trace.browserVersion = browser.version();
  page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  await page.addInitScript(() => {
    window.sanityQaInteractionKeys = [];
    window.sanityQaMovementKeys = [];
    for (const type of ["keydown", "keyup"])
      window.addEventListener(
        type,
        (event) => {
          if (!/^(Key[WASD]|ShiftLeft|KeyF)$/.test(event.code)) return;
          window.sanityQaMovementKeys.push({
            atMs: performance.now(),
            type,
            code: event.code,
            focused: document.activeElement?.tagName ?? null,
            overlayHidden: document.getElementById("overlay")?.hidden ?? null,
          });
          if (window.sanityQaMovementKeys.length > 200)
            window.sanityQaMovementKeys.shift();
        },
        true,
      );
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.code !== "KeyE") return;
        const observed = window.sanityInspect?.();
        window.sanityQaInteractionKeys.push({
          at: performance.now(),
          room: observed?.state.room ?? null,
          paused: observed?.paused ?? null,
          target: event.target?.tagName ?? null,
        });
      },
      true,
    );
  });
  page.setDefaultTimeout(timeout);
  page.on("pageerror", (error) =>
    trace.errors.push({ type: "pageerror", message: error.message }),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      trace.errors.push({ type: "console", message: message.text() });
  });

  await page.goto(url);
  const menuFrame = (await inspect()).draw.frame;
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await waitObserved(
    "Nueva partida activa y título cerrado",
    (previousFrame) => {
      const current = window.sanityInspect();
      return (
        current.started &&
        !current.paused &&
        current.overlayHidden &&
        !current.titleTransitionClosed &&
        current.state.room === 0 &&
        current.state.health > 0 &&
        current.state.elapsed > 0 &&
        current.draw.frame > previousFrame
      );
    },
    menuFrame,
  );
  let s = await snapshot("Nueva partida");
  check(
    "Nueva partida limpia en 1927",
    campaignStartReady(s, menuFrame) &&
      s.state.health === 100 &&
      s.state.campaign.completed.length === 0 &&
      !s.state.defeated.includes("enemy8"),
    {
      started: s.started,
      paused: s.paused,
      overlayHidden: s.overlayHidden,
      titleTransitionClosed: s.titleTransitionClosed,
      elapsed: s.state.elapsed,
      health: s.state.health,
      enemy: s.enemy,
    },
  );

  await runLucius();
  if (stageIndex >= 1) await runAurelia();
  if (stageIndex >= 2) await runMaeve();
  if (stageIndex >= 3) await runSamira();
  if (stageIndex >= 4) await runIdris();
  if (stageIndex >= 5) await runOona();
  if (stageIndex >= 6) await runIsabelle();
  if (stageIndex >= 7) {
    await prepareLegacy();
    for (const chapter of lateRuns)
      if (stageIndex >= stages.indexOf(chapter.stage))
        await runLateChapter(chapter);
  }
  if (through === "final") await runElise();
  check(
    "Todos los capítulos solicitados están completos",
    trace.chapters.length === chapterCount &&
      trace.chapters.every((chapter) =>
        chapter.completedAfterReturn.includes(chapter.id),
      ) &&
      (through !== "final" || trace.ending?.type === "historical"),
  );
  check("Sin errores JavaScript", trace.errors.length === 0, {
    errors: trace.errors,
  });
  trace.completed = true;
  console.log(
    `PASS campaña hasta ${through} en ${Math.round((performance.now() - started) / 1000)} s`,
  );
} catch (error) {
  trace.errors.push({
    type: "failure",
    message: String(error),
    stack: error.stack,
  });
  console.error(`FAIL campaña hasta ${through}: ${error.message}`);
  if (page) {
    await snapshot("estado del fallo").catch(() => {});
    await page
      .screenshot({ path: join(out, `${through}-fallo.png`) })
      .catch(() => {});
  }
  process.exitCode = 1;
} finally {
  trace.finishedAt = new Date().toISOString();
  trace.wallMs = Math.round(performance.now() - started);
  writeFileSync(join(out, traceName), JSON.stringify(trace, null, 2));
  if (browser) await browser.close().catch(() => {});
}
