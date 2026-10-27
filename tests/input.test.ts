import { it, expect, vi, afterEach } from "vitest";
import { Input } from "../src/engine/input";
afterEach(() => vi.unstubAllGlobals());
it("el mando usa zona muerta y activa acciones una sola vez por pulsación", () => {
  vi.stubGlobal("addEventListener", () => {});
  const buttons = Array.from({ length: 12 }, () => ({ pressed: false }));
  const pad = { axes: [0.1, -0.8, 0.4, 0], buttons };
  vi.stubGlobal("navigator", { getGamepads: () => [pad] });
  const input = new Input({
    addEventListener: () => {},
  } as unknown as HTMLCanvasElement);
  expect(input.poll()).toMatchObject({ x: 0, z: -0.8 });
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
