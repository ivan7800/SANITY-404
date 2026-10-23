/** Locate the slowest contiguous block of 60 display intervals. */
export function worstWindow60(frames) {
  if (frames.length < 60) return null;
  let sum = 0;
  let worstSum = -Infinity;
  let worstEnd = 0;
  let elapsed = 0;
  let worstAt = 0;
  for (let i = 0; i < frames.length; i++) {
    sum += frames[i];
    elapsed += frames[i];
    if (i >= 60) sum -= frames[i - 60];
    if (i >= 59 && sum > worstSum) {
      worstSum = sum;
      worstEnd = i;
      worstAt = elapsed;
    }
  }
  return {
    fps: 60000 / worstSum,
    startFrame: worstEnd - 59,
    endFrame: worstEnd,
    startSeconds: (worstAt - worstSum) / 1000,
    endSeconds: worstAt / 1000,
    durationMs: worstSum,
    missedVsyncs: frames
      .slice(worstEnd - 59, worstEnd + 1)
      .filter((interval) => interval >= 25).length,
    largestIntervalMs: Math.max(...frames.slice(worstEnd - 59, worstEnd + 1)),
  };
}
