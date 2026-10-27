import { expect, it } from "vitest";
import {
  MAX_SIMULATION_FRAME_SECONDS,
  simulationDeltaSeconds,
} from "../src/engine/time";

it("mantiene tiempo real a 3,53 FPS y limita pausas largas", () => {
  expect(simulationDeltaSeconds(1000 / 60)).toBeCloseTo(1 / 60, 6);
  expect(simulationDeltaSeconds(1000 / 3.53)).toBeCloseTo(1 / 3.53, 6);
  expect(simulationDeltaSeconds(2000)).toBe(MAX_SIMULATION_FRAME_SECONDS);
  expect(simulationDeltaSeconds(-1)).toBe(0);
  expect(simulationDeltaSeconds(Number.NaN)).toBe(0);
});
