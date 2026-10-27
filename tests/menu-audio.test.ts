import { expect, it, vi } from "vitest";
import { Audio } from "../src/systems/audio";

it("la portada permanece en silencio hasta que el contexto de audio está activo", () => {
  const audio = new Audio();
  const tone = vi.spyOn(audio, "tone").mockImplementation(() => {});
  audio.menuAmbient(20);
  expect(tone).not.toHaveBeenCalled();
  audio.ctx = { state: "suspended" } as AudioContext;
  audio.menuAmbient(20);
  expect(tone).not.toHaveBeenCalled();
  audio.ctx = { state: "running" } as AudioContext;
  audio.setVolume(0);
  audio.menuAmbient(20);
  expect(tone).not.toHaveBeenCalled();
  audio.setVolume(0.35);
  audio.menuAmbient(20);
  expect(tone).not.toHaveBeenCalled();
  audio.menuAmbient(21);
  expect(tone).not.toHaveBeenCalled();
  audio.menuAmbient(23);
  expect(tone).toHaveBeenCalledTimes(1);
  audio.menuAmbient(27);
  expect(tone).toHaveBeenCalledTimes(3);
});
