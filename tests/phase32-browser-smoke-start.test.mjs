import { expect, it } from "vitest";
import { campaignStartReady } from "../scripts/phase22-start-readiness.mjs";

it("no acepta el fotograma 23 del menú como Nueva partida", () => {
  const observedInLinuxMint = {
    started: false,
    paused: true,
    overlayHidden: false,
    titleTransitionClosed: true,
    state: { room: 0, health: 100, elapsed: 0 },
    draw: { frame: 23 },
  };
  expect(observedInLinuxMint.draw.frame > 5).toBe(true);
  expect(campaignStartReady(observedInLinuxMint, 5)).toBe(false);

  const playable = {
    ...observedInLinuxMint,
    started: true,
    paused: false,
    overlayHidden: true,
    titleTransitionClosed: false,
    state: { room: 0, health: 100, elapsed: 0.02 },
    draw: { frame: 24 },
  };
  expect(campaignStartReady(playable, 23)).toBe(true);
});
