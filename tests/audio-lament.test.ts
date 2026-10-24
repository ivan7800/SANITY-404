import { expect, it, vi } from "vitest";
import { Audio } from "../src/systems/audio";

it("el lamento respeta volumen, posición, distancia y libera sus voces", () => {
  const voices: Array<{
    onended: (() => void) | null;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const envelopes: Array<{
    gain: { linearRampToValueAtTime: ReturnType<typeof vi.fn> };
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const panners: Array<{
    pan: { value: number };
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const context = {
    state: "running",
    currentTime: 2,
    createOscillator: () => {
      const voice = {
        type: "sine",
        frequency: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      voices.push(voice);
      return voice;
    },
    createGain: () => {
      const envelope = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      envelopes.push(envelope);
      return envelope;
    },
    createStereoPanner: () => {
      const panner = {
        pan: { value: 0 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      panners.push(panner);
      return panner;
    },
  };
  const master = { gain: { setTargetAtTime: vi.fn() } };
  const audio = new Audio();
  audio.ctx = context as unknown as AudioContext;
  audio.gain = master as unknown as GainNode;
  audio.setVolume(0.3);
  expect(master.gain.setTargetAtTime).toHaveBeenCalledWith(0.3, 2, 0.1);

  expect(audio.lament(0.6, 0)).toBe(true);
  expect(audio.lament(-0.6, 5)).toBe(true);
  expect(panners.map((panner) => panner.pan.value)).toEqual([0.6, -0.6]);
  const near = envelopes[0].gain.linearRampToValueAtTime.mock.calls[0][0];
  const far = envelopes[2].gain.linearRampToValueAtTime.mock.calls[0][0];
  expect(near).toBeCloseTo(0.042);
  expect(far).toBeCloseTo(0.042 / (1 + 5 * 0.38));
  expect(far).toBeLessThan(near);
  expect(audio.activeVoices).toBe(2);

  audio.setReduceAudio(true);
  expect(audio.lament(0, 0)).toBe(false);
  expect(voices).toHaveLength(4);
  for (const voice of voices) voice.onended?.();
  expect(audio.activeVoices).toBe(0);
  expect(
    panners.every((panner) => panner.disconnect.mock.calls.length === 1),
  ).toBe(true);
  audio.setReduceAudio(false);
  context.state = "suspended";
  expect(audio.lament(0, 0)).toBe(false);
  expect(voices).toHaveLength(4);
});
