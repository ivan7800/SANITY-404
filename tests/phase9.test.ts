import { expect, it, vi } from "vitest";
import * as T from "three";
import { CinematicCamera } from "../src/engine/camera";
import { Atmosphere } from "../src/render/atmosphere";
import { World } from "../src/world/scene";

it("mantiene profundidad cromática distinta en las tres épocas, también en Bajo", () => {
  const worlds = [0, 8, 9].map((room) => new World(room, [], [], [], [], 1));
  const backgrounds = worlds.map((world) =>
    (world.scene.background as T.Color).getHex(),
  );
  const fog = worlds.map((world) =>
    (world.scene.fog as T.FogExp2).color.getHex(),
  );
  expect(new Set(backgrounds).size).toBe(3);
  expect(new Set(fog).size).toBe(3);
  expect(worlds.every((world) => !world.shadowLight.castShadow)).toBe(true);
  worlds.forEach((world) => world.dispose());
});

it("no recalcula la proyección por fotograma si el encuadre conserva el campo de visión", () => {
  const camera = new T.PerspectiveCamera();
  const projection = vi.spyOn(camera, "updateProjectionMatrix");
  const director = new CinematicCamera();
  director.update(camera, 0, 5, 0, 0, false);
  expect(projection).toHaveBeenCalledTimes(1);
  for (let i = 0; i < 120; i++) director.update(camera, 0, 5, 0, 1 / 60, false);
  expect(projection).toHaveBeenCalledTimes(1);
  director.update(camera, 0, 5, 0, 1 / 60, false, [], { mode: "modern" });
  expect(projection).toHaveBeenCalledTimes(2);
});

it("limita las transferencias de polvo a GPU sin detener su movimiento", () => {
  const scene = new T.Scene();
  const atmosphere = new Atmosphere(scene, 32);
  const attribute = atmosphere.dust.geometry.attributes
    .position as T.BufferAttribute;
  const initialVersion = attribute.version;
  const initialY = attribute.getY(0);
  for (let i = 0; i < 3; i++) atmosphere.update(1 / 60, i / 60, false);
  expect(attribute.version).toBe(initialVersion);
  atmosphere.update(1 / 60, 4 / 60, false);
  expect(attribute.version).toBe(initialVersion + 1);
  expect(attribute.getY(0)).toBeLessThan(initialY);
  atmosphere.dispose();
});
