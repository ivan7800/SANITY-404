export function classifyRenderer({
  renderer = "",
  vendor = "",
  unmasked = false,
}) {
  const identity = `${vendor} ${renderer}`;
  if (
    /swiftshader|llvmpipe|softpipe|software rasterizer|software renderer|microsoft basic render|lavapipe|virgl/i.test(
      identity,
    )
  )
    return "software";
  if (
    unmasked &&
    /intel|nvidia|geforce|radeon|\bamd\b|apple gpu|mali|adreno|powervr/i.test(
      identity,
    )
  )
    return "physical";
  return "unknown";
}

export function summarizeFrames(frames) {
  const sorted = frames
    .filter((ms) => Number.isFinite(ms) && ms > 0)
    .sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.ceil(p * sorted.length) - 1] ?? null;
  const sum = sorted.reduce((a, b) => a + b, 0);
  let windowSum = 0;
  let minimumRolling60Fps = null;
  for (let i = 0; i < frames.length; i++) {
    windowSum += frames[i];
    if (i >= 60) windowSum -= frames[i - 60];
    if (i >= 59) {
      const fps = 60000 / windowSum;
      minimumRolling60Fps = Math.min(minimumRolling60Fps ?? fps, fps);
    }
  }
  return {
    frames: sorted.length,
    averageFps: sum > 0 ? (sorted.length * 1000) / sum : null,
    minimumObservedFps: sorted.length ? 1000 / sorted.at(-1) : null,
    minimumRolling60Fps,
    frameP50Ms: percentile(0.5),
    frameP95Ms: percentile(0.95),
    frameP99Ms: percentile(0.99),
  };
}

export function validateScenario(s) {
  const invalidReasons = [];
  if (s.frames < 2) invalidReasons.push("fotogramas insuficientes");
  if (s.roomAtEnd !== s.room) invalidReasons.push("cambio de sala");
  if (s.pausedFrames > 0 || s.pausedAtEnd || s.healthAtEnd <= 0)
    invalidReasons.push("pausa o muerte");
  if (s.gameElapsedSeconds < s.expectedGameSeconds * 0.85)
    invalidReasons.push("simulación detenida");
  if (s.requireHardware && s.gameElapsedSeconds < s.elapsedSeconds * 0.9)
    invalidReasons.push("simulación lenta");
  if (s.scenario === "psychological" && s.eventCount < 1)
    invalidReasons.push("sin evento psicológico");
  if (
    s.scenario === "combat" &&
    (s.enemyVisibleRatio < 0.8 || s.combatEngagedRatio < 0.3)
  )
    invalidReasons.push("combate inactivo");
  if (s.errors.length) invalidReasons.push("errores de navegador");
  return { scenarioValid: invalidReasons.length === 0, invalidReasons };
}
