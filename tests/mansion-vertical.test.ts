import { expect, it, vi } from "vitest";
import * as T from "three";
import { CinematicCamera } from "../src/engine/camera";
import { mansion, mansionFloorHeight } from "../src/world/mansion";
import { World } from "../src/world/scene";
import { blocked } from "../src/systems/state";
import { Audio } from "../src/systems/audio";

it("permite subir y bajar por el centro, y las barandillas evitan la caída", () => {
  const world = new World(0, [], [], []);
  expect(mansionFloorHeight(5, -1.5)).toBe(0);
  expect(mansionFloorHeight(5, -3.25)).toBeGreaterThan(1);
  expect(mansionFloorHeight(5, -5.8)).toBeCloseTo(2.64);
  expect(blocked(5, -3.25, world.obstacles)).toBe(false);
  expect(blocked(3.51, -3.25, world.obstacles)).toBe(true);
  expect(blocked(5, -6.66, world.obstacles)).toBe(true);
  world.dispose();
});

it("agrupa los detalles arquitectónicos con geometrías compatibles", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const group = mansion([]);
    expect(error).not.toHaveBeenCalled();
    const meshes = group.children.filter(
      (object): object is T.Mesh => object instanceof T.Mesh,
    );
    expect(meshes.length).toBeGreaterThan(8);
    expect(
      meshes.reduce(
        (sum, mesh) =>
          sum +
          (mesh.geometry.index
            ? mesh.geometry.index.count / 3
            : mesh.geometry.attributes.position.count / 3),
        0,
      ),
    ).toBeGreaterThan(10000);
  } finally {
    error.mockRestore();
  }
});

it("separa la pista del rellano de los objetos de la planta baja", () => {
  const world = new World(0, [], [], []);
  expect(world.nearest(4.35, -6.1, 1.9, 2.64)?.id).toBe("gallery-chart");
  expect(world.nearest(4.35, -6.1, 1.9, 0)?.id).not.toBe("gallery-chart");
  const portal = world.objects.find((object) => object.id === "roman-portal")!;
  expect(mansionFloorHeight(portal.x, portal.z)).toBe(0);
  expect(blocked(portal.x, portal.z, world.obstacles)).toBe(false);
  expect(blocked(6.8, 3, world.obstacles, 0.2)).toBe(false);
  expect(blocked(6.8, 0.7, world.obstacles, 0.2)).toBe(true);
  expect(world.nearest(portal.x, portal.z, 1.9, 0)?.id).toBe("roman-portal");
  const camera = new T.PerspectiveCamera();
  const director = new CinematicCamera();
  director.update(camera, 5, -5.8, 0, 0, false, world.obstacles, {
    mode: "classic",
    height: 2.64,
  });
  expect(director.zone).toBe("rellano superior");
  expect(director.corrected).toBe(false);
  world.dispose();
});

it("encuadra el acceso romano y separa la carta de la silueta de Élise", () => {
  const world = new World(0, [], [], []);
  const camera = new T.PerspectiveCamera(58, 960 / 640);
  const director = new CinematicCamera();
  director.update(camera, 5.05, 3, 0, 0, false, world.obstacles, {
    mode: "classic",
  });
  expect(director.zone).toBe("umbral romano");
  expect(director.corrected).toBe(false);
  camera.updateMatrixWorld();
  const gate = new T.Vector3(6.2, 1.4, 3).project(camera);
  expect(Math.abs(gate.x)).toBeLessThan(0.65);
  expect(Math.abs(gate.y)).toBeLessThan(0.7);

  director.update(camera, 5.8, -6, 0, 0, false, world.obstacles, {
    mode: "classic",
    height: 2.64,
  });
  expect(director.zone).toBe("rellano superior");
  expect(director.corrected).toBe(false);
  camera.updateMatrixWorld();
  const chart = new T.Vector3(3.98, 3.56, -5.55).project(camera);
  const elise = new T.Vector3(5.8, 3.89, -6).project(camera);
  expect(Math.abs(chart.x)).toBeLessThan(0.75);
  expect(Math.abs(chart.y)).toBeLessThan(0.7);
  expect(Math.abs(chart.x - elise.x)).toBeGreaterThan(0.18);
  world.dispose();
});

it("la madera de la escalera conserva el paso audible con un timbre propio", () => {
  const audio = new Audio();
  const tone = vi.spyOn(audio, "tone");
  audio.step(0, false, true);
  expect(tone).toHaveBeenCalledWith(63, 0.15, "triangle");
});
