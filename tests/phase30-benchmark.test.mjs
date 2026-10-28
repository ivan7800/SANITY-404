import { expect, it } from "vitest";
import {
  benchmarkPlan,
  blockedProfileResults,
} from "../scripts/phase30-benchmark-plan.mjs";

it("planifica seis escenarios equivalentes en Bajo y Medio sin abrir Chromium", () => {
  const manifest = benchmarkPlan({
    SANITY_PHASE30_SECONDS: "4",
    SANITY_HARDWARE: "1",
  });
  expect(manifest.viewport).toEqual([1440, 900]);
  expect(manifest.durationSeconds).toBe(4);
  expect(manifest.hardwareRequired).toBe(true);
  expect(manifest.scenarios.map(({ id }) => id)).toEqual([
    "menu",
    "simple",
    "hall",
    "stairs",
    "widow",
    "sanity",
  ]);
  expect(manifest.profiles).toEqual([
    { name: "Medio", quality: 1.3 },
    { name: "Bajo", quality: 1 },
  ]);
  expect(manifest.samplesPlanned).toBe(12);
});

it("rechaza escenarios inexistentes y duraciones inválidas", () => {
  expect(() =>
    benchmarkPlan({ SANITY_PHASE30_SCENARIOS: "inventado" }),
  ).toThrow("Escenario desconocido");
  expect(() => benchmarkPlan({ SANITY_PHASE30_SECONDS: "1" })).toThrow(
    "entre 2 y 15",
  );
  expect(
    benchmarkPlan({ SANITY_PHASE30_SCENARIOS: "widow,sanity" }).samplesPlanned,
  ).toBe(4);
});

it("conserva todos los casos como BLOCKED si Chromium no arranca", () => {
  const plan = benchmarkPlan({});
  const blocked = plan.profiles.flatMap((profile) =>
    blockedProfileResults(profile.name, plan.scenarios, "crashpad EPERM"),
  );
  expect(blocked).toHaveLength(12);
  expect(blocked.every((result) => result.status === "BLOCKED")).toBe(true);
  expect(blocked.every((result) => result.error === "crashpad EPERM")).toBe(
    true,
  );
});
