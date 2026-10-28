import { expect, it } from "vitest";
import { campaignStartReady } from "../scripts/phase22-start-readiness.mjs";

const snapshot = (changes = {}) => ({
  started: true,
  paused: false,
  overlayHidden: true,
  titleTransitionClosed: false,
  state: { room: 0, health: 100, elapsed: 0.02 },
  draw: { frame: 7 },
  ...changes,
});

it("no confunde un fotograma del título con una nueva partida jugable", () => {
  expect(
    campaignStartReady(
      snapshot({
        started: false,
        paused: true,
        overlayHidden: false,
        state: { room: 0, health: 100, elapsed: 0 },
      }),
      5,
    ),
  ).toBe(false);
  expect(campaignStartReady(snapshot({ titleTransitionClosed: true }), 5)).toBe(
    false,
  );
  expect(
    campaignStartReady(
      snapshot({ state: { room: 0, health: 0, elapsed: 8 } }),
      5,
    ),
  ).toBe(false);
  expect(campaignStartReady(snapshot(), 7)).toBe(false);
  expect(campaignStartReady(snapshot(), 5)).toBe(true);
});
