import { expect, it } from "vitest";
import {
  classifyRenderer,
  summarizeFrames,
  validateScenario,
} from "../scripts/phase9-benchmark.mjs";

it("rechaza renderizadores de software y no confunde un identificador genérico con GPU física", () => {
  expect(
    classifyRenderer({
      renderer: "ANGLE (Google, Vulkan SwiftShader Device)",
      unmasked: true,
    }),
  ).toBe("software");
  expect(
    classifyRenderer({ renderer: "Mesa llvmpipe (LLVM 19)", unmasked: true }),
  ).toBe("software");
  expect(classifyRenderer({ renderer: "Mesa lavapipe", unmasked: true })).toBe(
    "software",
  );
  expect(
    classifyRenderer({
      renderer: "ANGLE (Intel HD Graphics 620)",
      unmasked: true,
    }),
  ).toBe("physical");
  expect(classifyRenderer({ renderer: "WebKit WebGL", unmasked: false })).toBe(
    "unknown",
  );
});

it("calcula FPS, peor intervalo y percentiles a partir de los intervalos observados", () => {
  const m = summarizeFrames([10, 20, 30, 40, 50]);
  expect(m.averageFps).toBeCloseTo(33.333, 2);
  expect(m.minimumObservedFps).toBe(20);
  expect(m.frameP50Ms).toBe(30);
  expect(m.frameP95Ms).toBe(50);
  expect(m.frameP99Ms).toBe(50);
  expect(
    summarizeFrames(Array(59).fill(16.667)).minimumRolling60Fps,
  ).toBeNull();
  expect(
    summarizeFrames([...Array(60).fill(16.667), ...Array(60).fill(33.333)])
      .minimumRolling60Fps,
  ).toBeCloseTo(30, 0);
});

it("acepta simulación limitada por fotograma, pero detecta pausa, ausencia de evento y combate inactivo", () => {
  const base = {
    frames: 150,
    room: 0,
    roomAtEnd: 0,
    pausedFrames: 0,
    pausedAtEnd: false,
    healthAtEnd: 60,
    gameElapsedSeconds: 29,
    expectedGameSeconds: 30,
    elapsedSeconds: 60,
    requireHardware: false,
    enemyVisibleRatio: 1,
    combatEngagedRatio: 0.8,
    eventCount: 1,
    errors: [],
    scenario: "exploration",
  };
  expect(validateScenario(base).scenarioValid).toBe(true);
  expect(
    validateScenario({ ...base, requireHardware: true }).invalidReasons,
  ).toContain("simulación lenta");
  expect(
    validateScenario({ ...base, pausedFrames: 1 }).invalidReasons,
  ).toContain("pausa o muerte");
  expect(
    validateScenario({ ...base, scenario: "psychological", eventCount: 0 })
      .invalidReasons,
  ).toContain("sin evento psicológico");
  expect(
    validateScenario({ ...base, scenario: "combat", combatEngagedRatio: 0 })
      .invalidReasons,
  ).toContain("combate inactivo");
});
