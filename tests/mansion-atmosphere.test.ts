import { expect, it, vi } from "vitest";
import * as T from "three";
import { lightScene } from "../src/render/lighting";
import { Audio } from "../src/systems/audio";
import { mansion } from "../src/world/mansion";

it("ilumina la mansión por zonas sin añadir otra luz con sombras", () => {
  const scene = new T.Scene();
  const key = lightScene(scene, 1.3, 0);
  const lights = scene.children.filter((object) => object instanceof T.Light);
  expect(lights).toHaveLength(3);
  expect(lights.filter((light) => light.castShadow)).toEqual([key]);
  expect(key.intensity).toBe(76);
  expect(key.shadow.mapSize.x).toBe(1024);
  const fill = lights.find(
    (light) => light instanceof T.PointLight,
  ) as T.PointLight;
  expect(fill.position.toArray()).toEqual([2.8, 3.3, -4.5]);
  expect(fill.castShadow).toBe(false);
});

it("conserva el candelabro visible sin proyectar una silueta enorme en la bóveda", () => {
  const group = mansion([]);
  const fixture = group.children.filter(
    (object) => object.name === "mansion-chandelier-without-vault-shadow",
  );
  expect(fixture.length).toBeGreaterThan(0);
  expect(fixture.every((object) => !object.castShadow && object.visible)).toBe(
    true,
  );
  expect(group.children.some((object) => object.castShadow)).toBe(true);
});

it("el reloj de la mansión respeta estancia, audio reducido y liberación de voces", () => {
  const voices: Array<{ onended: (() => void) | null }> = [];
  const levels: number[] = [];
  const audio = new Audio();
  vi.spyOn(audio, "tone").mockImplementation(() => {});
  audio.ctx = {
    state: "running",
    currentTime: 2,
    createOscillator: () => {
      const voice = {
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
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
    createGain: () => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: (value: number) => levels.push(value),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
  } as unknown as AudioContext;
  audio.gain = {} as GainNode;
  audio.setRoom(1);
  audio.ambient(0, 80);
  expect(voices).toHaveLength(0);
  audio.setRoom(0);
  audio.ambient(0, 80);
  expect(voices).toHaveLength(2);
  audio.ambient(12, 80);
  expect(voices).toHaveLength(2);
  audio.setReduceAudio(true);
  audio.ambient(14, 80);
  expect(voices).toHaveLength(4);
  expect(levels).toEqual([0.018, 0.018, 0.004, 0.004]);
  audio.silence(27, 5);
  audio.ambient(28, 80);
  expect(voices).toHaveLength(4);
  audio.volume = 0;
  audio.ambient(33, 80);
  expect(voices).toHaveLength(4);
  for (const voice of voices) voice.onended?.();
  expect(audio.activeVoices).toBe(0);
});
