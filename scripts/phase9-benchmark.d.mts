export function classifyRenderer(gpu: {
  renderer?: string;
  vendor?: string;
  unmasked?: boolean;
}): "software" | "physical" | "unknown";

export function summarizeFrames(frames: number[]): {
  frames: number;
  averageFps: number | null;
  minimumObservedFps: number | null;
  minimumRolling60Fps: number | null;
  frameP50Ms: number | null;
  frameP95Ms: number | null;
  frameP99Ms: number | null;
};

export function validateScenario(sample: {
  frames: number;
  room: number;
  roomAtEnd: number;
  pausedFrames: number;
  pausedAtEnd: boolean;
  healthAtEnd: number;
  gameElapsedSeconds: number;
  expectedGameSeconds: number;
  elapsedSeconds: number;
  requireHardware: boolean;
  enemyVisibleRatio: number;
  combatEngagedRatio: number;
  eventCount: number;
  errors: string[];
  scenario: string;
}): { scenarioValid: boolean; invalidReasons: string[] };
