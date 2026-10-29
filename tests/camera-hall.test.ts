import { expect, it } from "vitest";
import * as T from "three";
import { CinematicCamera } from "../src/engine/camera";
import { blocked } from "../src/systems/collision";
import { World } from "../src/world/scene";

it("la cámara de entrada muestra el eje del vestíbulo sin quedar entre cortinas", () => {
  const world = new World(0, [], [], []);
  const camera = new T.PerspectiveCamera();
  const cinematic = new CinematicCamera();
  cinematic.update(camera, 0, 5.2, 0, 0, true, world.obstacles);
  expect(cinematic.zone).toBe("entrada");
  expect(cinematic.corrected).toBe(false);
  expect(camera.position.x).toBeGreaterThan(-1);
  expect(camera.position.x).toBeLessThan(1);
  expect(camera.position.z).toBeGreaterThan(6.9);
  expect(blocked(camera.position.x, camera.position.z, world.obstacles)).toBe(
    false,
  );
  world.dispose();
});

it("la cámara moderna gira alrededor del personaje sin alterar los encuadres clásicos", () => {
  const camera = new T.PerspectiveCamera();
  const modern = new CinematicCamera();
  modern.update(camera, 0, 0, 1, 0, false, [], { mode: "modern" });
  const initialX = camera.position.x;
  modern.rotateModern(0.3);
  modern.rotateModern(0.3);
  modern.rotateModern(0.3);
  modern.update(camera, 0, 0, 1, 0, false, [], { mode: "modern" });
  expect(camera.position.x).toBeGreaterThan(initialX + 1);
  expect(camera.position.y).toBeCloseTo(2.05);
  const classic = new T.PerspectiveCamera();
  modern.update(classic, 0, 0, 1, 0, false, [], { mode: "classic" });
  const untouched = new T.PerspectiveCamera();
  new CinematicCamera().update(untouched, 0, 0, 1, 0, false, [], {
    mode: "classic",
  });
  expect(classic.position.toArray()).toEqual(untouched.position.toArray());
});
