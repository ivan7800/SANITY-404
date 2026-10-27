/** Keep ordinary slow frames in real time; bound long tab/GPU interruptions. */
export const MAX_SIMULATION_FRAME_SECONDS = 0.35;

export function simulationDeltaSeconds(intervalMs: number) {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return 0;
  return Math.min(intervalMs / 1000, MAX_SIMULATION_FRAME_SECONDS);
}
