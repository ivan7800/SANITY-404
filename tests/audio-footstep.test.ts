import { expect, it, vi } from "vitest";
import { Audio, audibleFootstep, footstepSurface } from "../src/systems/audio";
import { move } from "../src/systems/collision";

it("solo suena al avanzar físicamente; conserva el paso al deslizarse junto a un mueble", () => {
  const obstacle = [{ x: 0, z: 0, w: 1, d: 1 }];
  const start = { x: -0.85, z: 0 };
  const blocked = move(start.x, start.z, 0.12, 0, obstacle);
  expect(blocked).toEqual(start);
  expect(audibleFootstep(1, start, blocked)).toBe(false);

  const sliding = move(start.x, start.z, 0.12, 0.12, obstacle);
  expect(sliding.x).toBe(start.x);
  expect(sliding.z).toBeGreaterThan(start.z);
  expect(audibleFootstep(1, start, sliding)).toBe(true);
  expect(audibleFootstep(0, start, sliding)).toBe(false);
});

it("distingue las 29 salas sin añadir voces simultáneas por paso", () => {
  for (let room = 0; room < 29; room++)
    expect(["wood", "stone", "tile", "metal", "wet"]).toContain(
      footstepSurface(room),
    );
  expect(footstepSurface(0, true)).toBe("wood");
  expect(footstepSurface(11)).toBe("tile");
  expect(footstepSurface(16)).toBe("metal");
  expect(footstepSurface(28)).toBe("wet");

  const audio = new Audio();
  const tone = vi.spyOn(audio, "tone").mockImplementation(() => {});
  audio.step(0, false);
  audio.step(11, false);
  audio.step(16, false);
  audio.step(28, false);
  expect(tone).toHaveBeenCalledTimes(4);
  expect(new Set(tone.mock.calls.map(([frequency]) => frequency)).size).toBe(4);
});
