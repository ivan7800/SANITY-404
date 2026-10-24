import { expect, it } from "vitest";
import * as T from "three";
import { RitualVisual } from "../src/world/ritual-visual";

it("anima y libera anillos y partículas; Bajo reduce el número de partículas", () => {
  const scene = new T.Scene();
  const low = new RitualVisual(scene, 1, 2, "veil", 1);
  const medium = new RitualVisual(scene, -1, -2, "reading", 1.3);
  const points = (effect: RitualVisual) =>
    effect.root.children.find(
      (child): child is T.Points => child instanceof T.Points,
    )!;
  expect(points(low).geometry.getAttribute("position").count).toBe(18);
  expect(points(medium).geometry.getAttribute("position").count).toBe(36);
  expect(low.root.position.toArray()).toEqual([1, 0, 2]);
  expect(low.update(0.5)).toBe(true);
  expect(points(low).geometry.getAttribute("position").getY(0)).toBeGreaterThan(
    0,
  );
  expect(low.update(2)).toBe(false);
  low.dispose();
  medium.dispose();
  expect(scene.children).toHaveLength(0);
});
