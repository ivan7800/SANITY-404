import { expect, it } from "vitest";
import { worstWindow60 } from "../scripts/phase10-benchmark.mjs";

it("localiza la peor ventana continua de 60 fotogramas", () => {
  const frames = [
    ...Array(60).fill(16),
    ...Array(60).fill(20),
    ...Array(60).fill(16),
  ];
  const result = worstWindow60(frames);
  expect(result?.fps).toBe(50);
  expect(result?.endFrame).toBe(119);
  expect(result?.startFrame).toBe(60);
  expect(result?.startSeconds).toBeCloseTo(0.96);
  expect(result?.durationMs).toBe(1200);
  expect(result?.missedVsyncs).toBe(0);
  expect(result?.largestIntervalMs).toBe(20);
  expect(worstWindow60(frames.slice(0, 59))).toBeNull();
});
