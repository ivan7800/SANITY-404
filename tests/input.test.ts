import { it, expect, vi, afterEach } from "vitest";
import {
  Input,
  cameraRelativeMovement,
  normalizeMovement,
  radialStick,
} from "../src/engine/input";
afterEach(() => vi.unstubAllGlobals());
it("el mando usa zona muerta y activa acciones una sola vez por pulsación", () => {
  vi.stubGlobal("addEventListener", () => {});
  const buttons = Array.from({ length: 12 }, () => ({ pressed: false }));
  const pad = { axes: [0.1, -0.8, 0.4, 0], buttons };
  vi.stubGlobal("navigator", { getGamepads: () => [pad] });
  const input = new Input({
    addEventListener: () => {},
  } as unknown as HTMLCanvasElement);
  expect(input.poll().z).toBeCloseTo(-0.76, 1);
  expect(input.poll().x).toBeGreaterThan(0);
  buttons[0].pressed = true;
  input.poll();
  expect(input.take("KeyE")).toBe(true);
  input.poll();
  expect(input.take("KeyE")).toBe(false);
  buttons[0].pressed = false;
  input.poll();
  buttons[0].pressed = true;
  input.poll();
  expect(input.take("KeyE")).toBe(true);
});

it("los botones táctiles mantienen movimiento y abren el diario una vez", () => {
  vi.stubGlobal("addEventListener", () => {});
  vi.stubGlobal("navigator", { getGamepads: () => [] });
  const buttons = ["KeyW", "Tab"].map((key) => {
    const listeners = new Map<string, (event: PointerEvent) => void>();
    return {
      dataset: { touchKey: key },
      listeners,
      addEventListener: (name: string, fn: (event: PointerEvent) => void) =>
        listeners.set(name, fn),
      setPointerCapture: () => {},
    };
  });
  vi.stubGlobal("document", { querySelectorAll: () => buttons });
  const input = new Input({
    addEventListener: () => {},
  } as unknown as HTMLCanvasElement);
  const pointer = { pointerId: 1, preventDefault: () => {} } as PointerEvent;
  buttons[0].listeners.get("pointerdown")!(pointer);
  expect(input.poll().z).toBe(-1);
  buttons[0].listeners.get("pointerup")!(pointer);
  expect(input.poll().z).toBe(0);
  buttons[1].listeners.get("pointerdown")!(pointer);
  expect(input.take("Tab")).toBe(true);
  expect(input.take("Tab")).toBe(false);
});

it("H se registra una vez, se descarta en pausa y se limpia al perder foco", () => {
  const listeners = new Map<string, (event: KeyboardEvent) => void>();
  vi.stubGlobal(
    "addEventListener",
    (name: string, fn: (event: KeyboardEvent) => void) =>
      listeners.set(name, fn),
  );
  vi.stubGlobal("navigator", { getGamepads: () => [] });
  const input = new Input({
    addEventListener: () => {},
  } as unknown as HTMLCanvasElement);
  const key = { code: "KeyH", preventDefault: () => {} } as KeyboardEvent;
  listeners.get("keydown")!(key);
  expect(input.take("KeyH")).toBe(true);
  listeners.get("keydown")!(key);
  expect(input.take("KeyH")).toBe(false);
  listeners.get("keyup")!(key);
  listeners.get("keydown")!(key);
  input.end(); // A paused game discards the pending action.
  expect(input.take("KeyH")).toBe(false);
  listeners.get("blur")!(key);
  expect(input.keys.has("KeyH")).toBe(false);
  expect(input.take("KeyH")).toBe(false);
});

it("normaliza diagonales de teclado y mando sin aceleración artificial", () => {
  expect(normalizeMovement(1, 1)).toEqual({
    x: Math.SQRT1_2,
    z: Math.SQRT1_2,
  });
  expect(normalizeMovement(0.4, -0.3)).toEqual({ x: 0.4, z: -0.3 });
  const diagonal = radialStick(0.8, 0.8);
  expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1);
  expect(diagonal.x).toBeCloseTo(diagonal.z);
  expect(radialStick(0.08, 0.08)).toEqual({ x: 0, z: 0 });
  expect(radialStick(0, 1)).toEqual({ x: 0, z: 1 });
});

it("combina WASD y stick sin superar la velocidad máxima", () => {
  vi.stubGlobal("addEventListener", () => {});
  vi.stubGlobal("navigator", {
    getGamepads: () => [{ axes: [0.9, -0.9, 0], buttons: [] }],
  });
  const input = new Input({
    addEventListener: () => {},
  } as unknown as HTMLCanvasElement);
  input.keys.add("KeyD");
  const movement = input.poll();
  expect(Math.hypot(movement.x, movement.z)).toBeLessThanOrEqual(1.0000001);
  expect(movement.x).toBeGreaterThan(0);
  expect(movement.z).toBeLessThan(0);
});

it("Modern usa la orientación de la cámara y Classic conserva ejes del mundo", () => {
  expect(cameraRelativeMovement(0, -1, 0, -1)).toEqual({ x: 0, z: -1 });
  const turned = cameraRelativeMovement(0, -1, -1, 0);
  expect(turned.x).toBeCloseTo(-1);
  expect(turned.z).toBeCloseTo(0);
  const right = cameraRelativeMovement(1, 0, -1, 0);
  expect(right.x).toBeCloseTo(0);
  expect(right.z).toBeCloseTo(-1);
  const fallback = cameraRelativeMovement(1, 0, 0, 0);
  expect(fallback).toEqual({ x: 1, z: 0 });
});
