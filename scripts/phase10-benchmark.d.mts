export function worstWindow60(frames: number[]): {
  fps: number;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
  durationMs: number;
  missedVsyncs: number;
  largestIntervalMs: number;
} | null;
