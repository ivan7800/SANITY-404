/** Pure configuration so benchmark coverage is testable without Chromium. */
export const scenarios = [
  { id: "menu", name: "Menú principal" },
  { id: "simple", name: "Ruinas del intervalo", room: 4 },
  { id: "hall", name: "Vestíbulo Veyr", room: 0 },
  { id: "stairs", name: "Escalera Veyr", room: 0, position: [5, -1.3] },
  {
    id: "widow",
    name: "Combate con la Viuda",
    room: 0,
    floor: 1,
    position: [3.8, -5.2],
  },
  { id: "sanity", name: "Manifestación de cordura", room: 0, sanity: 20 },
];
export const profiles = [
  { name: "Medio", quality: 1.3 },
  { name: "Bajo", quality: 1 },
];
export function benchmarkPlan(env = process.env) {
  const seconds = Number(env.SANITY_PHASE30_SECONDS || 4);
  if (!Number.isFinite(seconds) || seconds < 2 || seconds > 15)
    throw new RangeError("SANITY_PHASE30_SECONDS debe estar entre 2 y 15");
  const selected = (env.SANITY_PHASE30_SCENARIOS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (selected.some((id) => !scenarios.some((scene) => scene.id === id)))
    throw new RangeError(`Escenario desconocido: ${selected.join(", ")}`);
  const cases = selected.length
    ? scenarios.filter((scene) => selected.includes(scene.id))
    : scenarios;
  return {
    url: env.SANITY_TEST_URL || "http://127.0.0.1:5174/",
    viewport: [1440, 900],
    durationSeconds: seconds,
    profiles,
    scenarios: cases,
    samplesPlanned: profiles.length * cases.length,
    hardwareRequired: env.SANITY_HARDWARE === "1",
  };
}

export function blockedProfileResults(profile, cases, error) {
  return cases.map((scene) => ({
    profile,
    scenario: scene.id,
    name: scene.name,
    status: "BLOCKED",
    error: String(error),
  }));
}
