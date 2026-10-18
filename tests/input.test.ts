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
