export const requiredStartupStages = [
  "main-loaded",
  "waiting-for-ready",
  "app-ready",
  "window-created",
  "window-loaded",
];

export function evaluateStartup(records) {
  const stages = records.map((entry) => entry.stage);
  const missing = requiredStartupStages.filter(
    (stage) => !stages.includes(stage),
  );
  const positions = requiredStartupStages.map((stage) => stages.indexOf(stage));
  const ordered = positions.every(
    (position, index) => index === 0 || position > positions[index - 1],
  );
  const window = records.find((entry) => entry.stage === "window-created");
  const loaded = records.find((entry) => entry.stage === "window-loaded");
  const errors = records.filter((entry) => entry.stage.endsWith("-failed"));
  return {
    passed:
      missing.length === 0 &&
      ordered &&
      errors.length === 0 &&
      window?.visible === true &&
      loaded?.url === "sanity://game/index.html",
    missing,
    ordered,
    visible: window?.visible ?? false,
    url: loaded?.url ?? "",
    errors,
  };
}
